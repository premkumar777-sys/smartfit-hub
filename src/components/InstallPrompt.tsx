import { useState, useEffect } from 'react';
import { Download, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Show the primary install promotion
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            (window as any).gtag?.('event', 'pwa_prompt_accepted', {
                event_category: 'PWA',
                event_label: 'Custom Prompt'
            });
            console.log('User accepted the install prompt');
        } else {
            (window as any).gtag?.('event', 'pwa_prompt_dismissed', {
                event_category: 'PWA',
                event_label: 'Custom Prompt'
            });
            console.log('User dismissed the install prompt');
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-[100]"
            >
                <div className="glass p-5 rounded-2xl border border-primary/20 shadow-2xl relative overflow-hidden group">
                    {/* Animated Background Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-purple-500/10 blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>

                    <div className="relative flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 p-1">
                            <img 
                                src="/favicon.png" 
                                alt="SmartFit AI Logo" 
                                className="w-9 h-9 object-contain"
                                style={{ filter: 'drop-shadow(0 0 8px rgba(0, 255, 156, 0.4))' }}
                            />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-white font-bold leading-tight">Install SmartFit AI</h3>
                            <p className="text-muted-foreground text-xs mt-1">
                                Add to your home screen for a faster, app-like experience.
                            </p>

                            <div className="flex items-center gap-2 mt-4">
                                <Button
                                    size="sm"
                                    onClick={handleInstall}
                                    className="bg-primary hover:bg-primary/90 text-black font-bold h-8 px-4"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Install App
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowPrompt(false)}
                                    className="h-8 px-3 text-muted-foreground hover:text-white"
                                >
                                    Maybe Later
                                </Button>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowPrompt(false)}
                            className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
