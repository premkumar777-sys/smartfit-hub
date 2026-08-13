import { Button } from "@/components/ui/button";
import { Check, Shield, Clock, Trophy, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";
import { PRO_PLANS } from "@/config/payments";
import { Badge } from "@/components/ui/badge";

export default function Pricing() {
    const navigate = useNavigate();

    const getPlanFeatures = (planId: string) => {
        const baseFeatures = [
            "AI Workout Generation",
            "Real-time AI Pose Form Detection",
            "Custom Nutrition & Macro Planner",
            "Interactive 3D Workout Demos",
            "Progress & Biometric Analytics",
            "B2B Admin Dashboard access"
        ];

        if (planId === "trial") {
            return [...baseFeatures, "7 Days Full Access", "No credit card required"];
        }
        if (planId === "monthly_31") {
            return [...baseFeatures, "31 Days Full Access", "Save 22% vs base rate"];
        }
        return [...baseFeatures, "90 Days Full Access", "39% discount applied"];
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-20" style={{ paddingTop: 'calc(var(--header-height) + 2rem)' }}>
            <Container>
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-4"
                    >
                        <Badge className="bg-[#00FF9C]/10 text-[#00FF9C] hover:bg-[#00FF9C]/20 border-none px-3 py-1 font-semibold text-xs rounded-md">
                            PRICING PLANS
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-outfit leading-tight text-white">
                            Simple, <span className="text-[#00FF9C]">Transparent</span> Pricing
                        </h1>
                        <p className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto">
                            Choose the plan that matches your training goals. Get premium access to computer vision workout tracking, AI coaching, and custom nutrition guides.
                        </p>
                    </motion.div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {PRO_PLANS.map((plan, index) => {
                        const features = getPlanFeatures(plan.id);
                        const isTrial = plan.id === "trial";
                        const isMonthly = plan.id === "monthly_31";

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`relative flex flex-col p-8 rounded-2xl border bg-[#0c0d10] ${
                                    isMonthly 
                                        ? "border-[#00FF9C] shadow-[0_0_30px_rgba(0,255,156,0.05)]" 
                                        : "border-zinc-800"
                                }`}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#00FF9C] text-black text-[10px] font-bold rounded uppercase tracking-wider">
                                        {plan.badge}
                                    </div>
                                )}

                                <div className="space-y-6 flex-1">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white font-outfit uppercase tracking-wider">
                                            {plan.name}
                                        </h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-white">{plan.price}</span>
                                            {plan.originalPrice && (
                                                <span className="text-base text-zinc-500 line-through font-normal">{plan.originalPrice}</span>
                                            )}
                                            <span className="text-xs text-zinc-400">/ {plan.period}</span>
                                        </div>
                                    </div>

                                    <div className="h-px bg-zinc-800" />

                                    {/* Features */}
                                    <div className="space-y-4">
                                        {features.map((feature, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#00FF9C]">
                                                    <Check className="w-2.5 h-2.5" />
                                                </div>
                                                <span className="text-xs text-zinc-300">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <Button
                                        onClick={() => navigate(`/upgrade?plan=${plan.id}`)}
                                        className={`w-full h-11 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors ${
                                            isMonthly 
                                                ? "bg-[#00FF9C] text-black hover:bg-[#00e08b]" 
                                                : "border border-zinc-800 bg-transparent text-white hover:bg-zinc-900"
                                        }`}
                                    >
                                        {isTrial ? "Start Free Trial" : "Choose Plan"}
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* FAQ / Trust Section */}
                <div className="mt-20 border-t border-zinc-900 pt-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-6 rounded-2xl bg-[#0c0d10] border border-zinc-900 text-center space-y-3">
                            <Shield className="w-6 h-6 mx-auto text-[#00FF9C]" />
                            <h4 className="text-base font-bold text-white">Cancel Anytime</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                No commitments or lock-ins. Easily pause or cancel your subscription directly from your settings.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-[#0c0d10] border border-zinc-900 text-center space-y-3">
                            <Clock className="w-6 h-6 mx-auto text-[#00FF9C]" />
                            <h4 className="text-base font-bold text-white">Instant Activation</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Get access immediately. Your Pro tools and features will be unlocked as soon as checkout completes.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-[#0c0d10] border border-zinc-900 text-center space-y-3">
                            <Trophy className="w-6 h-6 mx-auto text-[#00FF9C]" />
                            <h4 className="text-base font-bold text-white">100% Secure Checkout</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                All transactions are fully encrypted and processed securely via our payments partner Instamojo.
                            </p>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
