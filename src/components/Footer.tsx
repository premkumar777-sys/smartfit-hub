import { Link } from "react-router-dom";
import { Container } from "@/components/Container";
import { Mail, Phone, Instagram, Linkedin, MessageCircle, Youtube } from "lucide-react";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-card/30 border-t border-border mt-auto">
            <Container>
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
                            <div className="flex gap-3">
                                <a
                                    href="https://www.instagram.com/smartfitaii/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                                    aria-label="Instagram"
                                >
                                    <Instagram className="w-4 h-4" />
                                </a>
                                <a
                                    href="https://www.linkedin.com/company/112396192/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                                    aria-label="LinkedIn"
                                >
                                    <Linkedin className="w-4 h-4" />
                                </a>
                                <a
                                    href="https://chat.whatsapp.com/EiRKjJBISlW2HmtYwpnbxh"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                                    aria-label="WhatsApp Group"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </a>
                                <a
                                    href="https://www.youtube.com/@Smartfitaii-p2m"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                                    aria-label="YouTube"
                                >
                                    <Youtube className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary">Features</h3>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/ai-workout" className="text-muted-foreground hover:text-foreground transition-colors">AI Workout Generator</Link></li>
                                <li><Link to="/ai-trainer" className="text-muted-foreground hover:text-foreground transition-colors">AI Personal Trainer</Link></li>
                                <li><Link to="/nutrition" className="text-muted-foreground hover:text-foreground transition-colors">Nutrition Planner</Link></li>
                                <li><Link to="/3d-trainer" className="text-muted-foreground hover:text-foreground transition-colors">3D Trainer Mode</Link></li>
                                <li><Link to="/progress" className="text-muted-foreground hover:text-foreground transition-colors">Progress Tracking</Link></li>
                                <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing & Plans</Link></li>
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
                                    <a href="mailto:smartfitai77@gmail.com" className="hover:text-foreground transition-colors">
                                        smartfitai77@gmail.com
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
