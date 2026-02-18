import { Button } from "@/components/ui/button";
import { Check, Crown, Flame, Zap, Shield, Sparkles, Building2, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";

const tiers = [
    {
        name: "Free",
        price: "0",
        description: "Perfect for getting started with your fitness journey",
        icon: User,
        color: "from-blue-500 to-cyan-500",
        features: [
            "Basic Dashboard tracking",
            "Access to Home Workouts",
            "BMI Calculator & Assessment",
            "Public Leaderboard access",
            "Basic Profile customization",
            "Standard notification alerts"
        ],
        buttonText: "Get Started",
        link: "/auth",
        variant: "outline"
    },
    {
        name: "Pro",
        price: "499",
        period: "per month",
        description: "Advanced AI-powered coaching for individual power users",
        icon: Sparkles,
        color: "from-[#00FF9C] to-[#4CC9F0]",
        popular: true,
        features: [
            "Everything in Free, plus:",
            "AI Workout Generation",
            "Real-time AI Form Detection",
            "Smart Progress Analytics",
            "Nutrition & Macro Sync",
            "Advanced Gamification & Badges"
        ],
        buttonText: "Upgrade to Pro",
        link: "/upgrade",
        variant: "hero"
    },
    {
        name: "Business",
        price: "1,999",
        period: "per month",
        description: "Master tools for gyms, trainers, and fitness managers",
        icon: Building2,
        color: "from-purple-500 to-indigo-500",
        features: [
            "Everything in Pro, plus:",
            "Gym Management Dashboard",
            "Client Management Suite",
            "Online Coaching Platform",
            "Member Attendance Analytics",
            "Bulk Subscription Licensing"
        ],
        buttonText: "Contact Sales",
        link: "/contact",
        variant: "outline"
    }
];

export default function Pricing() {
    return (
        <div className="min-h-screen py-20 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4CC9F0]/10 rounded-full blur-[120px] -z-10" />

            <Container>
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-white">
                            Choose Your <span className="text-gradient">SmartFit AI Level</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground">
                            Unlock the full potential of AI-powered training with our flexible plans designed for every stage of your journey.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {tiers.map((tier, index) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`relative flex flex-col p-8 rounded-3xl glass border border-white/10 ${tier.popular ? "ring-2 ring-primary bg-primary/5" : ""
                                }`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-black text-sm font-bold rounded-full flex items-center gap-1 shadow-[0_0_20px_rgba(0,255,156,0.3)]">
                                    <Zap className="w-3 h-3 fill-current" />
                                    MOST POPULAR
                                </div>
                            )}

                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 rounded-2xl bg-gradient-to-br ${tier.color} bg-opacity-10`}>
                                    <tier.icon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-medium text-muted-foreground mr-1">₹</span>
                                    <span className="text-5xl font-bold text-white tracking-tight">{tier.price}</span>
                                    {tier.period && (
                                        <span className="text-sm text-muted-foreground ml-2">{tier.period}</span>
                                    )}
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {tier.description}
                                </p>
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                {tier.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3">
                                        <div className="mt-1 p-0.5 rounded-full bg-primary/20">
                                            <Check className="w-3 h-3 text-primary" />
                                        </div>
                                        <span className="text-sm text-gray-300">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                asChild
                                variant={(tier.variant as any)}
                                size="lg"
                                className={`w-full font-bold transition-all duration-300 ${tier.popular ? "hover:scale-[1.02] shadow-lg shadow-primary/20" : ""
                                    }`}
                            >
                                <Link to={tier.link}>
                                    {tier.buttonText}
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Link>
                            </Button>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ Section or Trust Badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="mt-20 pt-10 border-t border-white/5"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
                        <div className="flex items-center justify-center gap-2">
                            <Shield className="w-5 h-5" />
                            <span className="text-sm font-medium">Secure Payments</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <Crown className="w-5 h-5" />
                            <span className="text-sm font-medium">Premium Support</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <Flame className="w-5 h-5" />
                            <span className="text-sm font-medium">Goal Focused</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-sm font-medium">AI Powered</span>
                        </div>
                    </div>
                </motion.div>
            </Container>
        </div>
    );
}
