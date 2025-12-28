import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature')
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !endpointSecret) {
      throw new Error('Missing Stripe signature or webhook secret')
    }

    // Get the raw body
    const body = await req.text()

    // Verify the webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    console.log('Received webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string
          const userId = session.metadata?.supabase_user_id
          const planId = session.metadata?.plan_id
          const billingCycle = session.metadata?.billing_cycle

          if (userId && planId) {
            // Get subscription details from Stripe
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)

            // Update or create subscription in database
            const { error } = await supabaseClient
              .from('subscriptions')
              .upsert({
                user_id: userId,
                plan_id: planId,
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: customerId,
                status: subscription.status,
                billing_cycle: billingCycle,
                current_period_start: new Date(subscription.current_period_start * 1000),
                current_period_end: new Date(subscription.current_period_end * 1000),
                cancel_at_period_end: subscription.cancel_at_period_end,
                updated_at: new Date(),
              })

            if (error) {
              console.error('Error updating subscription:', error)
            } else {
              console.log('Subscription created/updated successfully')
            }
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const { error } = await supabaseClient
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error updating subscription:', error)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { error } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error canceling subscription:', error)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          // Record successful payment
          const { error } = await supabaseClient
            .from('payments')
            .insert({
              user_id: invoice.customer_metadata?.supabase_user_id,
              subscription_id: invoice.subscription as string,
              stripe_payment_intent_id: invoice.payment_intent as string,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: 'succeeded',
              description: `Payment for ${invoice.period_start} - ${invoice.period_end}`,
            })

          if (error) {
            console.error('Error recording payment:', error)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          // Record failed payment
          const { error } = await supabaseClient
            .from('payments')
            .insert({
              user_id: invoice.customer_metadata?.supabase_user_id,
              subscription_id: invoice.subscription as string,
              stripe_payment_intent_id: invoice.payment_intent as string,
              amount: invoice.amount_due,
              currency: invoice.currency,
              status: 'failed',
              description: `Failed payment for ${invoice.period_start} - ${invoice.period_end}`,
            })

          if (error) {
            console.error('Error recording failed payment:', error)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
