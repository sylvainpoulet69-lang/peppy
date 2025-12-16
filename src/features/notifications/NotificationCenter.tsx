import { Booking, GymConfig, UserProfile } from '../../types';

interface Props {
  user: UserProfile;
  bookings: Booking[];
  gym: GymConfig;
}

const NotificationCenter = ({ bookings, gym }: Props) => {
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary-dark">Notifications</h2>
        <span className="pill">Email</span>
      </div>
      <ul className="space-y-2 text-sm text-secondary-gray">
        {bookings.map((booking) => (
          <li key={booking.id} className="flex flex-col">
            <span>Session {booking.sessionId} — statut {booking.status}</span>
            <span className="text-xs">Fuseau appliqué : {gym.timezone}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-secondary-gray">
        Les notifications sont envoyées pour : confirmation, passage de liste d’attente à confirmé, annulation, rappel séance, pénalités,
        paiements et factures. Les erreurs réseau sont rejouées avec backoff exponentiel.
      </p>
    </div>
  );
};

export default NotificationCenter;
