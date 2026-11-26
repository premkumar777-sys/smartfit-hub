import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BellRing, ShieldCheck, Flame, Utensils, X, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { isPushSupported, getNotificationPermission } from "@/lib/pushNotifications";
import { supabase } from "@/integrations/supabase/client";

const SNOOZE_STORAGE_KEY = "smartfit_notification_modal_snoozed_until";
const SNOOZE_DAYS = 5;

export function NotificationPermissionModal() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Athlete");
  const [selectedTime, setSelectedTime] = useState("18:30");

  const { enableNotifications, loading } = usePushNotifications(userId, userName);

  useEffect(() => {
    // Only check if notifications are supported
    if (!isPushSupported()) return;

    // If permission is already granted or blocked/denied, do not prompt
    if (getNotificationPermission() !== "default") return;

    // Check if snooze period is active
    const snoozedUntil = localStorage.getItem(SNOOZE_STORAGE_KEY);
    if (snoozedUntil && new Date().getTime() < Number(snoozedUntil)) {
      return;
    }

    // Don't show on auth or onboarding screens
    const path = location.pathname;
    const isExcluded =
      path === "/auth" ||
      path.startsWith("/onboarding") ||
      path === "/privacy" ||
      path === "/terms" ||
      path === "/reset-password";
    if (isExcluded) return;

    // Check user session
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user;
      if (sessionUser) {
        setUserId(sessionUser.id);
        const name =
          sessionUser.user_metadata?.full_name?.split(" ")[0] ||
          sessionUser.user_metadata?.username ||
          "Athlete";
        setUserName(name);

        // Delay popup by 2.5 seconds so user has time to orient themselves
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 2500);
        return () => clearTimeout(timer);
      }
    });
  }, [location.pathname]);

  const handleDismiss = () => {
    setIsOpen(false);
    // Snooze for 5 days
    const snoozeTime = new Date().getTime() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(SNOOZE_STORAGE_KEY, String(snoozeTime));
  };

  const handleEnable = async () => {
    await enableNotifications(selectedTime);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
        {/* Backdrop click to dismiss */}
        <div className="absolute inset-0" onClick={handleDismiss} />

        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#121614] via-[#0b0e0c] to-[#070908] p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(0,255,156,0.15)] text-white z-10 overflow-hidden"
        >
          {/* Glowing Ambient Ring */}
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-[#00FF9C]/15 blur-[60px] pointer-events-none" />

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss notification modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00FF9C]/40 bg-[#00FF9C]/10 text-[#00FF9C] shadow-[0_0_20px_rgba(0,255,156,0.25)] shrink-0">
              <BellRing className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#00FF9C] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#00FF9C]" />
                Daily Habit Shield
              </span>
              <h3 className="text-xl font-extrabold tracking-tight text-white">
                Never Break Your Streak, {userName}!
              </h3>
            </div>
          </div>

          <p className="text-sm text-white/70 leading-relaxed mb-5">
            Athletes who enable daily reminders are <strong className="text-white">3.4x more consistent</strong> in hitting their muscle and fitness goals. Get gentle, guilt-free nudges:
          </p>

          {/* Value Props */}
          <div className="space-y-3 mb-6 bg-white/[0.03] border border-white/10 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#00FF9C] shrink-0 mt-0.5" />
              <div className="text-xs text-white/80">
                <strong className="text-white">Workout Push Notification:</strong> Your tailored training split delivered right to your lock screen.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Utensils className="w-4 h-4 text-[#00FF9C] shrink-0 mt-0.5" />
              <div className="text-xs text-white/80">
                <strong className="text-white">Meal Tracking Nudge:</strong> Quick reminder to snap lunch so you hit your protein target.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#00FF9C] shrink-0 mt-0.5" />
              <div className="text-xs text-white/80">
                <strong className="text-white">Streak Protection:</strong> We alert you in the evening before your streak resets.
              </div>
            </div>
          </div>

          {/* Preferred Time Selector */}
          <div className="mb-6 flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-white/70">
              <Clock className="w-4 h-4 text-[#00FF9C]" />
              <span>Preferred reminder time:</span>
            </div>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#00FF9C] outline-none cursor-pointer"
            >
              <option value="06:30" className="bg-[#101412] text-white">06:30 AM (Morning)</option>
              <option value="13:00" className="bg-[#101412] text-white">01:00 PM (Lunch)</option>
              <option value="17:30" className="bg-[#101412] text-white">05:30 PM (Pre-Gym)</option>
              <option value="18:30" className="bg-[#101412] text-white">06:30 PM (Evening)</option>
              <option value="20:00" className="bg-[#101412] text-white">08:00 PM (Night)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              onClick={handleEnable}
              disabled={loading}
              className="w-full sm:flex-1 h-12 rounded-xl bg-[#00FF9C] hover:bg-[#00e58a] text-black font-extrabold text-sm shadow-[0_0_25px_rgba(0,255,156,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <BellRing className="w-4 h-4 text-black" />
              <span>{loading ? "Connecting Devices…" : "Turn On Daily Reminders"}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleDismiss}
              className="w-full sm:w-auto h-12 rounded-xl text-white/50 hover:text-white hover:bg-white/5 text-xs font-medium cursor-pointer"
            >
              Maybe Later
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
