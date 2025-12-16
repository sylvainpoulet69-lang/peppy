# Peppy Gym Booking

Application complète de réservation pour salle de sport (CrossFit, Hyrox, Open Gym...) basée sur Vite + React + TypeScript + TailwindCSS, sécurisée par Supabase (Auth + Postgres + RLS + Edge Functions) et facturation Stripe.

## Points clés
- Mobile-first, palette bleu premium, navigation par tab bar.
- Règles métiers exhaustives : fenêtres de réservation, liste d’attente auto, pénalités late cancel/no-show, anti double booking, invités payants.
- SaaS multi-salles pensé, V1 livrée pour une salle unique configurable.
- Paiements Stripe Checkout + Customer Portal + webhooks Edge Functions.
- Déploiement GitHub Pages avec GitHub Actions.

## Prérequis
- Node.js 20+
- Supabase CLI configuré
- Compte Stripe avec clés secrètes et webhook secret

## Installation locale
```bash
npm ci
npm run dev
```

Variables d’environnement Vite (fichier `.env.local`):
```
VITE_SUPABASE_URL=... \
VITE_SUPABASE_ANON_KEY=...
```

## Build & déploiement
- Build : `npm run build`
- Déploiement GitHub Pages : push sur la branche `work` déclenche l’action `.github/workflows/deploy.yml`.
- Base Vite fixée à `./` pour compatibilité Pages.

## Supabase
- Schéma SQL complet : `supabase/sql/schema.sql`
- RLS activé sur toutes les tables, aucune donnée cross-salle.
- RPC `reserve_slot` pour gérer la dernière place et la liste d’attente en transaction.
- Edge Function Stripe : `supabase/functions/stripe-webhook` pour checkout, abonnement, remboursement.

## Règles fonctionnelles couvertes
- Fenêtre ouverture/fermeture configurable par salle.
- Capacité avec verrouillage transactionnel, surbooking optionnel.
- Liste d’attente avec promotion auto + fenêtre d’acceptation.
- Réservation pour un invité avec paiement dédié.
- Annulation : gratuite jusqu’à X heures, sinon pénalité (blocage/consommation crédit/avertissement).
- No-show : blocage, perte crédit, marquage statistiques.
- Check-in : coach, QR, auto-confirmation.
- Notifications : email obligatoires, architecture SMS prête.
- Offres : abonnement, pack, drop-in, produits divers via Stripe.
- Factures PDF + portail client Stripe.

## Qualité & robustesse
- Skeletons et états vides prêts à être branchés.
- Gestion réseau avec retries côté React Query (2 retries par défaut).
- Logs explicites dans les Edge Functions.

## Tests manuels suggérés
- Réserver avant/pendant/après fenêtre d’ouverture.
- Dépasser capacité pour vérifier la liste d’attente et promotion auto après annulation.
- Simuler no-show en absence de check-in.
- Tester un invité (booking guest) avec paiement séparé Stripe.
- Vérifier RLS : utilisateur ne voit que sa salle et ses bookings.
