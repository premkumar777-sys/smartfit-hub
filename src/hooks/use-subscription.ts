import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/use-auth'

// Stripe Price IDs - these should match your Stripe products
export const STRIPE_PRICES = {
  PREMIUM_MONTHLY: 'price_1QazMnSJWeMrHvFrVl1VXNHP', // ₹299/month
  PREMIUM_YEARLY: 'price_1QazMnSJWeMrHvFryearly', // ₹2999/year (placeholder)
} as const

export interface UserPlan {
  plan_id: string
  plan_name: string
  status: string
  billing_cycle: string
  current_period_end: string | null
}

export interface SubscriptionData {
  plan: UserPlan | null
  hasPremiumAccess: boolean
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSubscription(): SubscriptionData {
  const [plan, setPlan] = useState<UserPlan | null>(null)
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setPlan({
        plan_id: 'free',
        plan_name: 'Free',
        status: 'active',
        billing_cycle: 'free',
        current_period_end: null
      })
      setHasPremiumAccess(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        throw new Error('No session')
      }

      const { data, error: fnError } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      })

      if (fnError) throw fnError

      if (data.subscribed) {
        setPlan({
          plan_id: 'premium',
          plan_name: 'Premium',
          status: 'active',
          billing_cycle: 'monthly',
          current_period_end: data.subscription_end
        })
        setHasPremiumAccess(true)
      } else {
        setPlan({
          plan_id: 'free',
          plan_name: 'Free',
          status: 'active',
          billing_cycle: 'free',
          current_period_end: null
        })
        setHasPremiumAccess(false)
      }
    } catch (err) {
      console.error('Error checking subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to check subscription')
      // Default to free plan on error
      setPlan({
        plan_id: 'free',
        plan_name: 'Free',
        status: 'active',
        billing_cycle: 'free',
        current_period_end: null
      })
      setHasPremiumAccess(false)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Check subscription on mount and when user changes
  useEffect(() => {
    checkSubscription()
  }, [checkSubscription])

  // Check subscription when returning from checkout (URL contains checkout=success)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('checkout') === 'success') {
      // Small delay to allow Stripe webhook to process
      setTimeout(() => {
        checkSubscription()
      }, 2000)
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [checkSubscription])

  // Periodic refresh every 60 seconds
  useEffect(() => {
    if (!user) return
    
    const interval = setInterval(() => {
      checkSubscription()
    }, 60000)

    return () => clearInterval(interval)
  }, [user, checkSubscription])

  return {
    plan,
    hasPremiumAccess,
    isLoading,
    error,
    refetch: checkSubscription
  }
}

export function useUpgradePlan() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upgradePlan = async (priceId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        throw new Error('Please sign in to upgrade')
      }

      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      })

      if (fnError) throw fnError
      if (data.error) throw new Error(data.error)

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Error creating checkout:', err)
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    upgradePlan,
    isLoading,
    error,
  }
}
