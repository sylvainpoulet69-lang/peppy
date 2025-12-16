const bullet = '•';

export const SafetyCallouts = () => (
  <div className="card space-y-3">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-primary-dark">Garde-fous activés</h2>
      <span className="pill">Anti-abus</span>
    </div>
    <ul className="text-sm text-secondary-gray space-y-1">
      <li>{bullet} Fenêtres d’ouverture/fermeture de résa respectées automatiquement</li>
      <li>{bullet} Double-booking bloqué côté serveur (RPC transactionnelle)</li>
      <li>{bullet} Liste d’attente prioritaire avec notifications et délai d’acceptation</li>
      <li>{bullet} Pénalités no-show et late-cancel appliquées sans contournement</li>
      <li>{bullet} RLS Supabase stricte + audit log sur chaque action sensible</li>
    </ul>
  </div>
);
