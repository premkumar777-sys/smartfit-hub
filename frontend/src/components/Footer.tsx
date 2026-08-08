import { Link } from "react-router-dom";
import { Container } from "@/components/Container";
import { Mail, Phone, Instagram, Linkedin, MessageCircle, Youtube, Facebook } from "lucide-react";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative overflow-hidden bg-card/30 border-t border-border mt-auto">
            {/* Background Image - Option 2 Everfit Luminous Mesh with Light Opacity */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-screen pointer-events-none"
                style={{ backgroundImage: `url('/bg-option-2.png')` }}
            />
            {/* Ambient Radial Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

            <Container className="relative z-10">
                <div className="pt-12 pb-28 lg:pb-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Brand Column */}
                        <div className="md:col-span-1">
                            <Link to="/" className="flex items-center gap-2 mb-4">
                                <img
                                    src="/favicon.png"
                                    alt="SmartFitAI"
                                    className="w-8 h-8 object-contain"
                                    style={{ filter: "drop-shadow(0 0 8px rgba(0, 255, 156, 0.4))" }}
                                />
                                <span className="font-bold text-lg text-white">SmartFitAI</span>
                            </Link>
                            <p className="text-sm text-muted-foreground mb-4">
                                AI-powered fitness platform for personalized workouts, nutrition planning, and real-time coaching.
                            </p>
                            <div className="flex items-center gap-3">
                                {/* Facebook */}
                                <a
                                    href="https://www.facebook.com/SmartFitAI"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md hover:scale-110 hover:shadow-[#1877F2]/30 transition-all duration-200"
                                    aria-label="Facebook"
                                >
                                    <Facebook className="w-5 h-5 fill-white text-[#1877F2]" />
                                </a>

                                {/* Instagram */}
                                <a
                                    href="https://www.instagram.com/smartfitaii/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-md hover:scale-110 hover:shadow-[#dc2743]/30 transition-all duration-200"
                                    aria-label="Instagram"
                                >
                                    <Instagram className="w-5 h-5 text-white" />
                                </a>

                                {/* LinkedIn */}
                                <a
                                    href="https://www.linkedin.com/company/112396192/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 rounded bg-[#0A66C2] text-white flex items-center justify-center shadow-md hover:scale-110 hover:shadow-[#0A66C2]/30 transition-all duration-200"
                                    aria-label="LinkedIn"
                                >
                                    <Linkedin className="w-5 h-5 fill-white text-[#0A66C2]" />
                                </a>

                                {/* YouTube */}
                                <a
                                    href="https://www.youtube.com/@Smartfitaii-p2m"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-7 rounded-lg bg-[#FF0000] text-white flex items-center justify-center shadow-md hover:scale-110 hover:shadow-[#FF0000]/30 transition-all duration-200"
                                    aria-label="YouTube"
                                >
                                    <Youtube className="w-5 h-5 fill-white text-[#FF0000]" />
                                </a>

                                {/* WhatsApp */}
                                <a
                                    href="https://chat.whatsapp.com/EiRKjJBISlW2HmtYwpnbxh"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md hover:scale-110 hover:shadow-[#25D366]/30 transition-all duration-200"
                                    aria-label="WhatsApp Group"
                                >
                                    <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary">Features</h3>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/events" className="text-[#00FF9C] font-semibold hover:text-[#00FF9C]/80 transition-colors">Events & Competitions 🔥</Link></li>
                                <li><Link to="/ai-workout" className="text-muted-foreground hover:text-foreground transition-colors">AI Workout Generator</Link></li>
                                <li><Link to="/ai-trainer" className="text-muted-foreground hover:text-foreground transition-colors">AI Personal Trainer</Link></li>
                                <li><Link to="/nutrition" className="text-muted-foreground hover:text-foreground transition-colors">Nutrition Planner</Link></li>
                                <li><Link to="/3d-trainer" className="text-muted-foreground hover:text-foreground transition-colors">3D Trainer Mode</Link></li>
                                <li><Link to="/progress" className="text-muted-foreground hover:text-foreground transition-colors">Progress Tracking</Link></li>
                                <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing & Plans</Link></li>
                                <li><Link to="/events" className="text-muted-foreground hover:text-foreground transition-colors">Campus Events 🏆</Link></li>
                                <li><Link to="/become-a-coach" className="text-[#00FF9C] hover:text-[#00FF9C]/80 font-bold transition-colors">Join as Trainer / Coach 🤝</Link></li>
                            </ul>
                        </div>

                        {/* Legal Links */}
                        <div>
                            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary">Legal</h3>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
                                <li><Link to="/shipping" className="text-muted-foreground hover:text-foreground transition-colors">Shipping Policy</Link></li>
                                <li><Link to="/refund" className="text-muted-foreground hover:text-foreground transition-colors">Refund Policy</Link></li>
                                <li><Link to="/delete-account" className="text-muted-foreground hover:text-foreground transition-colors">Delete Account</Link></li>
                                <li><Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link></li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary">Contact</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="w-4 h-4 text-primary" />
                                    <a href="mailto:contact@smartfitai.in" className="hover:text-foreground transition-colors">
                                        contact@smartfitai.in
                                    </a>
                                </li>
                                <li className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="w-4 h-4 text-primary" />
                                    <a href="tel:+917671862872" className="hover:text-foreground transition-colors">
                                        +91 7671862872
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            © {currentYear} SmartFitAI. All rights reserved.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Made with 💚 for fitness enthusiasts
                        </p>
                    </div>
                </div>
            </Container>
        </footer>
    );
}
