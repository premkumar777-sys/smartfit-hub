
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ENABLE_PAYMENTS } from "@/config";

export interface UserPlan {
    plan_id: string;
    plan_name: string;
    status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
    billing_cycle: 'monthly' | 'yearly';
    current_period_end: string;
}

export function useSubscription() {
    const { user, isLoading: isAuthLoading } = useAuth();

    const { data: plan, isLoading: isPlanLoading, refetch } = useQuery<UserPlan | null>({
        queryKey: ['subscription', user?.id],
        queryFn: async (): Promise<UserPlan | null> => {
            if (!user) return null;

            const { data, error } = await supabase
                .rpc('get_user_plan', { user_id: user.id })
                .maybeSingle(); // Use maybeSingle as users might not have a plan yet

            if (error) {
                console.error("Error fetching subscription:", error);
                return null;
            }

            return data as UserPlan;
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // Cache for 5 mins
    });

    // Derived state
    const isPremium = plan?.plan_id === 'premium' || plan?.plan_id === 'gym_partner';
    const isBusiness = plan?.plan_id === 'gym_partner';
    const isLoading = isAuthLoading || isPlanLoading;

    // Fallback for Beta Mode (if ENABLE_PAYMENTS is false, everyone is Premium)
    // This helps testing without actual Stripe subscription
    const hasAccess = !ENABLE_PAYMENTS || isPremium;

    return {
        plan,
        isPremium,
        isBusiness,
        hasAccess, // Use this for gating features
        isLoading,
        refetch
    };
}
