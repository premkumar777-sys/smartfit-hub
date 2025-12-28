import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

const getStripe = () => {
  if (!stripePromise) {
    // Use the provided test key for now
    stripePromise = loadStripe('pk_test_51ShZs2Cn98QGMABll7Nk1QiumqlrP0UdcTcUBYzV52ozQImFFTL7ugGjdd9TTI6JEMYLy2VYhEy5bSBO77kHQBNj00ZgPvTdG4')
  }
  return stripePromise
}

export default getStripe

export const createCheckoutSession = async (
  planId: string,
  billingCycle: 'monthly' | 'yearly',
  successUrl?: string,
  cancelUrl?: string
) => {
  try {
    const response = await fetch('/functions/v1/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await import('@/integrations/supabase/client')).supabase.auth.getSession().then(({ data }) => data.session?.access_token)}`,
      },
      body: JSON.stringify({
        planId,
        billingCycle,
        successUrl,
        cancelUrl,
      }),
    })

    const { url, error } = await response.json()

    if (error) {
      throw new Error(error)
    }

    return url
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

export const redirectToCheckout = async (
  planId: string,
  billingCycle: 'monthly' | 'yearly',
  successUrl?: string,
  cancelUrl?: string
) => {
  try {
    const url = await createCheckoutSession(planId, billingCycle, successUrl, cancelUrl)

    // Redirect to Stripe Checkout
    window.location.href = url
  } catch (error) {
    console.error('Error redirecting to checkout:', error)
    throw error
  }
}
