import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Calendar, Video, Star, Users, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { openPaymentLink, COACHING_PLAN } from "@/config/payments";
import { BusinessPremiumLock } from "@/components/BusinessPremiumLock";

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
                                <div>
                                    <h4 className="text-3xl font-bold text-white">500+</h4>
                                    <p className="text-sm text-gray-500">Clients Trained</p>
                                </div>
                                <div>
                                    <h4 className="text-3xl font-bold text-white">10k+</h4>
                                    <p className="text-sm text-gray-500">Sessions</p>
                                </div>
                                <div>
                                    <h4 className="text-3xl font-bold text-white">4.9</h4>
                                    <p className="text-sm text-gray-500">Rating</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="relative"
                        >
                            {/* Placeholder for Coach Image */}
                            <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-800 relative group">
                                <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                                    <Users className="w-24 h-24 opacity-20" />
                                    <span className="absolute mt-32 text-sm uppercase tracking-widest opacity-40"> Coach Photo </span>
                                </div>

                                {/* Floating Cards */}
                                <Card className="absolute top-8 right-8 bg-black/80 backdrop-blur-md border-gray-700 w-48 shadow-xl animate-bounce-slow">
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

                                <Card className="absolute bottom-12 left-8 bg-black/80 backdrop-blur-md border-gray-700 w-56 shadow-xl animate-bounce-slow delay-700">
                                    <CardContent className="p-4 flex items-center gap-3 desktop:hidden">
                                        <div className="p-2 rounded-full bg-blue-500/10 text-blue-400">
                                            <Video className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Live Session</p>
                                            <p className="text-sm font-bold text-white">Ready to connect</p>
                                        </div>
                                    </CardContent>
                                </Card>
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
                                    ₹4,999 <span className="text-lg text-gray-500 font-normal">/ month</span>
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
