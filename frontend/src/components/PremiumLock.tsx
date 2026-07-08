import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Sparkles, Check, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ENABLE_PAYMENTS } from "@/config";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/use-auth";
import { PRO_PLANS, PaymentPlan, openPaymentLink } from "@/config/payments";

export type { PaymentPlan as Plan };

interface PremiumLockProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    features?: string[];
    plans?: PaymentPlan[];
}

export function PremiumLock({
    children,
    title = "Unlock AI Insights",
    description = "Get deep learning predictions and churn analysis with our Pro plan.",
    features = [],
    plans = PRO_PLANS
}: PremiumLockProps) {
    const { hasPremiumAccess, isLoading } = useSubscription();
    const { isAuthenticated } = useAuth();
    // Keep local state for plan selection
    const [selectedPlan, setSelectedPlan] = useState(plans[0]);

    const navigate = useNavigate();

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

    // Grant access if:
    // 1. Payments are globally disabled (Beta Mode)
    // 2. User has active Pro subscription
    if (!ENABLE_PAYMENTS || hasPremiumAccess) {
        return <>{children}</>;
    }

    // If user is NOT authenticated, show login/signup prompt instead of upgrade overlay
    if (!isAuthenticated) {
        return (
            <div className="relative w-full h-full">
                {/* Blurred Content */}
                <div className="filter blur-sm select-none pointer-events-none opacity-50 user-select-none transition-all duration-500">
                    {children}
                </div>

                {/* Auth Required Overlay */}
                <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full border-2 border-[#00FF9C]/30 bg-black/90 backdrop-blur-md shadow-[0_0_40px_rgba(0,255,156,0.1)] animate-in fade-in zoom-in duration-300">
                        <CardContent className="flex flex-col items-center text-center p-6 md:p-8 space-y-6">
                            <div className="p-4 rounded-full bg-[#00FF9C]/10 ring-1 ring-[#00FF9C]/40">
                                <Lock className="w-8 h-8 text-[#00FF9C]" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                    Sign In Required <Sparkles className="w-5 h-5 text-yellow-400" />
                                </h3>
                                <p className="text-gray-400">
                                    Please sign in or create an account to access premium features.
                                </p>
                            </div>

                            <div className="w-full space-y-3">
                                <Button
                                    onClick={() => {
                                        // Store current path to redirect back after login
                                        const returnUrl = window.location.pathname;
                                        navigate('/auth', { state: { returnUrl } });
                                    }}
                                    className="w-full bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black font-bold h-12 text-lg shadow-[0_0_20px_rgba(0,255,156,0.4)] transition-all hover:scale-[1.02]"
                                >
                                    Sign In to Access
                                </Button>

                                <p className="text-xs text-gray-500">
                                    Free account gets you started. Upgrade anytime.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {/* Blurred Content */}
            <div className="filter blur-sm select-none pointer-events-none opacity-50 user-select-none transition-all duration-500">
                {children}
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4 overflow-y-auto">
                <Card className="max-w-xl w-full border-2 border-[#00FF9C]/30 bg-black/90 backdrop-blur-md shadow-[0_0_40px_rgba(0,255,156,0.1)] my-auto animate-in fade-in zoom-in duration-300">
                    <CardContent className="flex flex-col items-center text-center p-6 md:p-8 space-y-6">
                        <div className="p-4 rounded-full bg-[#00FF9C]/10 ring-1 ring-[#00FF9C]/40">
                            <Lock className="w-8 h-8 text-[#00FF9C]" />
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
                                        <Star className="w-3 h-3 mr-1 text-[#00FF9C]" /> {feature}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Plan Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`cursor-pointer rounded-xl p-3 border-2 transition-all relative ${selectedPlan.id === plan.id
                                        ? "border-[#00FF9C] bg-[#00FF9C]/10 scale-105 shadow-lg shadow-[#00FF9C]/10"
                                        : "border-white/10 hover:border-white/20 hover:bg-white/5"
                                        }`}
                                >
                                    {plan.badge && (
                                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00FF9C] text-black hover:bg-[#00FF9C] px-2 py-0.5 text-[10px] whitespace-nowrap">
                                            {plan.badge}
                                        </Badge>
                                    )}
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                        <span className="text-sm font-medium text-gray-300">{plan.name}</span>
                                        <span className="text-xl font-bold text-white">{plan.price}</span>
                                        <span className="text-[10px] text-gray-400">{plan.period}</span>
                                    </div>
                                    {selectedPlan.id === plan.id && (
                                        <div className="absolute top-2 right-2 text-[#00FF9C]">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="w-full space-y-3">
                            <Button
                                onClick={() => {
                                    toast.success(`Redirecting to upgrade page...`);
                                    // Redirect to upgrade page
                                    window.location.href = "/upgrade";
                                }}
                                className="w-full bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black font-bold h-12 text-lg shadow-[0_0_20px_rgba(0,255,156,0.4)] transition-all hover:scale-[1.02]"
                            >
                                Upgrade Now - {selectedPlan.price}
                            </Button>

                            <p className="text-xs text-gray-500">
                                Cancel anytime. Secure payment via Instamojo.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
