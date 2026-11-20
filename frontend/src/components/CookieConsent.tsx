import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  CookiePreferences,
  DEFAULT_COOKIE_PREFERENCES,
  getStoredLocalPreferences,
  fetchBackendCookiePreferences,
  persistCookiePreferences,
  OPEN_COOKIE_MODAL_EVENT,
} from "@/lib/cookieConsent";

export default function CookieConsent() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initPreferences() {
      const localPrefs = getStoredLocalPreferences();

      if (user?.id) {
        const backendPrefs = await fetchBackendCookiePreferences(user.id);
        if (!isMounted) return;

        if (backendPrefs) {
          persistCookiePreferences(backendPrefs, null);
          return;
        }

        if (localPrefs) {
          persistCookiePreferences(localPrefs, user.id);
          return;
        }
      }

      if (!localPrefs) {
        const timer = setTimeout(() => {
          if (isMounted) setIsVisible(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }

    initPreferences();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Open banner if triggered externally from Settings or Footer
  useEffect(() => {
    const handleOpen = () => setIsVisible(true);
    window.addEventListener(OPEN_COOKIE_MODAL_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_COOKIE_MODAL_EVENT, handleOpen);
  }, []);

  const handleAccept = async () => {
    setIsSaving(true);
    const updated: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      consentTimestamp: new Date().toISOString(),
      version: "2026.1",
      source: "banner",
    };

    await persistCookiePreferences(updated, user?.id);
    setIsSaving(false);
    setIsVisible(false);
  };

  const handleDecline = async () => {
    setIsSaving(true);
    const updated: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      consentTimestamp: new Date().toISOString(),
      version: "2026.1",
      source: "banner",
    };

    await persistCookiePreferences(updated, user?.id);
    setIsSaving(false);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-20 left-4 right-4 sm:bottom-5 sm:left-auto sm:right-5 z-50 pointer-events-none"
        >
          <div className="w-full sm:max-w-md bg-[#0c100e]/95 border border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 pointer-events-auto text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-[#00FF9C]/10 border border-[#00FF9C]/20 text-[#00FF9C] shrink-0">
                <Cookie className="w-4 h-4" />
              </div>
              <p className="text-xs text-zinc-300 leading-snug">
                We use cookies to tailor your workouts &amp; save progress.{" "}
                <Link to="/privacy" className="text-[#00FF9C] hover:underline font-medium">
                  Privacy
                </Link>
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleDecline}
                disabled={isSaving}
                className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors font-medium cursor-pointer"
              >
                Decline
              </button>
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={isSaving}
                className="bg-[#00FF9C] hover:bg-[#00e88c] text-black font-bold text-xs h-7 px-3 rounded-lg shadow-sm cursor-pointer"
              >
                Accept
              </Button>
              <button
                type="button"
                onClick={() => setIsVisible(false)}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors ml-0.5"
                aria-label="Dismiss cookie notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
