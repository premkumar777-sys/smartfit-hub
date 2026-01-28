import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Sparkles, Check, Star, Loader2, Building2, ShieldCheck, Briefcase, Eye, EyeOff } from "lucide-react";
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
    lockType?: 'business' | 'trainer' | 'management';
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
    requireTrainer = false,
    lockType = 'business'
}: BusinessPremiumLockProps) {
    const { hasPremiumAccess, isLoading: isSubLoading, plan } = useSubscription();
    const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState(plans[0]);
    const [isTrainer, setIsTrainer] = useState<boolean | null>(null);
    const [isCheckingTrainer, setIsCheckingTrainer] = useState(false);
    const [isJsLocked, setIsJsLocked] = useState(true);

    const isLoading = isSubLoading || isAuthLoading || isCheckingTrainer;

    // Admin emails that bypass all restrictions
    // This is the specific list for the "credential only" requirement
    const ADMIN_EMAILS = [
        'eslavathpremkumar17@gmail.com',
        '24r01a66t7@cmrithyderabad.edu.in'
    ];

    const isAdmin = user?.email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase());

    // Check if user has a business-tier subscription
    const hasBusinessAccess = plan?.plan_id?.includes('biz') ||
        plan?.plan_name?.toLowerCase().includes('business') ||
        isAdmin;

    // JavaScript Prompt Lock Logic
    useEffect(() => {
        // Only apply JS alert lock to management and trainer tools
        if ((lockType === 'management' || lockType === 'trainer') && !isLoading) {
            const lastAuth = sessionStorage.getItem(`js_auth_${lockType}`);

            if (lastAuth === 'granted') {
                setIsJsLocked(false);
                return;
            }

            // Small delay to ensure the page has loaded or is ready
            const timer = setTimeout(() => {
                const password = window.prompt(`[SYSTEM ACCESS CONTROL]\nEnter Security Key to access ${title}:`);

                if (password === "Premkumar$7") {
                    setIsJsLocked(false);
                    sessionStorage.setItem(`js_auth_${lockType}`, 'granted');
                    toast.success("Access Granted", { icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> });
                } else if (password !== null) {
                    toast.error("Invalid Security Key. Access Denied.");
                    // We don't navigate away immediately to allow the user to see the lock screen
                    // and potentially try again by refreshing.
                }
            }, 500);

            return () => clearTimeout(timer);
        } else if (lockType === 'business') {
            setIsJsLocked(false);
        }
    }, [lockType, isLoading, title]);

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

    // Grant access strictly to authorized administrators for management/trainer tools
    // This handles the "open by that credential only" requirement for AI Analytics & Trainer Tools
    // NOW ALSO REQUIRES JS LOCK TO BE CLEARED
    if (isAdmin && !isJsLocked) {
        return <>{children}</>;
    }

    // For standard BUSINESS features (lockType='business'), also grant access if:
    // 1. Payments are globally disabled (Beta mode)
    // 2. User has a valid business subscription
    if (lockType === 'business' && (!ENABLE_PAYMENTS || hasBusinessAccess)) {
        return <>{children}</>;
    }

    // Management Lock - Premium, secure style for authorized personnel only (Gym Analytics)
    if (lockType === 'management' && (isJsLocked || (isAuthenticated && !isAdmin))) {
        return (
            <div className="relative w-full h-full">
                <div className="filter blur-3xl select-none pointer-events-none opacity-20 transition-all duration-1000 grayscale">
                    {children}
                </div>

                <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                    <Card className="max-w-lg w-full border-2 border-emerald-500/20 bg-black/95 backdrop-blur-xl shadow-[0_0_100px_rgba(16,185,129,0.15)] overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
                        <CardContent className="flex flex-col items-center text-center p-8 md:p-12 space-y-8">
                            <div className="p-6 rounded-2xl bg-emerald-500/5 ring-1 ring-emerald-500/20 relative group">
                                <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ShieldCheck className="w-12 h-12 text-emerald-500 relative z-10" />
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
                                    Management Console
                                </h3>
                                <p className="text-emerald-500/80 font-mono text-xs uppercase tracking-[0.2em]">Authorized Personnel Only</p>
                                <p className="text-gray-400 max-w-sm mx-auto text-base leading-relaxed">
                                    {isJsLocked
                                        ? "This console requires hardware/security-key authentication. Please refresh to try again."
                                        : "This dashboard contains sensitive business intelligence. Your account does not have management-level authorization."}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 w-full gap-4 pt-4">
                                <Button
                                    onClick={() => navigate('/dashboard')}
                                    className="h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                >
                                    Return to Secure Area
                                </Button>
                                <Button
                                    onClick={() => window.location.reload()}
                                    variant="outline"
                                    className="h-12 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                                >
                                    Try Authentication Again
                                </Button>
                                <p className="text-[10px] text-gray-500 font-mono">ENCRYPTION: AES-256 | STATUS: RESTRICTED</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Trainer Lock - For fitness professional specific tools (Trainer Tools)
    if (lockType === 'trainer' && (isJsLocked || (isAuthenticated && isTrainer === false && !isAdmin))) {
        return (
            <div className="relative w-full h-full">
                <div className="filter blur-xl select-none pointer-events-none opacity-30 user-select-none transition-all duration-700">
                    {children}
                </div>

                <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full border-2 border-amber-500/30 bg-black/90 backdrop-blur-md shadow-[0_0_50px_rgba(245,158,11,0.1)]">
                        <CardContent className="flex flex-col items-center text-center p-8 space-y-6">
                            <div className="p-4 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/40">
                                <Briefcase className="w-10 h-10 text-amber-500" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white tracking-tight">
                                    Fitness Professional Only
                                </h3>
                                <p className="text-gray-400">
                                    {isJsLocked
                                        ? "Trainer tools require a professional security key to unlock. Please refresh to try again."
                                        : "Trainer tools are restricted to registered fitness professionals. Access requires verified credentials."}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 w-full gap-3">
                                <Button
                                    onClick={() => window.location.reload()}
                                    className="bg-amber-600 hover:bg-amber-500 text-white h-12"
                                >
                                    Enter Security Key
                                </Button>
                                <Button
                                    onClick={() => navigate('/dashboard')}
                                    variant="outline"
                                    className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/10 h-12"
                                >
                                    Back to Client Area
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Not authenticated - Show sign-in prompt
    if (!isAuthenticated) {
        return (
            <div className="relative w-full h-full">
                <div className="filter blur-md select-none pointer-events-none opacity-40 user-select-none transition-all duration-500">
                    {children}
                </div>

                <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full border-2 border-blue-500/30 bg-black/90 backdrop-blur-md shadow-[0_0_60px_rgba(59,130,246,0.15)] animate-in fade-in zoom-in duration-300">
                        <CardContent className="flex flex-col items-center text-center p-8 space-y-8">
                            <div className="p-4 rounded-full bg-blue-500/10 ring-1 ring-blue-500/40">
                                <Building2 className="w-10 h-10 text-blue-500" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                    Enterprise Access <Sparkles className="w-6 h-6 text-yellow-500" />
                                </h3>
                                <p className="text-gray-400">
                                    Management and analytics tools require business-tier authentication.
                                </p>
                            </div>

                            <div className="w-full space-y-4">
                                <Button
                                    onClick={() => {
                                        const returnUrl = window.location.pathname;
                                        navigate('/auth', { state: { returnUrl } });
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-14 text-lg shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.02]"
                                >
                                    Sign In to Access
                                </Button>

                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-gray-500">Business plans start at ?999/month</p>
                                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">Global Fitness Network</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Default Case: Authenticated user but no business access (for lockType='business')
    return (
        <div className="relative w-full h-full">
            <div className="filter blur-md select-none pointer-events-none opacity-40 user-select-none transition-all duration-500">
                {children}
            </div>

            <div className="absolute inset-0 z-10 flex items-center justify-center p-4 overflow-y-auto">
                <Card className="max-w-xl w-full border-2 border-blue-500/30 bg-black/90 backdrop-blur-md shadow-[0_0_60px_rgba(59,130,246,0.15)] my-auto animate-in fade-in zoom-in duration-500">
                    <CardContent className="flex flex-col items-center text-center p-8 space-y-8">
                        <div className="p-5 rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/40">
                            <Building2 className="w-10 h-10 text-blue-500" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-3xl font-extrabold text-white flex items-center justify-center gap-3">
                                {title} <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                            </h3>
                            <p className="text-gray-400 text-lg">{description}</p>
                        </div>

                        {/* Feature List */}
                        {features.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-3 mb-4">
                                {features.map((feature, i) => (
                                    <Badge key={i} variant="outline" className="bg-white/5 border-white/10 text-gray-300 px-3 py-1 text-sm">
                                        <Star className="w-4 h-4 mr-1.5 text-blue-500" /> {feature}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Plan Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative group ${selectedPlan.id === plan.id
                                        ? "border-blue-500 bg-blue-500/10 scale-[1.03] shadow-xl shadow-blue-500/20"
                                        : "border-white/10 hover:border-white/30 hover:bg-white/5"
                                        }`}
                                >
                                    {plan.badge && (
                                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white hover:bg-blue-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                                            {plan.badge}
                                        </Badge>
                                    )}
                                    <div className="flex flex-col items-center gap-2 mt-2">
                                        <span className="text-base font-semibold text-gray-300 group-hover:text-white transition-colors">{plan.name}</span>
                                        <span className="text-2xl font-black text-white">{plan.price}</span>
                                        <span className="text-xs text-gray-400 font-mono tracking-tight">{plan.period}</span>
                                    </div>
                                    {selectedPlan.id === plan.id && (
                                        <div className="absolute top-3 right-3 text-blue-500 animate-in zoom-in duration-300">
                                            <Check className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="w-full space-y-4 pt-4">
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
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black h-14 text-xl shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.02] active:scale-95"
                            >
                                Get Enterprise Access - {selectedPlan.price}
                            </Button>

                            <p className="text-sm text-gray-500 font-medium">
                                Professional grade tools. Cancel anytime. 24/7 Support.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
