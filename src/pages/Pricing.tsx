import { Button } from "@/components/ui/button";
import { Check, Flame, Zap, Shield, Sparkles, Building2, User, ArrowRight, Video, Target, Trophy, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";
import { COACHING_PLAN } from "@/config/payments";
import { Badge } from "@/components/ui/badge";

export default function Pricing() {
    const freeFeatures = [
        "AI Workout Generation",
        "Real-time AI Form Detection",
        "Nutrition & Macro Tracking",
        "Advanced Gamification",
        "Progress Analytics",
        "Home Workout access"
    ];

    return (
        <div className="min-h-screen py-20 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -z-10" />

            <Container>
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                            Major Update: SmartFit AI 2.0
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight mb-4 text-white">
                            Now <span className="text-gradient">Free for All</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground">
                            We've unlocked all our premium AI features for everyone. No subscriptions, no hidden fees. Just elite training tools at your fingertips.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
                    {/* Free Everything Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative flex flex-col p-8 rounded-3xl glass border border-white/10 bg-white/5"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-blue-500">
                                <Zap className="w-6 h-6 text-black" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">All-In-One Free</h3>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-medium text-muted-foreground mr-1">₹</span>
                                <span className="text-5xl font-bold text-white tracking-tight">0</span>
                                <span className="text-sm text-muted-foreground ml-2">Forever</span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Everything you need to transform your fitness.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mb-8">
                            {freeFeatures.map((feature) => (
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
                            variant="hero"
                            size="lg"
                            className="w-full font-bold shadow-lg shadow-primary/20"
                        >
                            <Link to="/auth">
                                Get Started Free
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                        </Button>
                    </motion.div>

                    {/* Paid Add-on Card: Online Coaching */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative flex flex-col p-8 rounded-3xl glass border border-[#00FF9C]/30 bg-primary/5"
                    >
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#00FF9C] text-black text-xs font-bold rounded-full flex items-center gap-1 shadow-[0_0_20px_rgba(0,255,156,0.3)]">
                            <Sparkles className="w-3 h-3 fill-current" />
                            EXCLUSIVE ADD-ON
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-[#00FF9C]">
                                <Video className="w-6 h-6 text-black" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white font-outfit uppercase tracking-wider">Online Coaching</h3>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-medium text-muted-foreground mr-1">₹</span>
                                <span className="text-5xl font-bold text-white tracking-tight">{COACHING_PLAN.price}</span>
                                <span className="text-sm text-muted-foreground ml-2">per month</span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Personalized 1:1 mentorship from elite trainers.
                            </p>
                        </div>

                        <div className="space-y-4 mb-8 flex-1">
                            {[
                                "Weekly 1:1 Video Consultations",
                                "Custom Workout Periodization",
                                "Daily Direct Chat Access",
                                "Professional Form Analysis",
                                "Personal Bio-feedback Monitoring"
                            ].map((feature) => (
                                <div key={feature} className="flex items-start gap-3">
                                    <div className="mt-1 p-0.5 rounded-full bg-[#00FF9C]/20">
                                        <Target className="w-3 h-3 text-[#00FF9C]" />
                                    </div>
                                    <span className="text-sm text-gray-300">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="w-full font-bold border-[#00FF9C]/30 text-[#00FF9C] hover:bg-[#00FF9C]/10"
                        >
                            <Link to="/online-coaching">
                                View Coaching Details
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                        </Button>
                    </motion.div>
                </div>

                {/* FAQ / Trust Section */}
                <div className="mt-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                            <Shield className="w-8 h-8 mx-auto mb-4 text-blue-400" />
                            <h4 className="text-lg font-bold text-white mb-2">No Credit Card Required</h4>
                            <p className="text-sm text-gray-400">Start training immediately with all our core AI features for ₹0.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                            <Clock className="w-8 h-8 mx-auto mb-4 text-primary" />
                            <h4 className="text-lg font-bold text-white mb-2">Unlimited Access</h4>
                            <p className="text-sm text-gray-400">No session limits or locked features. Full power, all the time.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                            <Trophy className="w-8 h-8 mx-auto mb-4 text-amber-400" />
                            <h4 className="text-lg font-bold text-white mb-2">Quality Commitment</h4>
                            <p className="text-sm text-gray-400">Our coaching add-on comes with a 100% satisfaction guarantee.</p>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
