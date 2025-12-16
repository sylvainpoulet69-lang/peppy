export const PaymentCTA = () => (
  <div className="bg-primary-light rounded-2xl p-4 text-sm text-primary-dark space-y-2">
    <p className="font-semibold">Paiements sécurisés Stripe</p>
    <ul className="list-disc pl-4 space-y-1">
      <li>Checkout pour abonnements, packs, drop-in et produits.</li>
      <li>Webhooks Edge Functions pour synchroniser les factures et crédits.</li>
      <li>Customer Portal activé pour que l’utilisateur gère ses moyens de paiement.</li>
      <li>Remboursement automatique ou crédit interne si séance annulée par l’admin.</li>
    </ul>
    <button className="btn-primary w-full">Ouvrir le portail Stripe</button>
  </div>
);
