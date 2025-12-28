import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/use-auth'

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
}

export function useSubscription(): SubscriptionData {
  const [data, setData] = useState<SubscriptionData>({
    plan: null,
    hasPremiumAccess: false,
    isLoading: true,
    error: null,
  })

  const { user } = useAuth()

  useEffect(() => {
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      setData({
        plan: null,
        hasPremiumAccess: false,
        isLoading: false,
        error: null, // Remove error for testing
      })
      return
    }

    if (!user) {
      setData({
        plan: null,
        hasPremiumAccess: false,
        isLoading: false,
        error: null,
      })
      return
    }

    const fetchSubscription = async () => {
      try {
        // Get user's current plan
        const { data: planData, error: planError } = await supabase
          .rpc('get_user_plan', { user_id: user.id })

        if (planError) throw planError

        const plan = planData?.[0] || null

        // Check premium access
        const { data: premiumAccess, error: premiumError } = await supabase
          .rpc('has_premium_access', { user_id: user.id })

        if (premiumError) throw premiumError

        setData({
          plan,
          hasPremiumAccess: premiumAccess || false,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        console.error('Error fetching subscription:', error)
        setData({
          plan: null,
          hasPremiumAccess: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    fetchSubscription()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription()
    })

    return () => subscription.unsubscribe()
  }, [user])

  return data
}

export function useUpgradePlan() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upgradePlan = async (
    planId: string,
    billingCycle: 'monthly' | 'yearly'
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      // Import dynamically to avoid issues with SSR
      const { redirectToCheckout } = await import('@/lib/stripe')

      await redirectToCheckout(planId, billingCycle)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upgrade plan'
      setError(errorMessage)
      setIsLoading(false)
      throw new Error(errorMessage)
    }
  }

  return {
    upgradePlan,
    isLoading,
    error,
  }
}
