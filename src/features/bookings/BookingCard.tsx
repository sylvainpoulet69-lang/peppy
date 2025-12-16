import { DateTime } from 'luxon';
import { Booking, GymConfig, SessionTemplate } from '../../types';

interface Props {
  session: SessionTemplate & { confirmed: number; waitlisted: number };
  gym: GymConfig;
  booking: Booking | null;
  onBook: () => void;
  onCancel: (booking: Booking) => void;
}

export const BookingCard = ({ session, gym, booking, onBook, onCancel }: Props) => {
  const start = DateTime.fromISO(`${session.date}T${session.startTime}`, { zone: gym.timezone });
  const end = DateTime.fromISO(`${session.date}T${session.endTime}`, { zone: gym.timezone });
  const now = DateTime.now().setZone(gym.timezone);

  const isOpen = now >= DateTime.fromISO(session.bookingOpenAt) && now <= DateTime.fromISO(session.bookingCloseAt);
  const capacityReached = session.confirmed >= session.capacity;

  const actionLabel = booking ? 'Annuler' : capacityReached ? 'Liste d’attente' : 'Réserver';
  const disabled = !isOpen || (booking?.status === 'cancelled');

  return (
    <div className="border border-primary-light rounded-3xl p-4 flex flex-col gap-2 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-secondary-gray">{start.toFormat('HH:mm')} - {end.toFormat('HH:mm')}</p>
          <h4 className="text-lg font-semibold text-primary-dark">{session.type}</h4>
          <p className="text-sm text-secondary-gray">{session.location}</p>
        </div>
        <div className="text-right">
          <span className="pill">Capacité {session.confirmed}/{session.capacity}</span>
          <p className="text-xs text-secondary-gray">Attente : {session.waitlisted}</p>
        </div>
      </div>
      <p className="text-sm text-secondary-gray">{session.notes}</p>
      <div className="flex items-center gap-3">
        <button
          className={`flex-1 ${booking ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => (booking ? onCancel(booking) : onBook())}
          disabled={disabled}
        >
          {actionLabel}
        </button>
        {booking && booking.status === 'waitlist' && <span className="pill bg-primary text-white">Attente</span>}
        {booking && booking.status === 'confirmed' && <span className="pill bg-green-100 text-primary-dark">Confirmé</span>}
      </div>
      {!isOpen && <p className="text-xs text-amber-700">Fenêtre de réservation fermée (ouverture J-{gym.bookingWindowDays}, fermeture H-{gym.bookingCutoffMinutes / 60}).</p>}
      {capacityReached && !booking && <p className="text-xs text-amber-700">Capacité atteinte, bascule automatique en liste d’attente.</p>}
    </div>
  );
};
