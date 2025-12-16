import { DateTime } from 'luxon';
import { Booking, GymConfig, SessionTemplate, UserProfile } from '../../types';

interface ValidationInput {
  session: SessionTemplate;
  user: UserProfile;
  bookings: Booking[];
  now: DateTime;
  gym: GymConfig;
}

export const validateBooking = ({ session, user, bookings, now, gym }: ValidationInput) => {
  if (user.status !== 'active') {
    return { ok: false, reason: 'Compte bloqué ou pénalisé. Contactez un admin.' };
  }

  const start = DateTime.fromISO(`${session.date}T${session.startTime}`, { zone: gym.timezone });
  const open = DateTime.fromISO(session.bookingOpenAt, { zone: gym.timezone });
  const close = DateTime.fromISO(session.bookingCloseAt, { zone: gym.timezone });

  if (now < open) {
    return { ok: false, reason: 'Réservation non ouverte (fenêtre J-X).' };
  }

  if (now > close.minus({ minutes: gym.bookingCutoffMinutes })) {
    return { ok: false, reason: 'Clôture de réservation atteinte.' };
  }

  const entitlement = user.entitlements.find((e) => e.allowedSessionTypes.includes(session.type));
  if (!entitlement) {
    return { ok: false, reason: 'Votre formule ne couvre pas ce type de séance.' };
  }

  const weekStart = start.startOf('week');
  const weekBookings = bookings.filter((b) => b.userId === user.id && DateTime.fromISO(b.createdAt) >= weekStart);
  if (entitlement.maxSessionsPerWeek && weekBookings.length >= entitlement.maxSessionsPerWeek) {
    return { ok: false, reason: 'Quota hebdomadaire atteint.' };
  }

  const monthStart = start.startOf('month');
  const monthBookings = bookings.filter((b) => b.userId === user.id && DateTime.fromISO(b.createdAt) >= monthStart);
  if (entitlement.maxSessionsPerMonth && monthBookings.length >= entitlement.maxSessionsPerMonth) {
    return { ok: false, reason: 'Quota mensuel atteint.' };
  }

  const dayBookings = bookings.filter((b) => b.userId === user.id && b.sessionId === session.id && b.status !== 'cancelled');
  if (entitlement.maxPerDay && dayBookings.length >= entitlement.maxPerDay) {
    return { ok: false, reason: 'Nombre maximal de séances par jour atteint.' };
  }

  if (entitlement.credits !== null && entitlement.credits <= 0) {
    return { ok: false, reason: 'Crédits insuffisants pour réserver.' };
  }

  const overlapping = bookings.some((b) => {
    const bookedSession = b.sessionId === session.id ? session : null;
    if (!bookedSession) return false;
    const existingStart = DateTime.fromISO(`${bookedSession.date}T${bookedSession.startTime}`, { zone: gym.timezone });
    const existingEnd = DateTime.fromISO(`${bookedSession.date}T${bookedSession.endTime}`, { zone: gym.timezone });
    return now >= existingStart && now <= existingEnd;
  });

  if (overlapping) {
    return { ok: false, reason: 'Chevauchement détecté : impossible de réserver deux créneaux qui se recoupent.' };
  }

  if (start < now) {
    return { ok: false, reason: 'Impossible de réserver une séance passée.' };
  }

  return { ok: true } as const;
};
