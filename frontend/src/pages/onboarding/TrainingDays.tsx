import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, Bell, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getOnboardingDraft, updateOnboardingDraft } from "@/lib/onboarding";
import { OnboardingProgressBar } from "@/components/onboarding/OnboardingProgressBar";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Day {
  key: string;
  label: string;
  full: string;
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const DAYS: Day[] = [
  { key: "mon", label: "M", full: "Monday" },
  { key: "tue", label: "T", full: "Tuesday" },
  { key: "wed", label: "W", full: "Wednesday" },
  { key: "thu", label: "T", full: "Thursday" },
  { key: "fri", label: "F", full: "Friday" },
  { key: "sat", label: "S", full: "Saturday" },
  { key: "sun", label: "S", full: "Sunday" },
];

const DEFAULT_DAYS = ["mon", "wed", "fri"];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatTime(value: string): string {
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

/* ─── TrainingDays page ──────────────────────────────────────────────────── */
export default function TrainingDays() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const [selectedDays, setSelectedDays] = useState<string[]>(() => {
    const draft = getOnboardingDraft();
    return draft.trainingDays?.length ? draft.trainingDays : DEFAULT_DAYS;
  });
  const [reminderOn, setReminderOn] = useState(() => getOnboardingDraft().reminder.enabled);
  const [reminderTime, setReminderTime] = useState(() => getOnboardingDraft().reminder.time || "18:30");

  const trainingCount = selectedDays.length;
  const restCount = 7 - trainingCount;

  const toggleDay = (key: string) => {
    setSelectedDays((prev) => {
      const updated = prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key];
      updateOnboardingDraft({
        trainingDays: updated,
        reminder: { enabled: reminderOn, time: reminderTime },
      });
      return updated;
    });
  };

  const handleContinue = () => {
    updateOnboardingDraft({
      trainingDays: selectedDays,
      reminder: { enabled: reminderOn, time: reminderTime },
    });
    navigate("/onboarding/first-week");
  };

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ backgroundColor: "var(--sf-bg)", color: "var(--sf-text)" }}
    >
      {/* ── Top bar ── */}
      <header
        className="flex items-center justify-between px-4 h-14 shrink-0"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          backgroundColor: "var(--sf-bg)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/onboarding/body-metrics")}
          aria-label="Go back"
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full active:scale-95 transition-transform"
          style={{ color: "var(--sf-text)" }}
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
        </button>

        {/* Top Progress Track */}
        <OnboardingProgressBar fromPercent={60} valuePercent={selectedDays.length > 0 ? 80 : 65} />

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="text-sm font-medium min-h-[44px] min-w-[44px] flex items-center justify-center px-2"
          style={{ color: "var(--sf-primary)" }}
        >
          Skip
        </button>
      </header>

      {/* ── Scrollable content ── */}
      <main
        className="flex-1 overflow-y-auto px-4 pt-4"
        style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom))" }}
      >
        {/* Heading */}
        <h1
          className="text-2xl font-semibold mb-1 leading-tight"
          style={{ color: "var(--sf-text)" }}
        >
          Which days can you train?
        </h1>
        <p className="text-sm mb-5" style={{ color: "var(--sf-text-2)" }}>
          We recommend 3 days for your level, with rest days in between.
        </p>

        {/* ── Day pill selector ── */}
        <div className="grid grid-cols-7 gap-1.5 mb-3" role="group" aria-label="Select training days">
          {DAYS.map((day) => {
            const isSelected = selectedDays.includes(day.key);
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => toggleDay(day.key)}
                aria-pressed={isSelected}
                aria-label={day.full}
                className={cn(
                  "flex items-center justify-center h-11 rounded-xl text-sm font-semibold border",
                  "transition-colors duration-200",
                  !reducedMotion && "active:scale-95"
                )}
                style={{
                  backgroundColor: isSelected ? "var(--sf-primary)" : "var(--sf-surface)",
                  color: isSelected ? "var(--sf-on-primary)" : "var(--sf-text-2)",
                  borderColor: isSelected ? "var(--sf-primary)" : "var(--sf-border)",
                }}
              >
                {day.label}
              </button>
            );
          })}
        </div>

        {/* ── Summary row ── */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-medium" style={{ color: "var(--sf-text-2)" }}>
            {trainingCount} training {trainingCount === 1 ? "day" : "days"}&nbsp;•&nbsp;
            {restCount} rest {restCount === 1 ? "day" : "days"}
          </p>
          <div className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--sf-text-2)" }} aria-hidden="true" />
            <p className="text-xs" style={{ color: "var(--sf-text-2)" }}>
              Rest days support recovery
            </p>
          </div>
        </div>

        {/* ── Reminder card ── */}
        <div
          className="rounded-2xl border mb-3 overflow-hidden"
          style={{
            backgroundColor: "var(--sf-surface)",
            borderColor: "var(--sf-border)",
          }}
        >
          {/* Toggle row */}
          <div className="flex items-center gap-3 px-4 py-4 min-h-[72px]">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
              style={{ backgroundColor: "var(--sf-tint)" }}
            >
              <Bell className="w-4.5 h-4.5 w-5 h-5" strokeWidth={1.75} style={{ color: "var(--sf-primary)" }} aria-hidden="true" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug" style={{ color: "var(--sf-text)" }}>
                Training reminder
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--sf-text-2)" }}>
                Get a notification to pack your gym bag
              </p>
            </div>

            <Switch
              checked={reminderOn}
              onCheckedChange={setReminderOn}
              aria-label="Enable training reminder"
              className="shrink-0 data-[state=checked]:!bg-[var(--sf-primary)]"
            />
          </div>

          {/* Reminder time row — only when reminder is on */}
          {reminderOn && (
            <>
              <div className="h-px mx-4" style={{ backgroundColor: "var(--sf-border)" }} />
              <div className="flex items-center gap-3 px-4 py-4 min-h-[56px]">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                  style={{ backgroundColor: "var(--sf-tint)" }}
                >
                  <Clock className="w-5 h-5" strokeWidth={1.75} style={{ color: "var(--sf-text-2)" }} aria-hidden="true" />
                </div>

                <p className="flex-1 text-sm" style={{ color: "var(--sf-text)" }}>
                  Reminder time
                </p>

                {/* Native time picker — hidden behind styled display */}
                <label className="relative flex items-center gap-1 cursor-pointer min-h-[44px]">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--sf-primary)" }}
                  >
                    {formatTime(reminderTime)}
                  </span>
                  <ChevronDown
                    className="w-4 h-4"
                    style={{ color: "var(--sf-primary)" }}
                    aria-hidden="true"
                  />
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    aria-label="Set reminder time"
                  />
                </label>
              </div>
            </>
          )}
        </div>

        {/* ── Info tip banner ── */}
        <div
          className="flex items-start gap-3 p-4 rounded-2xl mb-4"
          style={{ backgroundColor: "var(--sf-tint)" }}
          role="note"
        >
          <Info
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: "var(--sf-primary)" }}
            aria-hidden="true"
          />
          <p className="text-xs leading-relaxed" style={{ color: "var(--sf-text-2)" }}>
            Consistency beats intensity. You can always adjust your schedule or swap workout days in
            your weekly planner.
          </p>
        </div>

        {/* ── Feature card ── */}
        <div
          className="flex items-center gap-4 p-4 rounded-2xl border"
          style={{
            backgroundColor: "var(--sf-surface)",
            borderColor: "var(--sf-border)",
          }}
        >
          {/* Thumbnail */}
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: "var(--sf-tint)" }}>
            <img
              src="/auth-hero.png"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--sf-text)" }}>
              Adaptive calendar balance
            </p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--sf-text-2)" }}>
              SmartFit AI balances intensity curves against your sleep cycle
            </p>
          </div>
        </div>
      </main>

      {/* ── Fixed bottom action bar ── */}
      <footer
        className="fixed bottom-0 inset-x-0 px-4 pt-3 border-t"
        style={{
          backgroundColor: "var(--sf-surface)",
          borderColor: "var(--sf-border)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
          zIndex: "var(--z-bars)",
        }}
      >
        <button
          type="button"
          onClick={handleContinue}
          disabled={selectedDays.length === 0}
          className={cn(
            "w-full h-[52px] rounded-xl text-sm font-semibold",
            "transition-opacity duration-200",
            selectedDays.length === 0
              ? "opacity-40 cursor-not-allowed"
              : "cursor-pointer"
          )}
          style={{
            backgroundColor: "var(--sf-primary)",
            color: "var(--sf-on-primary)",
          }}
        >
          Continue
        </button>
      </footer>
    </div>
  );
}
