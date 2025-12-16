import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import { Booking, GymConfig, SessionTemplate, UserProfile } from '../../types';
import { validateBooking } from './bookingRules';
import { BookingCard } from './BookingCard';
import { WaitlistExplainer } from './WaitlistExplainer';

interface Props {
  gym: GymConfig;
  sessions: (SessionTemplate & { confirmed: number; waitlisted: number })[];
  bookings: Booking[];
  user: UserProfile;
  onBookingsChange: (bookings: Booking[]) => void;
}

const formatDate = (date: string, timezone: string) => DateTime.fromISO(date, { zone: timezone }).setLocale('fr').toFormat('cccc d LLL');

const BookingBoard = ({ gym, sessions, bookings, user, onBookingsChange }: Props) => {
  const [message, setMessage] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, (SessionTemplate & { confirmed: number; waitlisted: number })[]>();
    sessions.forEach((session) => {
      const label = formatDate(session.date, gym.timezone);
      const existing = map.get(label) ?? [];
      existing.push(session);
      map.set(label, existing);
    });
    return Array.from(map.entries());
  }, [sessions, gym.timezone]);

  const book = (session: SessionTemplate & { confirmed: number; waitlisted: number }) => {
    const now = DateTime.now().setZone(gym.timezone);
    const validation = validateBooking({
      session,
      user,
      bookings,
      now,
      gym
    });

    if (!validation.ok) {
      setMessage(validation.reason);
      return;
    }

    const alreadyBooked = bookings.find((b) => b.sessionId === session.id && b.userId === user.id);

    if (alreadyBooked) {
      setMessage('Réservation déjà existante, double booking bloqué.');
      return;
    }

    const spotAvailable = session.confirmed < session.capacity || gym.allowOverbooking;
    const newBooking: Booking = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      userId: user.id,
      status: spotAvailable ? 'confirmed' : 'waitlist',
      createdAt: now.toISO(),
      isGuest: false
    };

    const updated = [...bookings, newBooking];
    onBookingsChange(updated);
    setMessage(spotAvailable ? 'Place confirmée immédiatement.' : 'Ajouté en liste d’attente avec priorité chronologique.');
  };

  const cancel = (booking: Booking) => {
    const session = sessions.find((s) => s.id === booking.sessionId);
    if (!session) return;
    const now = DateTime.now().setZone(gym.timezone);
    const start = DateTime.fromISO(`${session.date}T${session.startTime}`, { zone: gym.timezone });
    const hoursBefore = start.diff(now, 'hours').hours;

    const entitlement = user.entitlements.find((e) => e.allowedSessionTypes.includes(session.type));
    const freeCancellation = entitlement ? hoursBefore >= entitlement.cancellationFreeHours : false;

    const updated = bookings.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b));

    if (!freeCancellation) {
      const penalty = entitlement?.lateCancelPenalty;
      if (penalty?.blockDays) {
        setMessage(`Annulation tardive : blocage ${penalty.blockDays} jour(s) et consommation de crédit si applicable.`);
      } else if (penalty?.consumeCredit) {
        setMessage('Annulation tardive : crédit consommé.');
      } else {
        setMessage('Annulation enregistrée avec avertissement.');
      }
    } else {
      setMessage('Annulation gratuite effectuée.');
    }

    if (booking.status === 'confirmed') {
      const nextWaitlisted = bookings.find((b) => b.sessionId === booking.sessionId && b.status === 'waitlist');
      if (nextWaitlisted && gym.waitlistAutoPromote) {
        updated.push({ ...nextWaitlisted, status: 'confirmed' });
        setMessage('Une personne en attente a été automatiquement confirmée et notifiée.');
      }
    }

    onBookingsChange(updated);
  };

  return (
    <div className="space-y-4">
      {message && <div className="card bg-primary-light text-primary-dark text-sm">{message}</div>}
      {grouped.map(([date, sess]) => (
        <div key={date} className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-primary-dark">{date}</h3>
            <span className="pill">Europe/Paris</span>
          </div>
          <div className="space-y-3">
            {sess.map((session) => (
              <BookingCard
                key={session.id}
                session={session}
                gym={gym}
                booking={bookings.find((b) => b.sessionId === session.id && b.userId === user.id) ?? null}
                onBook={() => book(session)}
                onCancel={(booking) => cancel(booking)}
              />
            ))}
          </div>
          <WaitlistExplainer />
        </div>
      ))}
    </div>
  );
};

export default BookingBoard;
