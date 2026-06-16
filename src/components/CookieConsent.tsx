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
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="fixed bottom-24 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto z-50 p-0 w-auto sm:w-[380px] pointer-events-none"
                >
                    <div className="w-full bg-[#0a0a0a]/95 border border-white/10 backdrop-blur-xl rounded-2xl p-5 shadow-[10px_-10px_50px_rgba(0,180,255,0.15)] flex flex-col gap-4 pointer-events-auto relative overflow-hidden">
                        {/* Glow effect */}
                        <div className="absolute -top-10 -left-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
                        
                        {/* Header Row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 relative overflow-hidden">
                                    <Cookie className="w-5 h-5 text-primary relative z-10 animate-pulse" />
                                </div>
                                <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                                    Cookies <ShieldCheck className="w-4 h-4 text-accent" />
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                aria-label="Close details"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                            We use cookies to personalize your workouts, save your streaking milestones, and secure your dashboard stats. Agree to optimize your training experience, or view our{" "}
                            <Link to="/privacy" className="text-primary hover:underline font-semibold">
                                Privacy Policy
                            </Link>{" "}
                            to learn more.
                        </p>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 mt-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDecline}
                                className="border-white/10 hover:bg-white/5 hover:text-white text-xs font-semibold px-4 py-2 rounded-xl h-9"
                            >
                                Decline
                            </Button>
                            <Button
                                variant="hero"
                                size="sm"
                                onClick={handleAccept}
                                className="shadow-[0_0_20px_rgba(0,180,255,0.25)] text-xs font-semibold px-4 py-2 rounded-xl h-9"
                            >
                                Accept All
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
