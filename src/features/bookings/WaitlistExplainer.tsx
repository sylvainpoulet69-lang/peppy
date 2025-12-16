export const WaitlistExplainer = () => (
  <div className="bg-primary-light rounded-2xl p-3 text-sm text-primary-dark">
    <p className="font-semibold">Politique liste d’attente</p>
    <ul className="list-disc pl-4 space-y-1">
      <li>Ordre strict par timestamp serveur.</li>
      <li>Promotion automatique dès qu’une place se libère.</li>
      <li>Fenêtre d’acceptation configurable (30 minutes par défaut) avant de passer au suivant.</li>
      <li>Notifications e-mail envoyées à chaque changement de statut.</li>
    </ul>
  </div>
);
