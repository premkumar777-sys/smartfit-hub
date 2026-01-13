import { useState } from "react";
import { Lock, Sparkles, Check, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ENABLE_PAYMENTS } from "@/config";
import { useSubscription, useUpgradePlan, STRIPE_PRICES } from "@/hooks/use-subscription";

export interface Plan {
    id: string;
    name: string;
    price: string;
    period: string;
    priceId: string; // Stripe price ID
    badge?: string;
}

interface PremiumLockProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    features?: string[];
    plans?: Plan[];
}

const DEFAULT_PLANS: Plan[] = [
    {
        id: "monthly",
        name: "Monthly",
        price: "₹299",
        period: "per month",
        priceId: STRIPE_PRICES.PREMIUM_MONTHLY,
        badge: "Popular"
    },
    {
        id: "yearly",
        name: "Yearly",
        price: "₹2,999",
        period: "per year",
        priceId: STRIPE_PRICES.PREMIUM_YEARLY
    }
];

export function PremiumLock({
    children,
    title = "Unlock AI Insights",
    description = "Get deep learning predictions and churn analysis with our Pro plan.",
    features = [],
    plans = DEFAULT_PLANS
}: PremiumLockProps) {
    const { hasPremiumAccess, isLoading } = useSubscription();
    const { upgradePlan, isLoading: isUpgrading } = useUpgradePlan();
    const [selectedPlan, setSelectedPlan] = useState(plans[0]);

    // If payments are disabled, show content directly
    if (!ENABLE_PAYMENTS) {
        return <>{children}</>;
    }

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

    // Grant access if user has active subscription
    if (hasPremiumAccess) {
        return <>{children}</>;
    }

    const handleUpgrade = async () => {
        toast.success(`Processing ${selectedPlan.name} Plan...`, {
            description: "Redirecting to secure payment..."
        });
        await upgradePlan(selectedPlan.priceId);
    };

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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
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
                                onClick={handleUpgrade}
                                disabled={isUpgrading}
                                className="w-full bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black font-bold h-12 text-lg shadow-[0_0_20px_rgba(0,255,156,0.4)] transition-all hover:scale-[1.02] disabled:opacity-50"
                            >
                                {isUpgrading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    `Upgrade Now - ${selectedPlan.price}`
                                )}
                            </Button>

                            <p className="text-xs text-gray-500">
                                Cancel anytime. Secure payment via Stripe.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
