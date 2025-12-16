import { useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import { Booking, GymConfig, SessionTemplate, UserProfile, WorkoutResult } from './types';
import BookingBoard from './features/bookings/BookingBoard';
import MembershipOverview from './features/plans/MembershipOverview';
import NotificationCenter from './features/notifications/NotificationCenter';
import SessionOfTheDay from './features/dashboard/SessionOfTheDay';
import { SafetyCallouts } from './components/SafetyCallouts';
import { SupabaseStatus } from './components/SupabaseStatus';
import { EntitlementsGuard } from './features/bookings/EntitlementsGuard';

const defaultGym: GymConfig = {
  id: 'gym-paris-1',
  name: 'Blue Peak Performance',
  timezone: 'Europe/Paris',
  locale: 'fr',
  bookingWindowDays: 14,
  bookingCutoffMinutes: 60,
  allowOverbooking: false,
  waitlistAutoPromote: true,
  waitlistResponseWindowMinutes: 30
};

const sessionTemplates: SessionTemplate[] = [
  {
    id: 'sess-1',
    date: DateTime.now().setZone('Europe/Paris').toISODate() ?? '',
    startTime: '06:30',
    endTime: '07:30',
    type: 'CrossFit',
    capacity: 14,
    location: 'Salle 1',
    coachId: 'coach-1',
    bookingOpenAt: DateTime.now().minus({ days: 2 }).toISO(),
    bookingCloseAt: DateTime.now().plus({ hours: 1 }).toISO(),
    notes: 'Skill : gymnastic strict + metcon for time.',
    allowGuests: true
  },
  {
    id: 'sess-2',
    date: DateTime.now().plus({ days: 1 }).setZone('Europe/Paris').toISODate() ?? '',
    startTime: '18:00',
    endTime: '19:00',
    type: 'Hyrox',
    capacity: 12,
    location: 'Salle 1',
    coachId: 'coach-2',
    bookingOpenAt: DateTime.now().minus({ days: 3 }).toISO(),
    bookingCloseAt: DateTime.now().plus({ hours: 6 }).toISO(),
    notes: 'Block de sled push + burpee broad jumps.',
    allowGuests: false
  },
  {
    id: 'sess-3',
    date: DateTime.now().plus({ days: 2 }).toISODate() ?? '',
    startTime: '12:30',
    endTime: '14:00',
    type: 'Open Gym',
    capacity: 20,
    location: 'Salle 2',
    coachId: 'coach-3',
    bookingOpenAt: DateTime.now().minus({ days: 1 }).toISO(),
    bookingCloseAt: DateTime.now().plus({ hours: 30 }).toISO(),
    notes: 'Free programming, accompagnement coach pour PR sécurité.',
    allowGuests: true
  }
];

const defaultUser: UserProfile = {
  id: 'user-1',
  fullName: 'Alex Martin',
  email: 'alex@example.com',
  role: 'user',
  gymId: defaultGym.id,
  status: 'active',
  entitlements: [
    {
      id: 'sub-1',
      name: 'Abonnement Premium 12 mois',
      type: 'subscription',
      validFrom: DateTime.now().minus({ months: 1 }).toISO(),
      validTo: DateTime.now().plus({ months: 11 }).toISO(),
      maxSessionsPerWeek: 5,
      maxSessionsPerMonth: 18,
      maxPerDay: 2,
      allowedSessionTypes: ['CrossFit', 'Hyrox', 'Open Gym', 'Strength', 'Conditioning'],
      earlyBookingDays: 14,
      cancellationFreeHours: 4,
      lateCancelPenalty: { id: 'pen-1', label: 'Perte crédit + blocage 24h', blockDays: 1, consumeCredit: true },
      noShowPenalty: { id: 'pen-2', label: 'Blocage 72h', blockDays: 3, consumeCredit: true },
      transferable: false,
      credits: null
    },
    {
      id: 'pack-guest',
      name: 'Pack invité 5 drop-in',
      type: 'pack',
      validFrom: DateTime.now().minus({ weeks: 2 }).toISO(),
      validTo: DateTime.now().plus({ months: 2 }).toISO(),
      maxSessionsPerWeek: null,
      maxSessionsPerMonth: null,
      maxPerDay: 1,
      allowedSessionTypes: ['CrossFit', 'Hyrox'],
      earlyBookingDays: 10,
      cancellationFreeHours: 6,
      lateCancelPenalty: { id: 'pen-3', label: 'Perte séance pack', consumeCredit: true },
      noShowPenalty: { id: 'pen-4', label: 'Blocage 48h + perte séance', blockDays: 2, consumeCredit: true },
      transferable: true,
      credits: 5
    }
  ]
};

const initialBookings: Booking[] = [
  {
    id: 'bk-1',
    sessionId: 'sess-1',
    userId: defaultUser.id,
    status: 'confirmed',
    createdAt: DateTime.now().minus({ days: 1 }).toISO(),
    isGuest: false
  },
  {
    id: 'bk-2',
    sessionId: 'sess-2',
    userId: defaultUser.id,
    status: 'waitlist',
    createdAt: DateTime.now().minus({ hours: 2 }).toISO(),
    isGuest: false
  }
];

const initialResults: WorkoutResult[] = [
  {
    id: 'res-1',
    sessionId: 'sess-1',
    userId: defaultUser.id,
    content: 'For Time 12:43 avec RX complet',
    isPersonalRecord: true,
    recordedBy: 'coach'
  }
];

function App() {
  const [activeTab, setActiveTab] = useState<'agenda' | 'bookings' | 'tracking' | 'menu'>('agenda');
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [results, setResults] = useState<WorkoutResult[]>(initialResults);

  const sessionWithStates = useMemo(
    () =>
      sessionTemplates.map((session) => {
        const related = bookings.filter((b) => b.sessionId === session.id);
        const confirmed = related.filter((b) => b.status === 'confirmed').length;
        const waitlisted = related.filter((b) => b.status === 'waitlist').length;
        return { ...session, confirmed, waitlisted };
      }),
    [bookings]
  );

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24 pt-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-secondary-gray">{defaultGym.name}</p>
          <h1 className="text-2xl font-bold text-primary-dark">Réservations sans compromis</h1>
        </div>
        <SupabaseStatus />
      </header>

      <SafetyCallouts />

      <div className="grid gap-4">
        {activeTab === 'agenda' && (
          <>
            <SessionOfTheDay session={sessionTemplates[0]} gym={defaultGym} results={results} />
            <EntitlementsGuard user={defaultUser} gym={defaultGym}>
              <BookingBoard
                gym={defaultGym}
                sessions={sessionWithStates}
                bookings={bookings}
                user={defaultUser}
                onBookingsChange={setBookings}
              />
            </EntitlementsGuard>
          </>
        )}

        {activeTab === 'bookings' && (
          <MembershipOverview user={defaultUser} bookings={bookings} results={results} />
        )}

        {activeTab === 'tracking' && <NotificationCenter user={defaultUser} bookings={bookings} gym={defaultGym} />}

        {activeTab === 'menu' && (
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-primary-dark">Menu & Paramètres</h2>
            <ul className="space-y-2 text-sm text-secondary-gray">
              <li>Sécurité compte : authentification Supabase + RLS strict</li>
              <li>Facturation : Stripe Checkout + Portal prêts</li>
              <li>Exports légaux : factures PDF et audit trail</li>
              <li>Support : e-mail automatique en cas d’erreur réseau</li>
            </ul>
          </div>
        )}
      </div>

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-xl bg-white rounded-3xl shadow-card px-4 py-3 flex justify-around text-sm font-semibold text-secondary-gray">
        {[
          { key: 'agenda', label: 'Calendrier' },
          { key: 'bookings', label: 'Mes Résas' },
          { key: 'tracking', label: 'Suivi' },
          { key: 'menu', label: 'Menu' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-3 py-2 rounded-pill ${activeTab === tab.key ? 'bg-primary text-white' : 'bg-primary-light text-primary-dark'}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
