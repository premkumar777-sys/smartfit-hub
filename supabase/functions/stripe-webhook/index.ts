
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
        return new Response("Missing signature or webhook secret", { status: 400 });
    }

    const body = await req.text();
    let event;

    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret,
            undefined,
            cryptoProvider
        );
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Webhook signature verification failed.`, errorMessage);
        return new Response(errorMessage, { status: 400 });
    }

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") as string,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string
    );

    console.log(`Processing event: ${event.type}`);

    try {
        switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
                const subscription = event.data.object;

                // Map Stripe price ID to our Plan ID
                // In production, you might query the 'plans' table to find the matching plan_id
                const priceId = subscription.items.data[0].price.id;
                let planId = 'free';

                // This mapping should match the Price IDs in your Stripe Dashboard
                // For MVP, checking against the ones in schema.sql
                if (priceId === 'price_1SjCJHCn98QGMABleFu4j9lW') { // Monthly
                    planId = 'premium';
                } else if (priceId === 'price_year_placeholder') { // Yearly (Update with real ID)
                    planId = 'premium';
                }

                // Get User ID from Stripe Customer Metadata (We must ensure we send this during Checkout)
                // Fallback: Query by stripe_customer_id if it already exists
                let userId = subscription.metadata.userId;

                if (!userId) {
                    // Try to find user by customer_id if we don't have metadata (e.g. update event)
                    const { data: existingSub } = await supabase
                        .from('subscriptions')
                        .select('user_id')
                        .eq('stripe_customer_id', subscription.customer)
                        .single();

                    if (existingSub) {
                        userId = existingSub.user_id;
                    } else {
                        console.error("No User ID found for subscription:", subscription.id);
                        // Can't proceed without user_id unless we lookup by email from Customer object
                        // For now, return ok to acknowledge event
                        return new Response(JSON.stringify({ received: true, warning: 'No user_id found' }), { headers: { "Content-Type": "application/json" } });
                    }
                }

                const { error } = await supabase
                    .from("subscriptions")
                    .upsert({
                        user_id: userId,
                        stripe_subscription_id: subscription.id,
                        stripe_customer_id: subscription.customer,
                        plan_id: planId,
                        status: subscription.status,
                        billing_cycle: subscription.plan.interval === 'year' ? 'yearly' : 'monthly',
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        cancel_at_period_end: subscription.cancel_at_period_end,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'stripe_subscription_id' }); // Conflict on subscription ID

                if (error) throw error;
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object;
                // Optional: Record payment history
                if (invoice.subscription) {
                    const { data: sub } = await supabase.from('subscriptions').select('id, user_id').eq('stripe_subscription_id', invoice.subscription).single();

                    if (sub) {
                        await supabase.from('payments').insert({
                            user_id: sub.user_id,
                            subscription_id: sub.id,
                            stripe_payment_intent_id: invoice.payment_intent,
                            amount: invoice.amount_paid,
                            currency: invoice.currency,
                            status: 'succeeded',
                            description: `Invoice ${invoice.number}`
                        });
                    }
                }
                break;
            }

            case "checkout.session.completed": {
                // This is often where we first link the customer if we passed client_reference_id
                const session = event.data.object;
                if (session.mode === 'subscription') {
                    // We can handle initial setup here if subscription.created didn't have metadata
                    // But usually subscription.created fires before this or essentially same time
                }
                break;
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error processing event:", error);
        return new Response(JSON.stringify({ error: errorMessage }), { status: 400 });
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
    });
});
