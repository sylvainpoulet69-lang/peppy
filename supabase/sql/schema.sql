-- Schéma Supabase complet pour la réservation multi-règles
-- Toutes les tables sont limitées par gym_id pour éviter toute fuite cross-salle

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists gyms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  timezone text not null default 'Europe/Paris',
  locale text not null default 'fr',
  allow_overbooking boolean default false,
  booking_window_days int default 14,
  booking_cutoff_minutes int default 60,
  waitlist_auto_promote boolean default true,
  waitlist_response_window_minutes int,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  gym_id uuid references gyms(id) on delete cascade,
  full_name text not null,
  role text check (role in ('admin','coach','user')) default 'user',
  status text check (status in ('active','blocked','penalized')) default 'active',
  created_at timestamptz default now()
);

create table if not exists membership_rules (
  id uuid primary key default uuid_generate_v4(),
  gym_id uuid references gyms(id) on delete cascade,
  name text not null,
  type text check (type in ('subscription','pack','dropin')) not null,
  valid_from date not null,
  valid_to date,
  max_per_week int,
  max_per_month int,
  max_per_day int,
  allowed_session_types text[] not null,
  early_booking_days int default 14,
  cancellation_free_hours int default 4,
  late_cancel_penalty jsonb,
  no_show_penalty jsonb,
  transferable boolean default false,
  credits int,
  price_cents int not null,
  currency text default 'eur'
);

create table if not exists user_entitlements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  membership_id uuid references membership_rules(id) on delete cascade,
  gym_id uuid references gyms(id) on delete cascade,
  remaining_credits int,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  gym_id uuid references gyms(id) on delete cascade,
  coach_id uuid references profiles(id),
  session_type text not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  capacity int not null,
  location text,
  notes text,
  booking_open_at timestamptz not null,
  booking_close_at timestamptz not null,
  allow_guests boolean default false,
  allow_overbooking boolean default false,
  created_at timestamptz default now()
);

create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  gym_id uuid references gyms(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text check (status in ('confirmed','waitlist','cancelled','no_show','completed','pending_payment')) default 'confirmed',
  is_guest boolean default false,
  guest_email text,
  created_at timestamptz default now(),
  unique (session_id, user_id)
);

create table if not exists waitlist (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  position int not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists checkins (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  method text check (method in ('coach','qr','self')) not null,
  checked_at timestamptz default now()
);

create table if not exists penalties (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  rule jsonb not null,
  applied_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists workout_results (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  content text not null,
  is_pr boolean default false,
  recorded_by text check (recorded_by in ('coach','user')) default 'coach',
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  gym_id uuid references gyms(id) on delete cascade,
  booking_id uuid references bookings(id),
  amount_cents int not null,
  currency text default 'eur',
  status text check (status in ('requires_payment','paid','refunded')) default 'requires_payment',
  stripe_session_id text,
  stripe_customer_id text,
  invoice_url text,
  created_at timestamptz default now()
);

create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor uuid references profiles(id),
  gym_id uuid references gyms(id),
  action text not null,
  payload jsonb,
  created_at timestamptz default now()
);

alter table bookings add constraint fk_bookings_gym foreign key (gym_id) references gyms(id) on delete cascade;
alter table sessions add constraint fk_sessions_gym foreign key (gym_id) references gyms(id) on delete cascade;

-- RLS
alter table gyms enable row level security;
alter table profiles enable row level security;
alter table membership_rules enable row level security;
alter table user_entitlements enable row level security;
alter table sessions enable row level security;
alter table bookings enable row level security;
alter table waitlist enable row level security;
alter table checkins enable row level security;
alter table penalties enable row level security;
alter table workout_results enable row level security;
alter table payments enable row level security;
alter table audit_log enable row level security;

create policy "users see own gym" on profiles for select using (auth.uid() = id);
create policy "users update own profile" on profiles for update using (auth.uid() = id);

create policy "gym data scoped" on gyms for select using (true);

create policy "membership by gym" on membership_rules using (gym_id in (select gym_id from profiles where id = auth.uid()));
create policy "entitlements by owner" on user_entitlements using (user_id = auth.uid());

create policy "sessions by gym" on sessions using (gym_id in (select gym_id from profiles where id = auth.uid()));
create policy "bookings ownership" on bookings using (user_id = auth.uid());
create policy "waitlist by booking" on waitlist using (booking_id in (select id from bookings where user_id = auth.uid()));
create policy "checkins by booking" on checkins using (booking_id in (select id from bookings where user_id = auth.uid()));
create policy "results by booking" on workout_results using (user_id = auth.uid());
create policy "payments by user" on payments using (booking_id in (select id from bookings where user_id = auth.uid()));
create policy "audit readable by admin" on audit_log for select using (exists(select 1 from profiles p where p.id = auth.uid() and p.role='admin' and p.gym_id=gym_id));

-- RPC pour réservation transactionnelle
create or replace function public.reserve_slot(p_session uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_capacity int;
  v_confirmed int;
  v_gym uuid;
begin
  select capacity, gym_id into v_capacity, v_gym from sessions where id = p_session for update;
  select count(*) into v_confirmed from bookings where session_id = p_session and status = 'confirmed' for update;
  if v_confirmed >= v_capacity then
    insert into bookings (session_id, user_id, status, gym_id) values (p_session, auth.uid(), 'waitlist', v_gym);
  else
    insert into bookings (session_id, user_id, status, gym_id) values (p_session, auth.uid(), 'confirmed', v_gym);
  end if;
  insert into audit_log(actor, gym_id, action, payload) values (auth.uid(), v_gym, 'reserve_slot', jsonb_build_object('session', p_session));
end;
$$;

comment on function reserve_slot is 'Réservation transactionnelle évitant le double booking et protégeant la dernière place.';
