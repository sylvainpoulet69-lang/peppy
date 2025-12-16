import { ReactNode } from 'react';
import { DateTime } from 'luxon';
import { GymConfig, UserProfile } from '../../types';

interface Props {
  children: ReactNode;
  user: UserProfile;
  gym: GymConfig;
}

export const EntitlementsGuard = ({ children, user, gym }: Props) => {
  const active = user.entitlements.some((e) => {
    const now = DateTime.now().setZone(gym.timezone);
    const start = DateTime.fromISO(e.validFrom, { zone: gym.timezone });
    const end = e.validTo ? DateTime.fromISO(e.validTo, { zone: gym.timezone }) : null;
    return now >= start && (!end || now <= end);
  });

  if (!active) {
    return (
      <div className="card text-sm text-secondary-gray">
        Aucune formule active. Veuillez acheter un abonnement, un pack ou un drop-in via Stripe Checkout pour débloquer les
        réservations.
      </div>
    );
  }

  return <>{children}</>;
};
