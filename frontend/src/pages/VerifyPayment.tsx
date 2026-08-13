import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Check, 
    ArrowLeft, 
    ShieldCheck, 
    Lock, 
    Sparkles, 
    Loader2, 
    Zap, 
    Play, 
    ExternalLink 
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PRO_PLANS, openPaymentLink } from "@/config/payments";

export default function VerifyPayment() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    
    const planParam = searchParams.get("plan");
    const initialPlan = PRO_PLANS.find(p => p.id === planParam) || PRO_PLANS[0];
    
    const [selectedPlan, setSelectedPlan] = useState(initialPlan);
    const [isActivatingTrial, setIsActivatingTrial] = useState(false);
    const [hasActiveSub, setHasActiveSub] = useState(false);
    const [checkingSub, setCheckingSub] = useState(true);

    // Check if the user already has a subscription
    useEffect(() => {
        const checkExistingSubscription = async () => {
            if (!user) {
                setCheckingSub(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("subscriptions")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("status", "active")
                    .order("current_period_end", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error) {
                    console.error("Error checking existing subscription:", error);
                }

                if (data && new Date(data.current_period_end) > new Date()) {
                    setHasActiveSub(true);
                }
            } catch (err) {
                console.error("Subscription validation error:", err);
            } finally {
                setCheckingSub(false);
            }
        };

        checkExistingSubscription();
    }, [user]);

    // Handle Trial Activation
    const handleActivateTrial = async () => {
        if (!user) {
            toast.error("Please sign in to start your trial.");
            return;
        }

        setIsActivatingTrial(true);

        try {
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 7);

            const { error } = await supabase
                .from("subscriptions")
                .insert({
                    user_id: user.id,
                    plan_id: "trial",
                    plan_name: "7-Day Trial",
                    status: "active",
                    billing_cycle: "trial",
                    current_period_start: new Date().toISOString(),
                    current_period_end: trialEnd.toISOString(),
                    cancel_at_period_end: false
                });

            if (error) {
                console.error("Trial activation error:", error);
                toast.error(`Activation failed: ${error.message}`);
            } else {
                toast.success("🎉 Your 7-Day Free Trial is now active!");
                navigate("/dashboard");
            }
        } catch (err: any) {
            console.error("Trial error:", err);
            toast.error(err.message || "An error occurred during trial activation.");
        } finally {
            setIsActivatingTrial(false);
        }
    };

    const handleUpgradeClick = () => {
        if (selectedPlan.id === "trial") {
            handleActivateTrial();
        } else {
            toast.success(`Opening secure checkout for ${selectedPlan.name}...`);
            openPaymentLink(selectedPlan.link);
        }
    };

    if (authLoading || checkingSub) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-[#00FF9C]" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white px-4">
                <Card className="max-w-md w-full border border-zinc-800 bg-[#0c0d10] shadow-2xl rounded-2xl p-6 md:p-8 text-center space-y-6">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
                        <Lock className="w-5 h-5 text-[#00FF9C]" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold font-outfit">Upgrade Required</h2>
                        <p className="text-sm text-zinc-400">
                            Please sign in or create an account to start your 7-day free trial or upgrade to a premium plan.
                        </p>
                    </div>
                    <Button
                        onClick={() => navigate("/auth", { state: { returnUrl: "/upgrade" } })}
                        className="w-full h-11 bg-[#00FF9C] hover:bg-[#00e08b] text-black font-bold rounded-lg transition-colors"
                    >
                        Sign In / Register
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="w-full text-xs text-zinc-500 hover:text-white"
                    >
                        Go Back
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-20" style={{ paddingTop: 'calc(var(--header-height) + 1.5rem)' }}>
            <Container className="max-w-6xl">
                {/* Back Link */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="mb-8 text-zinc-400 hover:text-white -ml-2"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                {hasActiveSub ? (
                    <Card className="border border-zinc-800 bg-[#0c0d10] p-8 text-center max-w-xl mx-auto space-y-6 rounded-2xl shadow-xl">
                        <div className="w-16 h-16 rounded-full bg-[#00FF9C]/10 border border-[#00FF9C]/25 flex items-center justify-center mx-auto text-[#00FF9C]">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold font-outfit">Pro Status Active</h2>
                            <p className="text-zinc-400 text-sm">
                                You already have an active premium subscription. All features are fully unlocked for you!
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate("/dashboard")}
                            className="w-full h-12 bg-[#00FF9C] hover:bg-[#00e08b] text-black font-bold rounded-lg transition-colors"
                        >
                            Go to Dashboard
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        {/* Left Side: Product Details & Features */}
                        <div className="lg:col-span-6 space-y-8">
                            <div className="space-y-3">
                                <Badge className="bg-[#00FF9C]/10 text-[#00FF9C] hover:bg-[#00FF9C]/20 border-none px-3 py-1 font-semibold text-xs rounded-md">
                                    SMARTFIT PRO
                                </Badge>
                                <h1 className="text-4xl md:text-5xl font-bold font-outfit leading-tight">
                                    Unlock Your Full <br />Fitness Potential
                                </h1>
                                <p className="text-zinc-400 text-base leading-relaxed max-w-md">
                                    Activate your plan to gain full access to computer vision workout tracking, personal AI coaching, B2B dashboards, and personalized meal planning.
                                </p>
                            </div>

                            {/* Features list */}
                            <div className="space-y-4">
                                {[
                                    {
                                        title: "Real-Time Camera Pose AI",
                                        desc: "Instant posture correction and repetition counting via MediaPipe computer vision."
                                    },
                                    {
                                        title: "24/7 AI Personal Trainer",
                                        desc: "Conversational workout and form support powered by Gemini API."
                                    },
                                    {
                                        title: "Interactive 3D Trainer",
                                        desc: "Full workout visualizations even without active webcam permissions."
                                    },
                                    {
                                        title: "Personalized Nutrition Planner",
                                        desc: "Detailed custom meal, calorie, and macronutrient targets."
                                    },
                                    {
                                        title: "Advanced B2B Admin Dashboards",
                                        desc: "Enterprise client tracking, security check-in records, and analytics."
                                    }
                                ].map((item, index) => (
                                    <div key={index} className="flex gap-3">
                                        <div className="mt-1 flex-shrink-0 w-5 h-5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#00FF9C]">
                                            <Check className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{item.title}</h4>
                                            <p className="text-xs text-zinc-400 mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Trust Footer */}
                            <div className="pt-6 border-t border-zinc-800 flex items-center gap-6 text-xs text-zinc-500">
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-zinc-400" />
                                    Secure Verification
                                </div>
                                <div>•</div>
                                <div>Cancel anytime</div>
                                <div>•</div>
                                <div>Instant Activation</div>
                            </div>
                        </div>

                        {/* Right Side: Plans Selection & Action Button */}
                        <div className="lg:col-span-6">
                            <Card className="border border-zinc-800 bg-[#0c0d10] p-6 md:p-8 rounded-2xl shadow-xl space-y-8">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold font-outfit">Select Subscription</h3>
                                    <p className="text-xs text-zinc-400">Choose the option that matches your goal.</p>
                                </div>

                                {/* Plan selector cards */}
                                <div className="space-y-4">
                                    {PRO_PLANS.map((plan) => {
                                        const isSelected = selectedPlan.id === plan.id;
                                        return (
                                            <div
                                                key={plan.id}
                                                onClick={() => setSelectedPlan(plan)}
                                                className={`cursor-pointer rounded-xl p-4 border transition-all flex items-center justify-between relative ${
                                                    isSelected
                                                        ? "border-[#00FF9C] bg-[#111319]"
                                                        : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/40"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                        isSelected ? "border-[#00FF9C]" : "border-zinc-600"
                                                    }`}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-[#00FF9C]" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-white">{plan.name}</span>
                                                            {plan.badge && (
                                                                <Badge className="bg-[#00FF9C] text-black hover:bg-[#00FF9C] text-[9px] px-1.5 py-0 rounded font-semibold uppercase">
                                                                    {plan.badge}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-zinc-400">{plan.period}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <span className="text-lg font-black text-white">{plan.price}</span>
                                                    {plan.originalPrice && (
                                                        <span className="text-xs text-zinc-500 line-through font-normal">{plan.originalPrice}</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Summary details */}
                                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-900 space-y-3">
                                    <div className="flex justify-between text-xs text-zinc-400">
                                        <span>Plan selected</span>
                                        <span className="text-white font-semibold">{selectedPlan.name}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-zinc-400">
                                        <span>Duration</span>
                                        <span className="text-white font-semibold">
                                            {selectedPlan.id === "trial" ? "7 Days" : selectedPlan.id === "monthly_31" ? "31 Days" : "90 Days"}
                                        </span>
                                    </div>
                                    <div className="h-px bg-zinc-800 my-1" />
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-zinc-300">Total Payable</span>
                                        <span className="font-black text-[#00FF9C] text-base">{selectedPlan.price}</span>
                                    </div>
                                </div>

                                {/* Checkout Button */}
                                <Button
                                    onClick={handleUpgradeClick}
                                    disabled={isActivatingTrial}
                                    className="w-full h-12 bg-[#00FF9C] hover:bg-[#00e08b] text-black font-black text-sm uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {isActivatingTrial ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin text-black" />
                                            Activating Trial...
                                        </>
                                    ) : selectedPlan.id === "trial" ? (
                                        <>
                                            <Play className="w-4 h-4 text-black fill-current" />
                                            Start 7-Day Free Trial
                                        </>
                                    ) : (
                                        <>
                                            Upgrade via Instamojo
                                            <ExternalLink className="w-4 h-4 text-black" />
                                        </>
                                    )}
                                </Button>
                            </Card>
                        </div>
                    </div>
                )}
            </Container>
        </div>
    );
}
