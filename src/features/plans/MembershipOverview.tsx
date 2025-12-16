import { Booking, UserProfile, WorkoutResult } from '../../types';
import { PaymentCTA } from './PaymentCTA';

interface Props {
  user: UserProfile;
  bookings: Booking[];
  results: WorkoutResult[];
}

const MembershipOverview = ({ user, bookings, results }: Props) => {
  const active = user.entitlements.map((e) => (
    <div key={e.id} className="border border-primary-light rounded-3xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-secondary-gray">{e.type === 'subscription' ? 'Abonnement' : e.type === 'pack' ? 'Pack' : 'Drop-in'}</p>
          <h3 className="text-lg font-semibold text-primary-dark">{e.name}</h3>
        </div>
        <span className="pill">{e.allowedSessionTypes.join(', ')}</span>
      </div>
      <p className="text-sm text-secondary-gray">Validité : {e.validFrom.split('T')[0]} → {e.validTo ?? 'illimité'}</p>
      <p className="text-sm text-secondary-gray">Quotas : semaine {e.maxSessionsPerWeek ?? '∞'} / mois {e.maxSessionsPerMonth ?? '∞'} / jour {e.maxPerDay ?? '∞'}</p>
      <p className="text-sm text-secondary-gray">Annulation gratuite jusqu’à {e.cancellationFreeHours}h avant, pénalité late-cancel : {e.lateCancelPenalty?.label ?? 'aucune'}.</p>
      <p className="text-sm text-secondary-gray">No-show : {e.noShowPenalty?.label ?? 'avertissement'}</p>
      {e.credits !== null && <p className="text-sm text-primary-dark font-semibold">Crédits restants : {e.credits}</p>}
    </div>
  ));

  const lastResults = results.map((result) => (
    <li key={result.id} className="flex justify-between text-sm text-secondary-gray">
      <span>{result.content}</span>
      {result.isPersonalRecord && <span className="pill bg-green-100 text-primary-dark">PR</span>}
    </li>
  ));

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold text-primary-dark">Mes formules</h2>
        <div className="space-y-3">{active}</div>
        <PaymentCTA />
      </div>

      <div className="card space-y-3">
        <h3 className="text-lg font-semibold text-primary-dark">Historique résas</h3>
        <ul className="space-y-2 text-sm text-secondary-gray">
          {bookings.map((booking) => (
            <li key={booking.id} className="flex justify-between">
              <span>Session {booking.sessionId}</span>
              <span className="pill bg-primary-light text-primary-dark">{booking.status}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card space-y-3">
        <h3 className="text-lg font-semibold text-primary-dark">Résultats</h3>
        <ul className="space-y-2">{lastResults}</ul>
      </div>
    </div>
  );
};

export default MembershipOverview;
