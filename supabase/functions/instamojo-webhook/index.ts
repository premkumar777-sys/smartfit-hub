// Instamojo Webhook Handler
// This function receives payment notifications from Instamojo,
// records payments/subscriptions, and dispatches Brevo notifications.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  sendEmail, 
  subscriptionConfirmationTemplate, 
  paymentSuccessTemplate, 
  paymentFailedTemplate 
} from '../_shared/email.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Duration mapping for plans
const PLAN_DURATIONS: Record<string, number> = {
    '99': 30,    // 1 month
    '399': 180,  // 6 months
    '699': 365,  // 1 year
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Instamojo sends data as form-urlencoded
        const formData = await req.formData()

        // Extract payment details from Instamojo webhook
        const paymentId = formData.get('payment_id') as string
        const status = formData.get('status') as string
        const buyerEmail = formData.get('buyer') as string || formData.get('buyer_email') as string
        const amount = formData.get('amount') as string
        const purpose = formData.get('purpose') as string
        const paymentRequestId = formData.get('payment_request_id') as string

        console.log('Instamojo webhook received:', {
            paymentId,
            status,
            buyerEmail,
            amount,
            purpose
        });

        // Initialize Supabase admin client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Only process successful payments
        if (status !== 'Credit') {
            console.log('Payment not credited, status:', status);
            
            // Trigger payment failure email if email is present
            if (buyerEmail) {
                try {
                    const retryLink = `${Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://smartfitai.in'}/pricing`;
                    const failHtml = paymentFailedTemplate(`Instamojo payment status: ${status}`, retryLink);
                    await sendEmail({
                        to: buyerEmail,
                        subject: '⚠️ Payment Transaction Failed - SmartFit AI',
                        html: failHtml,
                        type: 'payment_failed'
                    });
                } catch (emailErr) {
                    console.error('Failed to send payment failure email:', emailErr);
                }
            }

            return new Response(
                JSON.stringify({ success: false, message: 'Payment not credited' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validate required fields
        if (!buyerEmail || !amount) {
            console.error('Missing required fields:', { buyerEmail, amount })
            return new Response(
                JSON.stringify({ success: false, message: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Find user by email
        const { data: users, error: userError } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('email', buyerEmail.toLowerCase())
            .limit(1)

        let userId: string | null = null

        if (users && users.length > 0) {
            userId = users[0].user_id
        } else {
            // Try to find in auth.users
            const { data: authUser } = await supabase.auth.admin.listUsers()

            if (authUser?.users) {
                const matchedUser = authUser.users.find(u =>
                    u.email?.toLowerCase() === buyerEmail.toLowerCase()
                )
                if (matchedUser) {
                    userId = matchedUser.id
                }
            }
        }

        if (!userId) {
            console.error('User not found for email:', buyerEmail)
            // Store payment for later reconciliation
            const { error: pendingError } = await supabase.from('pending_payments').insert({
                payment_id: paymentId,
                buyer_email: buyerEmail,
                amount: parseFloat(amount),
                purpose: purpose,
                status: 'pending_user',
                created_at: new Date().toISOString()
            })
            
            if (pendingError) {
                console.log('Could not save pending payment:', pendingError)
            }

            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'User not found. Payment recorded for manual processing.',
                    email: buyerEmail
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Calculate subscription duration based on amount
        const amountNum = parseFloat(amount).toFixed(0)
        const durationDays = PLAN_DURATIONS[amountNum] || 30

        // Get the premium plan ID
        const { data: plan } = await supabase
            .from('plans')
            .select('id, name')
            .ilike('name', '%prem%')
            .limit(1)
            .single()

        const planId = plan?.id || 'premium'
        const planName = plan?.name || 'Premium'

        // Check if user already has a subscription
        const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .limit(1)
            .single()

        const now = new Date()
        let newEndDate: Date
        let activeSubId: string

        if (existingSub && existingSub.current_period_end) {
            // Extend existing subscription
            const currentEnd = new Date(existingSub.current_period_end)
            const startDate = currentEnd > now ? currentEnd : now
            newEndDate = new Date(startDate)
            newEndDate.setDate(newEndDate.getDate() + durationDays)

            activeSubId = existingSub.id

            // Update existing subscription
            const { error: updateError } = await supabase
                .from('subscriptions')
                .update({
                    current_period_end: newEndDate.toISOString(),
                    updated_at: now.toISOString()
                })
                .eq('id', existingSub.id)

            if (updateError) {
                console.error('Error updating subscription:', updateError)
                throw updateError
            }

            console.log('Subscription extended for user:', userId, 'until:', newEndDate)
        } else {
            // Create new subscription
            newEndDate = new Date(now)
            newEndDate.setDate(newEndDate.getDate() + durationDays)

            const { data: insertedSub, error: insertError } = await supabase
                .from('subscriptions')
                .insert({
                    user_id: userId,
                    plan_id: planId,
                    status: 'active',
                    billing_cycle: 'monthly',
                    current_period_start: now.toISOString(),
                    current_period_end: newEndDate.toISOString(),
                    cancel_at_period_end: false,
                    created_at: now.toISOString(),
                    updated_at: now.toISOString()
                })
                .select('id')
                .single()

            if (insertError || !insertedSub) {
                console.error('Error inserting subscription:', insertError)
                throw insertError || new Error("Failed to insert subscription record")
            }

            activeSubId = insertedSub.id
            console.log('New subscription created for user:', userId, 'until:', newEndDate)
        }

        // Insert payment history log
        const { error: paymentError } = await supabase
            .from('payments')
            .insert({
                user_id: userId,
                subscription_id: activeSubId,
                stripe_payment_intent_id: paymentId,
                amount: Math.round(parseFloat(amount) * 100), // in cents
                currency: 'inr',
                status: 'succeeded',
                description: purpose || 'Instamojo Plan Subscription Payment'
            });

        if (paymentError) {
            console.error('Error inserting payment log:', paymentError)
        }

        // Dispatch transactional emails via Brevo
        try {
            const formattedAmount = `₹${parseFloat(amount).toFixed(2)}`;
            const renewalDateStr = newEndDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) + " IST";
            const invoiceUrl = `${Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://smartfitai.in'}/app/profile`;

            // 1. Send subscription confirmation
            const subHtml = subscriptionConfirmationTemplate(planName, formattedAmount, paymentId, renewalDateStr, invoiceUrl);
            await sendEmail({
                to: buyerEmail,
                subject: '🎉 Subscription Confirmed! Welcome to SmartFit AI Premium',
                html: subHtml,
                type: 'subscription_confirmation'
            });

            // 2. Send payment success receipt
            const payHtml = paymentSuccessTemplate(formattedAmount, planName, paymentId, invoiceUrl);
            await sendEmail({
                to: buyerEmail,
                subject: '✔️ Payment Successful Receipt - SmartFit AI',
                html: payHtml,
                type: 'payment_success'
            });
            
            console.log('Brevo billing emails sent successfully to:', buyerEmail);
        } catch (emailErr) {
            console.error('Failed to trigger Brevo notification emails:', emailErr);
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Subscription activated',
                userId,
                expiresAt: newEndDate.toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: unknown) {
        console.error('Webhook error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return new Response(
            JSON.stringify({ success: false, error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
