// Instamojo Webhook Handler
// This function receives payment notifications from Instamojo
// and automatically adds subscriptions to the database

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Duration mapping for plans
const PLAN_DURATIONS: Record<string, number> = {
    '99': 30,    // 1 month
    '399': 180,  // 6 months
    '699': 365,  // 1 year
}

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
        })

        // Only process successful payments
        if (status !== 'Credit') {
            console.log('Payment not credited, status:', status)
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

        // Initialize Supabase admin client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
            const { data: authUser, error: authError } = await supabase.auth.admin.listUsers()

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
            await supabase.from('pending_payments').insert({
                payment_id: paymentId,
                buyer_email: buyerEmail,
                amount: parseFloat(amount),
                purpose: purpose,
                status: 'pending_user',
                created_at: new Date().toISOString()
            }).catch(e => console.log('Could not save pending payment:', e))

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
            .select('id')
            .ilike('name', '%prem%')
            .limit(1)
            .single()

        const planId = plan?.id || 'premium'

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

        if (existingSub && existingSub.current_period_end) {
            // Extend existing subscription
            const currentEnd = new Date(existingSub.current_period_end)
            const startDate = currentEnd > now ? currentEnd : now
            newEndDate = new Date(startDate)
            newEndDate.setDate(newEndDate.getDate() + durationDays)

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

            const { error: insertError } = await supabase
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

            if (insertError) {
                console.error('Error inserting subscription:', insertError)
                throw insertError
            }

            console.log('New subscription created for user:', userId, 'until:', newEndDate)
        }

        // Log the successful payment
        console.log('Payment processed successfully:', {
            userId,
            paymentId,
            amount,
            durationDays,
            expiresAt: newEndDate
        })

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Subscription activated',
                userId,
                expiresAt: newEndDate.toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Webhook error:', error)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
