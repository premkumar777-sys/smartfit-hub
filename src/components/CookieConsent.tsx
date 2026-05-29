import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("smartfit-cookie-consent");
        if (!consent) {
            // Show banner after 1.5 seconds for smooth UX
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("smartfit-cookie-consent", "accepted");
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem("smartfit-cookie-consent", "declined");
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6 flex justify-center pointer-events-none"
                >
                    <div className="w-full max-w-4xl bg-black/85 border border-white/10 backdrop-blur-xl rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-[0_-20px_50px_rgba(0,180,255,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-5 pointer-events-auto">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary shrink-0 relative overflow-hidden group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-transparent blur-md opacity-50 pointer-events-none"></div>
                                <Cookie className="w-6 h-6 animate-pulse text-primary relative z-10" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    Cookie Consent <ShieldCheck className="w-4 h-4 text-accent" />
                                </h3>
                                <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">
                                    We use cookies to optimize your training plans, store your preferences, and secure your session data. By clicking "Accept All", you agree to our cookie usage. View our{" "}
                                    <Link to="/privacy-policy" className="text-primary hover:underline font-medium">
                                        Privacy Policy
                                    </Link>{" "}
                                    for more details.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDecline}
                                className="border-white/10 hover:bg-white/5 hover:text-white transition-all text-xs font-semibold px-4 py-2.5 rounded-xl"
                            >
                                Decline
                            </Button>
                            <Button
                                variant="hero"
                                size="sm"
                                onClick={handleAccept}
                                className="shadow-[0_0_20px_rgba(0,180,255,0.25)] text-xs font-semibold px-5 py-2.5 rounded-xl"
                            >
                                Accept All
                            </Button>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors md:relative md:top-auto md:right-auto"
                                aria-label="Close panel"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
