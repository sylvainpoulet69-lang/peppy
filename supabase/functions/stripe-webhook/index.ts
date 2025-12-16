// Supabase Edge Function (Deno) pour sécuriser les webhooks Stripe
import 'https://deno.land/x/dotenv/load.ts';
import Stripe from 'https://esm.sh/stripe@14.22.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20'
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature') ?? '';
  const rawBody = await req.text();
  const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

  try {
    const event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckout(event);
        break;
      case 'customer.subscription.updated':
      case 'invoice.payment_succeeded':
        await handleSubscription(event);
        break;
      case 'charge.refunded':
        await handleRefund(event);
        break;
      default:
        console.log('Webhook ignoré', event.type);
    }
    return new Response('ok', { status: 200 });
  } catch (error) {
    console.error('Erreur webhook', error);
    return new Response('invalid', { status: 400 });
  }
});

async function handleCheckout(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata ?? {};
  const gymId = metadata.gym_id;
  const membershipId = metadata.membership_id;
  const userId = metadata.user_id;

  if (!gymId || !membershipId || !userId) {
    console.warn('Webhook sans métadonnées complètes');
    return;
  }

  await supabase.from('payments').insert({
    gym_id: gymId,
    booking_id: null,
    amount_cents: session.amount_total ?? 0,
    currency: session.currency ?? 'eur',
    status: 'paid',
    stripe_session_id: session.id,
    stripe_customer_id: session.customer as string,
    invoice_url: session.invoice ? `https://dashboard.stripe.com/invoices/${session.invoice}` : null
  });

  await supabase.from('user_entitlements').insert({
    user_id: userId,
    membership_id: membershipId,
    gym_id: gymId,
    remaining_credits: metadata.credits ? Number(metadata.credits) : null,
    active: true
  });
}

async function handleSubscription(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  if (!invoice.customer_email) return;
  await supabase.from('audit_log').insert({
    actor: null,
    gym_id: null,
    action: 'subscription_update',
    payload: { invoice: invoice.id, status: invoice.status }
  });
}

async function handleRefund(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  await supabase.from('payments')
    .update({ status: 'refunded' })
    .eq('stripe_session_id', charge.payment_intent as string);
}
