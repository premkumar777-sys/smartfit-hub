import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    ArrowLeft, Award, Flame, Users, Sparkles, 
    User, Mail, Phone, Globe
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { WHATSAPP_NUMBER } from "@/config/payments";

export default function BecomeCoach() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        experience: "1-3 years",
        specialization: "",
        certifications: "",
        socialLink: "",
        bio: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Construct WhatsApp message
            const message = `*NEW PARTNER COACH APPLICATION*\n\n` +
                `⚡️ *Personal Details* ⚡️\n` +
                `• *Name:* ${formData.fullName}\n` +
                `• *Email:* ${formData.email}\n` +
                `• *Phone:* ${formData.phone}\n\n` +
                `💪 *Professional Details* 💪\n` +
                `• *Experience:* ${formData.experience}\n` +
                `• *Specialty:* ${formData.specialization}\n` +
                `• *Certifications:* ${formData.certifications}\n` +
                `• *Social Profile:* ${formData.socialLink || 'N/A'}\n\n` +
                `📝 *Bio/Philosophy:* ${formData.bio || 'N/A'}`;

            const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
            
            toast.success("Application details generated! Opening WhatsApp to send...", {
                duration: 4000
            });

            // Delay redirection slightly to let user read toast
            setTimeout(() => {
                window.open(waUrl, "_blank");
                setIsLoading(false);
            }, 1000);
        } catch (error) {
            console.error("Submission failed", error);
            toast.error("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-28 lg:pb-16 bg-background relative overflow-hidden">
            {/* Visual background elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00FF9C]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

            <Container className="relative z-10">
                {/* Back Link */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="mb-8 text-gray-400 hover:text-white -ml-2 transition-colors"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left Column: Information & Value Prop */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="space-y-4">
                            <Badge className="bg-[#00FF9C]/10 text-[#00FF9C] hover:bg-[#00FF9C]/20 border-none px-3 py-1 text-xs uppercase font-bold tracking-wider">
                                <Sparkles className="w-3.5 h-3.5 mr-1 animate-pulse" /> Partner Coach Program
                            </Badge>
                            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                                Train Online with <br />
                                <span className="text-[#00FF9C]">SmartFitAI</span>
                            </h1>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Join our network of certified fitness professionals, athletes, and bodybuilders. Offer customized digital training, reach clients globally, and leverage our advanced AI tools to scale your business.
                            </p>
                        </div>

                        {/* Value proposition items */}
                        <div className="space-y-4">
                            {[
                                {
                                    icon: Users,
                                    title: "Access Global Clients",
                                    desc: "Tap into our growing database of active members looking for professional coaching."
                                },
                                {
                                    icon: Flame,
                                    title: "AI-Powered Efficiency",
                                    desc: "Use our state-of-the-art workout and diet planners to draft expert programs in seconds."
                                },
                                {
                                    icon: Award,
                                    title: "Zero Setup Cost",
                                    desc: "Get listed in our trainer registry and start onboarding clients with zero upfront platform fees."
                                }
                            ].map((item, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex gap-4 p-4 rounded-2xl bg-card/20 border border-white/5 hover:border-[#00FF9C]/20 transition-all group"
                                >
                                    <div className="p-3 rounded-xl bg-[#00FF9C]/10 text-[#00FF9C] h-fit group-hover:scale-110 transition-transform">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-base">{item.title}</h3>
                                        <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Application Form */}
                    <div className="lg:col-span-7">
                        <Card className="bg-card/40 border-white/10 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#00FF9C] to-blue-500" />
                            <CardContent className="p-8 md:p-10 space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-white">Coach Application Form</h2>
                                    <p className="text-sm text-gray-400">Fill in your details below. The Head Coach team will review and contact you on WhatsApp.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Full Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName" className="text-xs uppercase font-bold tracking-wider text-gray-400">Full Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <Input
                                                    id="fullName"
                                                    name="fullName"
                                                    type="text"
                                                    placeholder="John Doe"
                                                    value={formData.fullName}
                                                    onChange={handleChange}
                                                    className="pl-10 bg-white/5 border-white/10 text-white rounded-xl focus:border-[#00FF9C] focus:ring-[#00FF9C]"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-xs uppercase font-bold tracking-wider text-gray-400">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="pl-10 bg-white/5 border-white/10 text-white rounded-xl focus:border-[#00FF9C] focus:ring-[#00FF9C]"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Phone / WhatsApp */}
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-xs uppercase font-bold tracking-wider text-gray-400">WhatsApp Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <Input
                                                    id="phone"
                                                    name="phone"
                                                    type="tel"
                                                    placeholder="+91 9876543210"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="pl-10 bg-white/5 border-white/10 text-white rounded-xl focus:border-[#00FF9C] focus:ring-[#00FF9C]"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Experience Dropdown */}
                                        <div className="space-y-2">
                                            <Label htmlFor="experience" className="text-xs uppercase font-bold tracking-wider text-gray-400">Coaching Experience</Label>
                                            <select
                                                id="experience"
                                                name="experience"
                                                value={formData.experience}
                                                onChange={handleChange}
                                                className="w-full h-10 px-3 bg-neutral-900 border border-white/10 text-white rounded-xl focus:border-[#00FF9C] focus:ring-[#00FF9C] text-sm"
                                                required
                                            >
                                                <option value="Under 1 year">Under 1 year</option>
                                                <option value="1-3 years">1-3 years</option>
                                                <option value="3-5 years">3-5 years</option>
                                                <option value="5+ years">5+ years</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Specialization */}
                                    <div className="space-y-2">
                                        <Label htmlFor="specialization" className="text-xs uppercase font-bold tracking-wider text-gray-400">Primary Specialization</Label>
                                        <Input
                                            id="specialization"
                                            name="specialization"
                                            type="text"
                                            placeholder="e.g. Bodybuilding, Strength Coaching, Fat Loss, Powerlifting"
                                            value={formData.specialization}
                                            onChange={handleChange}
                                            className="bg-white/5 border-white/10 text-white rounded-xl focus:border-[#00FF9C] focus:ring-[#00FF9C]"
                                            required
                                        />
                                    </div>

                                    {/* Certifications */}
                                    <div className="space-y-2">
                                        <Label htmlFor="certifications" className="text-xs uppercase font-bold tracking-wider text-gray-400">Certifications & Qualifications</Label>
                                        <Input
                                            id="certifications"
                                            name="certifications"
                                            type="text"
                                            placeholder="e.g. NASM CPT, ISSA, Olympic Weightlifting Coach, Pro Athlete"
                                            value={formData.certifications}
                                            onChange={handleChange}
                                            className="bg-white/5 border-white/10 text-white rounded-xl focus:border-[#00FF9C] focus:ring-[#00FF9C]"
                                            required
                                        />
                                    </div>

                                    {/* Social Media Link */}
                                    <div className="space-y-2">
                                        <Label htmlFor="socialLink" className="text-xs uppercase font-bold tracking-wider text-gray-400">Social Media / Website Link</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <Input
                                                id="socialLink"
                                                name="socialLink"
                                                type="url"
                                                placeholder="e.g. https://instagram.com/yourprofile"
                                                value={formData.socialLink}
                                                onChange={handleChange}
                                                className="pl-10 bg-white/5 border-white/10 text-white rounded-xl focus:border-[#00FF9C] focus:ring-[#00FF9C]"
                                            />
                                        </div>
                                    </div>

                                    {/* Bio / Message */}
                                    <div className="space-y-2">
                                        <Label htmlFor="bio" className="text-xs uppercase font-bold tracking-wider text-gray-400">Bio & Training Philosophy</Label>
                                        <Textarea
                                            id="bio"
                                            name="bio"
                                            placeholder="Tell us about your background, who you love training, and why you want to join SmartFitAI..."
                                            value={formData.bio}
                                            onChange={handleChange}
                                            rows={4}
                                            className="bg-white/5 border-white/10 text-white rounded-xl focus:border-[#00FF9C] focus:ring-[#00FF9C] resize-none"
                                            required
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-[#00FF9C] hover:bg-[#00e08b] text-black font-black h-12 rounded-xl transition-all uppercase tracking-wider text-xs"
                                    >
                                        {isLoading ? "Generating Application..." : "Submit Application"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </Container>
        </div>
    );
}
