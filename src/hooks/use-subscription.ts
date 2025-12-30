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
    plan: {
      plan_id: 'free',
      plan_name: 'Free',
      status: 'active',
      billing_cycle: 'free',
      current_period_end: null
    },
    hasPremiumAccess: true, // Always give premium access for now
    isLoading: false,
    error: null,
  })

  const { user } = useAuth()

  useEffect(() => {
    // For now, always provide free tier with premium access
    // This allows all features to be available while showing "coming soon" for new features
    setData({
      plan: {
        plan_id: 'free',
        plan_name: 'Free',
        status: 'active',
        billing_cycle: 'free',
        current_period_end: null
      },
      hasPremiumAccess: true,
      isLoading: false,
      error: null,
    })
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
    // Payment functionality removed - all features are now free
    setIsLoading(true)
    setError(null)

    // Simulate a delay then return success
    setTimeout(() => {
      setIsLoading(false)
      // All features are now available for free
    }, 1000)
  }

  return {
    upgradePlan,
    isLoading,
    error,
  }
}
