import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Sparkles, Check, Star, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ENABLE_PAYMENTS } from "@/config";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/use-auth";
import { BUSINESS_PLANS, PaymentPlan, openPaymentLink } from "@/config/payments";
import { supabase } from "@/integrations/supabase/client";

interface BusinessPremiumLockProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    features?: string[];
    plans?: PaymentPlan[];
    requireTrainer?: boolean;
}

/**
 * BusinessPremiumLock - Access control for B2B features
 * 
 * Used for: Gym Analytics, Trainer Tools, Online Coaching
 * Shows BUSINESS_PLANS pricing (?999-?9,999) instead of individual Pro pricing
 * 
 * Regular Pro users will NOT have access to these features.
 * Only users with business-tier subscription or admins can access.
 */
export function BusinessPremiumLock({
    children,
    title = "Business Feature",
    description = "Unlock powerful tools for gym owners and trainers.",
    features = ["Gym Analytics", "Client Management", "Revenue Tracking", "AI Insights"],
    plans = BUSINESS_PLANS,
    requireTrainer = false
}: BusinessPremiumLockProps) {
    const { hasPremiumAccess, isLoading: isSubLoading, plan } = useSubscription();
    const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState(plans[0]);
    const [isTrainer, setIsTrainer] = useState<boolean | null>(null);
    const [isCheckingTrainer, setIsCheckingTrainer] = useState(false);

    const isLoading = isSubLoading || isAuthLoading || isCheckingTrainer;

    // Admin emails that bypass all restrictions
    const ADMIN_EMAILS = [
        'eslavathpremkumar17@gmail.com',
        '24r01a66t7@cmrithyderabad.edu.in',
        '24r01a66t7@cmrithyderbad.edu.in'
    ];

    const isAdmin = user?.email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase());

    // Check if user has a business-tier subscription
    const hasBusinessAccess = plan?.plan_id?.includes('biz') ||
        plan?.plan_name?.toLowerCase().includes('business') ||
        isAdmin;

    // Check trainer status if required
    useEffect(() => {
        const checkTrainer = async () => {
            if (requireTrainer && user) {
                setIsCheckingTrainer(true);
                try {
                    const { data, error } = await supabase
                        .from('trainers')
                        .select('id')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    setIsTrainer(!!data);
                } catch (err) {
                    console.error("Trainer check error:", err);
                    setIsTrainer(false);
                } finally {
                    setIsCheckingTrainer(false);
                }
            } else {
                setIsTrainer(null);
            }
        };
        checkTrainer();
    }, [requireTrainer, user]);

    if (isLoading) {
        return (
            <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
                <div className="filter blur-sm select-none pointer-events-none opacity-20">
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    // User is authenticated but not a trainer (and it's required)
    if (requireTrainer && isAuthenticated && isTrainer === false && !isAdmin) {
        return (
            <div className="relative w-full h-full">
                <div className="filter blur-sm select-none pointer-events-none opacity-50 user-select-none transition-all duration-500">
                    {children}
                </div>

                <div className="absolute inset-0 z-10 flex items-center justify-center p-4 text-center">
                    <Card className="max-w-md w-full border-2 border-amber-500/30 bg-black/90 backdrop-blur-md shadow-[0_0_40px_rgba(245,158,11,0.1)]">
                        <CardContent className="flex flex-col items-center p-6 md:p-8 space-y-6">
                            <div className="p-4 rounded-full bg-amber-500/10 ring-1 ring-amber-500/40">
                                <Lock className="w-8 h-8 text-amber-500" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white">
                                    Trainer Access Only
                                </h3>
                                <p className="text-gray-400">
                                    This tool is specifically designed for fitness professionals. Your account is not registered as a trainer.
                                </p>
                            </div>

                            <Button
                                onClick={() => navigate('/dashboard')}
                                variant="outline"
                                className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                            >
                                Back to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Grant access if:
    // 1. Payments are globally disabled (Beta Mode) AND it's not strictly trainer-only
    // 2. User is an admin
    // 3. User has business-tier subscription
    if ((!ENABLE_PAYMENTS && !requireTrainer) || hasBusinessAccess || isAdmin) {
        return <>{children}</>;
    }

    // If user is NOT authenticated, show login/signup prompt
    if (!isAuthenticated) {
        return (
            <div className="relative w-full h-full">
                <div className="filter blur-sm select-none pointer-events-none opacity-50 user-select-none transition-all duration-500">
                    {children}
                </div>

                <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full border-2 border-blue-500/30 bg-black/90 backdrop-blur-md shadow-[0_0_40px_rgba(59,130,246,0.1)] animate-in fade-in zoom-in duration-300">
                        <CardContent className="flex flex-col items-center text-center p-6 md:p-8 space-y-6">
                            <div className="p-4 rounded-full bg-blue-500/10 ring-1 ring-blue-500/40">
                                <Building2 className="w-8 h-8 text-blue-500" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                    Business Feature <Sparkles className="w-5 h-5 text-yellow-400" />
                                </h3>
                                <p className="text-gray-400">
                                    Sign in to access tools for gym owners and trainers.
                                </p>
                            </div>

                            <div className="w-full space-y-3">
                                <Button
                                    onClick={() => {
                                        const returnUrl = window.location.pathname;
                                        navigate('/auth', { state: { returnUrl } });
                                    }}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold h-12 text-lg shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all hover:scale-[1.02]"
                                >
                                    Sign In to Access
                                </Button>

                                <p className="text-xs text-gray-500">
                                    Business plans start at ?999/month
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // User is authenticated but doesn't have business access
    // Show them the business plans upgrade overlay
    return (
        <div className="relative w-full h-full">
            {/* Blurred Content */}
            <div className="filter blur-sm select-none pointer-events-none opacity-50 user-select-none transition-all duration-500">
                {children}
            </div>

            {/* Business Lock Overlay */}
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4 overflow-y-auto">
                <Card className="max-w-xl w-full border-2 border-blue-500/30 bg-black/90 backdrop-blur-md shadow-[0_0_40px_rgba(59,130,246,0.1)] my-auto animate-in fade-in zoom-in duration-300">
                    <CardContent className="flex flex-col items-center text-center p-6 md:p-8 space-y-6">
                        <div className="p-4 rounded-full bg-blue-500/10 ring-1 ring-blue-500/40">
                            <Building2 className="w-8 h-8 text-blue-500" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                {title} <Sparkles className="w-5 h-5 text-yellow-400" />
                            </h3>
                            <p className="text-gray-400">{description}</p>
                        </div>

                        {/* Feature List */}
                        {features.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2 mb-2">
                                {features.map((feature, i) => (
                                    <Badge key={i} variant="outline" className="bg-white/5 border-white/10 text-gray-300">
                                        <Star className="w-3 h-3 mr-1 text-blue-500" /> {feature}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Plan Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative ${selectedPlan.id === plan.id
                                        ? "border-blue-500 bg-blue-500/10 scale-105 shadow-lg shadow-blue-500/10"
                                        : "border-white/10 hover:border-white/20 hover:bg-white/5"
                                        }`}
                                >
                                    {plan.badge && (
                                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white hover:bg-blue-500 px-2 py-0.5 text-[10px] whitespace-nowrap">
                                            {plan.badge}
                                        </Badge>
                                    )}
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                        <span className="text-sm font-medium text-gray-300">{plan.name}</span>
                                        <span className="text-xl font-bold text-white">{plan.price}</span>
                                        <span className="text-[10px] text-gray-400">{plan.period}</span>
                                    </div>
                                    {selectedPlan.id === plan.id && (
                                        <div className="absolute top-2 right-2 text-blue-500">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="w-full space-y-3">
                            <Button
                                onClick={() => {
                                    if (selectedPlan.link.startsWith("RAZORPAY_")) {
                                        toast.info("Business plans coming soon!", {
                                            description: "Contact us for early access to business features."
                                        });
                                    } else {
                                        openPaymentLink(selectedPlan.link);
                                    }
                                }}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold h-12 text-lg shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all hover:scale-[1.02]"
                            >
                                Upgrade to Business - {selectedPlan.price}
                            </Button>

                            <p className="text-xs text-gray-500">
                                Designed for gym owners & trainers. Cancel anytime.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
