import { useState, useEffect } from "react";
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Calendar, Video, Star, Users, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { openPaymentLink, COACHING_PLAN } from "@/config/payments";
import { BusinessPremiumLock } from "@/components/BusinessPremiumLock";

// Animated Counter Component
const AnimatedCounter = ({
    end,
    duration = 2000,
    suffix = "",
    decimals = 0
}: {
    end: number;
    duration?: number;
    suffix?: string;
    decimals?: number;
}) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(easeOutQuart * end);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    const displayValue = decimals > 0
        ? count.toFixed(decimals)
        : Math.floor(count).toLocaleString();

    return <>{displayValue}{suffix}</>;
};

export default function OnlineCoaching() {
    return (
        <div className="min-h-screen pt-20 pb-12 bg-background">
            <Container>
                <BusinessPremiumLock
                    title="Unlock Expert Coaching"
                    description="Get 1:1 mentorship from elite trainers who will build your roadmap to success."
                    features={[
                        "Weekly 1:1 Video Calls",
                        "Custom Workout Periodization",
                        "Daily Direct Chat Access",
                        "Video Form Analysis"
                    ]}
                >
                    {/* Hero / Profile Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Badge className="mb-4 bg-[#00FF9C]/10 text-[#00FF9C] hover:bg-[#00FF9C]/20 border-none">
                                <Star className="w-3 h-3 mr-1 fill-current" /> Official Head Coach
                            </Badge>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                                Train 1:1 with <br />
                                <span className="text-[#00FF9C]">Expert Guidance</span>
                            </h1>
                            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                Get personalized attention, custom workout plans, and real-time form correction directly from the Head Coach. No generic bots—just real, human coaching tailored to your unique goals.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <Button className="bg-[#00FF9C] text-black hover:bg-[#00FF9C]/90 h-12 px-8 text-lg font-bold">
                                    Book Consultation
                                </Button>
                                <Button variant="outline" className="h-12 px-8 text-lg border-gray-700 hover:bg-gray-800">
                                    View Transformations
                                </Button>
                            </div>

                            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-gray-800 pt-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#00FF9C]/10">
                                        <Video className="w-5 h-5 text-[#00FF9C]" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white">Weekly Calls</h4>
                                        <p className="text-xs text-gray-500">1:1 Video Sessions</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                        <Calendar className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white">30-Day Plans</h4>
                                        <p className="text-xs text-gray-500">Custom Programs</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/10">
                                        <Check className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white">24/7 Support</h4>
                                        <p className="text-xs text-gray-500">Always Available</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="relative"
                        >
                            {/* Enhanced Visual Section */}
                            <div className="relative">
                                {/* Main Gradient Background */}
                                <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-[#00FF9C]/20 via-blue-500/10 to-purple-500/20 border border-[#00FF9C]/20 relative">
                                    {/* Animated Glow Effects */}
                                    <div className="absolute inset-0">
                                        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#00FF9C]/30 rounded-full blur-3xl animate-pulse" />
                                        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
                                    </div>

                                    {/* Central Icon */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative">
                                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00FF9C] to-[#00FF9C]/50 flex items-center justify-center shadow-[0_0_60px_rgba(0,255,156,0.4)]">
                                                <Video className="w-16 h-16 text-black" />
                                            </div>
                                            {/* Pulsing Ring */}
                                            <div className="absolute inset-0 rounded-full border-2 border-[#00FF9C]/50 animate-ping" />
                                        </div>
                                    </div>

                                    {/* Floating Feature Cards */}
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5, duration: 0.5 }}
                                        className="absolute top-6 right-6"
                                    >
                                        <Card className="bg-black/80 backdrop-blur-md border-[#00FF9C]/30 shadow-xl">
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-[#00FF9C]/10 text-[#00FF9C]">
                                                    <Trophy className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">Certified</p>
                                                    <p className="text-sm font-bold text-white">NASM Elite</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>

                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.7, duration: 0.5 }}
                                        className="absolute bottom-6 left-6"
                                    >
                                        <Card className="bg-black/80 backdrop-blur-md border-blue-500/30 shadow-xl">
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-blue-500/10 text-blue-400">
                                                    <Video className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">Live Sessions</p>
                                                    <p className="text-sm font-bold text-white">Always Available</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>

                                    <motion.div
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.9, duration: 0.5 }}
                                        className="absolute top-6 left-6"
                                    >
                                        <Card className="bg-black/80 backdrop-blur-md border-purple-500/30 shadow-xl">
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-purple-500/10 text-purple-400">
                                                    <Star className="w-5 h-5 fill-current" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">Success Rate</p>
                                                    <p className="text-sm font-bold text-white">98% Goals Hit</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>

                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 1.1, duration: 0.5 }}
                                        className="absolute bottom-6 right-6"
                                    >
                                        <Card className="bg-black/80 backdrop-blur-md border-amber-500/30 shadow-xl">
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-amber-500/10 text-amber-400">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">Flexible</p>
                                                    <p className="text-sm font-bold text-white">Your Schedule</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </div>

                                {/* Testimonial Strip */}
                                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-2">
                                            {['bg-gradient-to-br from-pink-400 to-pink-600', 'bg-gradient-to-br from-blue-400 to-blue-600', 'bg-gradient-to-br from-green-400 to-green-600'].map((bg, i) => (
                                                <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-gray-900 flex items-center justify-center text-white text-xs font-bold`}>
                                                    {['A', 'R', 'K'][i]}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-white font-medium">"Life-changing coaching!"</p>
                                            <p className="text-xs text-gray-400">Join 500+ successful clients</p>
                                        </div>
                                        <div className="flex text-[#00FF9C]">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-current" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Offerings Section */}
                    <div className="mb-20">
                        <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: Video,
                                    title: "1:1 Live Video Calls",
                                    desc: "Weekly 60-min video calls to check form, adjust plans, and discuss progress."
                                },
                                {
                                    icon: Calendar,
                                    title: "Custom Schedules",
                                    desc: "Workouts tailored to your equipment, time, and goals. Updated weekly."
                                },
                                {
                                    icon: Check,
                                    title: "Daily Accountability",
                                    desc: "Direct chat access for questions. Never feel lost in the gym again."
                                }
                            ].map((item, i) => (
                                <Card key={i} className="bg-card/30 border-gray-800 hover:bg-card/50 transition-all">
                                    <CardContent className="p-8 text-center space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-[#00FF9C]/10 flex items-center justify-center mx-auto text-[#00FF9C]">
                                            <item.icon className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">{item.title}</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Pricing / Booking */}
                    <div className="max-w-3xl mx-auto">
                        <Card className="bg-gradient-to-b from-gray-900 to-black border-gray-800 relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00FF9C] to-transparent opacity-50" />
                            <CardContent className="p-10 text-center space-y-8">
                                <Badge className="bg-[#00FF9C] text-black hover:bg-[#00FF9C]">Limited Spots Available</Badge>
                                <h2 className="text-3xl font-bold text-white">Exclusive 1:1 Coaching</h2>
                                <div className="text-5xl font-bold text-white">
                                    ₹199 <span className="text-lg text-gray-500 font-normal">/ month</span>
                                </div>
                                <ul className="text-left space-y-4 max-w-sm mx-auto">
                                    {[
                                        "Custom Nutrition & Workout Plan",
                                        "4x Video Consultations (45 mins)",
                                        "Unlimited Chat Support",
                                        "Form Analysis via App"
                                    ].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3 text-gray-300">
                                            <Check className="w-5 h-5 text-[#00FF9C]" /> {feat}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    onClick={() => openPaymentLink(COACHING_PLAN.link)}
                                    className="w-full max-w-sm bg-[#00FF9C] text-black hover:bg-[#00FF9C]/90 h-14 text-lg font-bold shadow-[0_0_20px_rgba(0,255,156,0.3)]"
                                >
                                    Apply Now
                                </Button>
                                <p className="text-xs text-gray-500">Only 2 spots left for this month.</p>
                            </CardContent>
                        </Card>
                    </div>
                </BusinessPremiumLock>
            </Container>
        </div>
    );
}
