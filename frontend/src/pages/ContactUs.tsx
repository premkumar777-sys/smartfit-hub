import { useState } from "react";
import { Container } from "@/components/Container";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MessageCircle, MapPin, Send, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ContactUs() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name || !email || !subject || !message) {
            toast.error("Please fill in all form fields.");
            return;
        }

        setIsSubmitting(true);

        try {
            const { data, error } = await supabase.functions.invoke("send-email", {
                body: {
                    action: "contact-form",
                    email: email.trim(),
                    data: {
                        name: name.trim(),
                        subject: subject.trim(),
                        message: message.trim()
                    }
                }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            toast.success("🎉 Message sent successfully! We will get back to you shortly.");
            setName("");
            setEmail("");
            setSubject("");
            setMessage("");
        } catch (error: any) {
            console.error("Contact Form Error:", error);
            toast.error(error.message || "Failed to dispatch message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen py-20 bg-background text-white">
            <Container className="max-w-6xl">
                <Link
                    to="/"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                        Get In Touch
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
                        Have questions, feedback, or need premium support? Send us a message or reach out through our other communication channels.
                    </p>
                </div>

                <div className="grid md:grid-cols-5 gap-8 mb-12">
                    {/* Left Column: Contact Cards (Col Span 2) */}
                    <div className="md:col-span-2 space-y-4">
                        {/* Email Card */}
                        <Card className="bg-card/30 border-primary/10 hover:border-primary/30 backdrop-blur-md transition-all duration-300">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-1">Email Support</h3>
                                        <p className="text-muted-foreground text-xs mb-2">
                                            For technical issues or pricing.
                                        </p>
                                        <a
                                            href="mailto:smartfitai77@gmail.com"
                                            className="text-primary font-bold hover:underline text-sm transition-all"
                                        >
                                            smartfitai77@gmail.com
                                        </a>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Phone Card */}
                        <Card className="bg-card/30 border-primary/10 hover:border-primary/30 backdrop-blur-md transition-all duration-300">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-1">Phone Call</h3>
                                        <p className="text-muted-foreground text-xs mb-2">
                                            Mon-Sat, 10 AM - 7 PM IST.
                                        </p>
                                        <a
                                            href="tel:+917671862872"
                                            className="text-blue-400 font-bold hover:underline text-sm transition-all"
                                        >
                                            +91 7671862872
                                        </a>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* WhatsApp Card */}
                        <Card className="bg-card/30 border-primary/10 hover:border-primary/30 backdrop-blur-md transition-all duration-300">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/25 text-green-400">
                                        <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-1">WhatsApp</h3>
                                        <p className="text-muted-foreground text-xs mb-3">
                                            Fast response chat channels.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 border-green-500/50 text-green-400 hover:bg-green-500/10 font-bold text-xs rounded-lg transition-all"
                                            onClick={() => window.open("https://wa.me/917671862872?text=Hi, I have a query about SmartFit AI Hub", "_blank")}
                                        >
                                            Chat on WhatsApp
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Business Address Card */}
                        <Card className="bg-card/30 border-primary/10 hover:border-primary/30 backdrop-blur-md transition-all duration-300">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-1">Company</h3>
                                        <p className="text-muted-foreground text-xs leading-normal">
                                            SmartFit AI Hub is a digital fitness platform operated remotely.
                                        </p>
                                        <p className="text-purple-400 text-xs font-bold mt-2">
                                            Remote | India
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Contact Form (Col Span 3) */}
                    <div className="md:col-span-3">
                        <Card className="bg-card/25 border-primary/15 backdrop-blur-md rounded-2xl shadow-xl">
                            <CardContent className="p-6 md:p-8">
                                <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                                    📩 Send a Message
                                </h2>
                                
                                <form onSubmit={handleContactSubmit} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="contact-name" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Full Name</Label>
                                            <Input
                                                id="contact-name"
                                                type="text"
                                                placeholder="John Doe"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="bg-white/5 border-white/10 hover:border-white/20 focus:border-primary text-white rounded-xl h-11 transition-all"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="contact-email" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Email Address</Label>
                                            <Input
                                                id="contact-email"
                                                type="email"
                                                placeholder="john@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="bg-white/5 border-white/10 hover:border-white/20 focus:border-primary text-white rounded-xl h-11 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="contact-subject" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Subject</Label>
                                        <Input
                                            id="contact-subject"
                                            type="text"
                                            placeholder="Inquiry about pricing/features"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            className="bg-white/5 border-white/10 hover:border-white/20 focus:border-primary text-white rounded-xl h-11 transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="contact-message" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Message</Label>
                                        <Textarea
                                            id="contact-message"
                                            placeholder="Write your query details here..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={5}
                                            className="bg-white/5 border-white/10 hover:border-white/20 focus:border-primary text-white rounded-xl p-3.5 transition-all resize-none"
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-[#00ff9c] hover:bg-[#00e08b] text-black font-black h-11 rounded-xl transition-all uppercase text-xs tracking-wider flex items-center justify-center gap-2"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Sending Message...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Send Message
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Response Time Info */}
                <div className="text-center bg-muted/20 backdrop-blur-md rounded-2xl p-6 border border-white/5">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-[#00ff9c] mb-1">Expected Response Time</h3>
                    <p className="text-muted-foreground text-sm leading-normal max-w-xl mx-auto">
                        We typically respond to emails within <strong>24-48 hours</strong>. For immediate assistance, please use WhatsApp or call us directly.
                    </p>
                </div>
            </Container>
        </div>
    );
}
