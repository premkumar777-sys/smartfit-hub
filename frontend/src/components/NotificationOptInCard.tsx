import { useState } from "react";
import { Bell, BellRing, ShieldCheck, Sparkles, X, Check, Clock } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

interface NotificationOptInCardProps {
  userId?: string | null;
  userName?: string;
  className?: string;
}

export function NotificationOptInCard({ userId, userName, className }: NotificationOptInCardProps) {
  const {
    supported,
    permission,
    isSubscribed,
    loading,
    preferredTime,
    changeReminderTime,
    enableNotifications,
    sendTest,
  } = usePushNotifications(userId, userName);

  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("smartfit_reminder_prompt_dismissed") === "true";
  });

  if (!supported || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("smartfit_reminder_prompt_dismissed", "true");
  };

  const isEnabled = permission === "granted" && isSubscribed;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-[#101412] p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all",
        className
      )}
    >
      {/* Ambient background glow */}
      <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#00FF9C]/10 blur-[50px] pointer-events-none" />

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        aria-label="Dismiss reminder prompt"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        {/* Left Icon Badge */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#00FF9C]/30 bg-[#00FF9C]/10 text-[#00FF9C] shadow-[0_0_15px_rgba(0,255,156,0.15)]">
          {isEnabled ? <ShieldCheck className="h-6 w-6" /> : <BellRing className="h-6 w-6" />}
        </div>

        {/* Content */}
        <div className="flex-1 pr-6">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-white tracking-tight sm:text-lg">
              {isEnabled ? "Reminders & Streak Shield Active" : "Smart Reminders & Streak Shield"}
            </h4>
            <span className="rounded-full bg-[#00FF9C]/15 px-2 py-0.5 text-[10px] font-bold text-[#00FF9C]">
              AI Adaptive
            </span>
          </div>

          <p className="mt-1 text-xs sm:text-sm text-white/60 leading-relaxed">
            {isEnabled
              ? "Your streak is protected! SmartFit AI dispatches gentle, adaptive reminders at your scheduled workout hour."
              : "Never lose your workout habit. Get gentle, guilt-free AI reminders at your preferred training time."}
          </p>

          {/* Time Picker & Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {!isEnabled ? (
              <>
                <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white">
                  <Clock className="w-3.5 h-3.5 text-white/50" />
                  <span className="text-white/50">Remind at:</span>
                  <select
                    value={preferredTime}
                    onChange={(e) => changeReminderTime(e.target.value)}
                    className="bg-transparent font-semibold text-[#00FF9C] focus:outline-none cursor-pointer"
                  >
                    <option value="06:30" className="bg-[#101412] text-white">06:30 AM</option>
                    <option value="07:30" className="bg-[#101412] text-white">07:30 AM</option>
                    <option value="12:30" className="bg-[#101412] text-white">12:30 PM</option>
                    <option value="17:30" className="bg-[#101412] text-white">05:30 PM</option>
                    <option value="18:30" className="bg-[#101412] text-white">06:30 PM</option>
                    <option value="19:30" className="bg-[#101412] text-white">07:30 PM</option>
                    <option value="20:30" className="bg-[#101412] text-white">08:30 PM</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => enableNotifications(preferredTime)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00FF9C] px-4 py-2 text-xs font-bold text-black hover:bg-[#00cc7a] transition-all shadow-[0_0_15px_rgba(0,255,156,0.25)] active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>{loading ? "Activating…" : "Enable Reminders"}</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 rounded-xl border border-[#00FF9C]/20 bg-[#00FF9C]/10 px-3 py-1.5 text-xs font-semibold text-[#00FF9C]">
                  <Check className="h-4 w-4" />
                  <span>Daily check-in at {formatTimeDisplay(preferredTime)}</span>
                </div>

                <button
                  type="button"
                  onClick={sendTest}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 hover:border-[#00FF9C]/40 transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#00FF9C]" />
                  <span>Send Test Push</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeDisplay(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${mStr} ${period}`;
}
