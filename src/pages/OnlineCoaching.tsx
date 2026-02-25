import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Calendar, Video, Star, Users, Trophy, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { openPaymentLink, COACHING_PLAN, WHATSAPP_NUMBER } from "@/config/payments";
import { AddClientDialog } from "@/components/trainer/AddClientDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";

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
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isFormOpen, setIsFormOpen] = useState(false);

    const { isAuthenticated } = useAuth();
    const { hasPremiumAccess } = useSubscription();

    // Auto-open form if they returned from a successful payment
    useEffect(() => {
        const paymentStatus = searchParams.get("payment_status");
        if (paymentStatus === "Credit") {
            // Only auto-open if verified premium or at least authenticated (to prevent drive-by URL manipulation)
            if (isAuthenticated) {
                setIsFormOpen(true);
                toast.success("Payment successful! Please complete your onboarding details.", {
                    duration: 5000,
                });
            } else {
                toast.error("Please sign in to complete onboarding.");
            }
        }
    }, [searchParams, isAuthenticated]);

    const handleApply = async (formData: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // 1. Construct WhatsApp message for the coach
            const messageBody = `*Online Coaching Client Details*\n\n` +
                `Your Transformation starts here ⚡️\n\n` +
                `*Name :* ${formData.full_name}\n` +
                `*Age :* ${formData.age || 'N/A'}\n` +
                `*City :* ${formData.city || 'N/A'}\n` +
                `*Country :* ${formData.country || 'N/A'}\n` +
                `*Height in feet :* ${formData.height_feet || 'N/A'}\n` +
                `*Current Body Weight in kgs :* ${formData.current_weight_kg}\n` +
                `*Dream Body Weight in kgs :* ${formData.target_weight_kg}\n` +
                `*Occupation :* ${formData.occupation || 'N/A'}\n` +
                `*Mobile number :* ${formData.phone || 'N/A'}\n` +
                `*Whatsapp number :* ${formData.whatsapp_number || 'N/A'}\n` +
                `*Choose your primary goal :* ${formData.primary_goal || 'N/A'}\n` +
                `*Prior Training Experience :* ${formData.prior_experience || 'N/A'}\n` +
                `*Preferred Training Type :* ${formData.training_type || 'N/A'}\n` +
                `*Plans Interested :* ${formData.plan_duration || 'N/A'}\n` +
                `*Diet :* ${formData.diet_preference || 'N/A'}\n` +
                `*Any Habits ? :* ${formData.habits || 'None'}\n` +
                `*Do you suffer from any of the following conditions ? :* ${formData.medical_conditions || 'None'}\n` +
                `*If you are on any medications, Please mention them. :* ${formData.medications || 'No'}\n` +
                `*If you have any injuries,, Please mention them. :* ${formData.injuries || 'No'}\n\n` +
                `*Payment Status :* ${formData.is_enrolled ? 'PAID ✅' : 'NOT PAID ❌'}\n` +
                `*UTR Number :* ${formData.payment_id || 'N/A'}`;

            const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageBody)}`;

            // 2. Save application data to trainer_clients table (Background - Non-blocking)
            supabase
                .from('trainer_clients')
                .insert({
                    full_name: formData.full_name,
                    email: formData.email || null,
                    phone: formData.phone || null,
                    whatsapp_number: formData.whatsapp_number || null,
                    whatsapp_group_link: formData.whatsapp_group_link || null,
                    status: formData.is_enrolled ? 'active' : 'pending',
                    progress: 0,
                    age: formData.age ? parseInt(formData.age) : null,
                    city: formData.city || null,
                    country: formData.country || null,
                    occupation: formData.occupation || null,
                    height_feet: formData.height_feet ? parseFloat(formData.height_feet) : null,
                    current_weight_kg: formData.current_weight_kg ? parseFloat(formData.current_weight_kg) : null,
                    target_weight_kg: formData.target_weight_kg ? parseFloat(formData.target_weight_kg) : null,
                    primary_goal: formData.primary_goal || null,
                    prior_experience: formData.prior_experience || null,
                    training_type: formData.training_type || null,
                    plan_duration: formData.plan_duration || null,
                    diet_preference: formData.diet_preference || null,
                    habits: formData.habits || null,
                    medical_conditions: formData.medical_conditions || null,
                    medications: formData.medications || null,
                    injuries: formData.injuries || null,
                    is_enrolled: formData.is_enrolled || false,
                    trainer_id: '00000000-0000-0000-0000-000000000000', // Default Head Coach ID
                    user_id: user?.id || null
                })
                .then(({ error }) => {
                    if (error) console.warn("Supabase background sync failed:", error.message);
                });

            toast.success("Onboarding complete! Opening WhatsApp...");

            // 3. Open WhatsApp in new tab
            window.open(waUrl, '_blank');
            setIsFormOpen(false);
        } catch (error) {
            console.error("Error submitting application:", error);
            toast.error("Process interrupted. Please try again.");
            throw error;
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-12 bg-background">
            <Container>
                {/* Back Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="mb-6 text-gray-400 hover:text-white -ml-2"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Return to Hub
                </Button>

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

                        <div className="space-y-4">
                            <p className="text-[#00FF9C] text-sm font-medium animate-pulse">
                                Step 1: Pay ➔ Step 2: Fill Form
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    onClick={() => openPaymentLink(COACHING_PLAN.link)}
                                    className="bg-[#00FF9C] text-black hover:bg-[#00FF9C]/90 h-12 px-8 text-lg font-bold"
                                >
                                    1. Secure Your Spot
                                </Button>
                                <Button
                                    onClick={() => setIsFormOpen(true)}
                                    variant="outline"
                                    className="h-12 px-8 text-lg border-[#00FF9C]/30 text-[#00FF9C] hover:bg-[#00FF9C]/10"
                                >
                                    2. Fill Onboarding Form
                                </Button>
                            </div>
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
                                {COACHING_PLAN.price} <span className="text-lg text-gray-500 font-normal">/ month</span>
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
                            <div className="space-y-4 w-full max-w-sm mx-auto">
                                <p className="text-[#00FF9C] text-sm font-medium">Follow these steps carefully:</p>
                                <Button
                                    onClick={() => openPaymentLink(COACHING_PLAN.link)}
                                    className="w-full bg-[#00FF9C] text-black hover:bg-[#00FF9C]/90 h-14 text-lg font-bold shadow-[0_0_20px_rgba(0,255,156,0.3)]"
                                >
                                    1. Secure Your Spot (Pay {COACHING_PLAN.price})
                                </Button>
                                <Button
                                    onClick={() => setIsFormOpen(true)}
                                    variant="outline"
                                    className="w-full h-14 text-lg font-bold border-[#00FF9C]/30 text-[#00FF9C] hover:bg-[#00FF9C]/10"
                                >
                                    2. Fill Onboarding Form
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">Only 2 spots left for this month.</p>
                        </CardContent>
                    </Card>
                </div>

                <AddClientDialog
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    onSubmit={handleApply}
                    title="Online Onboarding Form"
                    description="Congratulations on your enrollment! Please fill out your details so the Head Coach can build your custom transformation plan."
                    submitText="Submit Application"
                />
            </Container>
        </div>
    );
}
