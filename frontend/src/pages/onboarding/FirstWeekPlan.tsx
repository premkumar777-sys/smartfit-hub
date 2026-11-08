import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Dumbbell,
  Moon,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { updateOnboardingDraft } from "@/lib/onboarding";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type DayType = "workout" | "rest";

interface DayPlan {
  id: string;
  dayShort: string;
  dayFull: string;
  type: DayType;
  title: string;
  subtitle: string;
  duration?: string;
  focus: string;
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const WEEK_PLAN: DayPlan[] = [
  {
    id: "mon",
    dayShort: "Mon",
    dayFull: "Monday",
    type: "workout",
    title: "Monday: Full body A",
    subtitle: "Full body",
    duration: "45 min",
    focus:
      "Focus on compound movements: Goblet squats, dumbbell bench press, and supported rows with guided rest intervals.",
  },
  {
    id: "tue",
    dayShort: "Tue",
    dayFull: "Tuesday",
    type: "rest",
    title: "Tuesday: Rest & recovery",
    subtitle: "Rest",
    duration: "Recovery",
    focus:
      "Active recovery or full rest. Light stretching and hydration keep muscles relaxed and restore glycogen stores.",
  },
  {
    id: "wed",
    dayShort: "Wed",
    dayFull: "Wednesday",
    type: "workout",
    title: "Wednesday: Full body B",
    subtitle: "Full body",
    duration: "45 min",
    focus:
      "Posterior chain and core emphasis: Romanian deadlifts, overhead presses, and lunges with controlled tempos.",
  },
  {
    id: "thu",
    dayShort: "Thu",
    dayFull: "Thursday",
    type: "rest",
    title: "Thursday: Rest & recovery",
    subtitle: "Rest",
    duration: "Recovery",
    focus:
      "Preserve joint integrity. Prioritize 7-8 hours of sleep and adequate protein intake to support muscle repair.",
  },
  {
    id: "fri",
    dayShort: "Fri",
    dayFull: "Friday",
    type: "workout",
    title: "Friday: Full body C",
    subtitle: "Full body",
    duration: "45 min",
    focus:
      "Strength capacity & density: Lat pulldowns, incline dumbbell presses, and split squats to cap off the training week.",
  },
  {
    id: "sat",
    dayShort: "Sat",
    dayFull: "Saturday",
    type: "rest",
    title: "Saturday: Weekend rest",
    subtitle: "Rest",
    duration: "Recovery",
    focus:
      "Total body reset. Outdoor leisure walking or recreational mobility work to stay active without fatigue.",
  },
  {
    id: "sun",
    dayShort: "Sun",
    dayFull: "Sunday",
    type: "rest",
    title: "Sunday: Weekly reset",
    subtitle: "Rest",
    duration: "Recovery",
    focus:
      "Weekly reset and preparation. Review upcoming sessions and set recovery priorities for the week ahead.",
  },
];

const CURRENT_STEP = 5;
const TOTAL_STEPS = 5;

/* ─── FirstWeekPlan Page ─────────────────────────────────────────────────── */
export default function FirstWeekPlan() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [selectedDayId, setSelectedDayId] = useState<string>("mon");

  const activeDay = WEEK_PLAN.find((d) => d.id === selectedDayId) || WEEK_PLAN[0];

  const handleSavePlan = () => {
    updateOnboardingDraft({ planId: "first_week_balanced_v1" });
    navigate("/auth?from=onboarding", { state: { returnUrl: "/app/today" } });
  };

  const handleContinueWithoutAccount = () => {
    updateOnboardingDraft({ planId: "first_week_balanced_v1" });
    localStorage.setItem("smartfit_guest_plan_active", "true");
    navigate("/app/today");
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
          onClick={() => navigate("/onboarding/training-days")}
          aria-label="Go back"
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full active:scale-95 transition-transform"
          style={{ color: "var(--sf-text)" }}
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
        </button>

        {/* Centered step label */}
        <p className="text-sm font-medium" style={{ color: "var(--sf-text-2)" }}>
          Step {CURRENT_STEP} of {TOTAL_STEPS}
        </p>

        {/* Placeholder spacer to keep step label perfectly centered */}
        <div className="w-10 -mr-2" aria-hidden="true" />
      </header>

      {/* ── Scrollable content ── */}
      <main
        className="flex-1 overflow-y-auto px-4 pt-4 space-y-4"
        style={{ paddingBottom: "calc(140px + env(safe-area-inset-bottom))" }}
      >
        {/* Title & subtitle */}
        <div>
          <h1
            className="text-2xl font-semibold mb-1 leading-tight"
            style={{ color: "var(--sf-text)" }}
          >
            Your first week is ready
          </h1>
          <p className="text-sm" style={{ color: "var(--sf-text-2)" }}>
            Based on your goal, level, and schedule.
          </p>
        </div>

        {/* ── Section: Weekly schedule ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-semibold" style={{ color: "var(--sf-text)" }}>
              Weekly schedule
            </h2>
            <span className="text-xs" style={{ color: "var(--sf-text-2)" }}>
              Tap day to inspect
            </span>
          </div>

          {/* Horizontal scroll cards */}
          <div
            className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 scroll-smooth"
            role="tablist"
            aria-label="Days of the week"
          >
            {WEEK_PLAN.map((item) => {
              const isSelected = item.id === selectedDayId;
              const isWorkout = item.type === "workout";

              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedDayId(item.id)}
                  className={cn(
                    "flex flex-col justify-between p-3 rounded-2xl border text-left shrink-0 w-[100px] h-[88px]",
                    "transition-colors duration-150",
                    !reducedMotion && "active:scale-[0.97]"
                  )}
                  style={{
                    backgroundColor: isSelected ? "var(--sf-tint)" : "var(--sf-surface)",
                    borderColor: isSelected ? "var(--sf-primary)" : "var(--sf-border)",
                  }}
                >
                  {/* Top row: Day label + icon */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: isSelected ? "var(--sf-primary)" : "var(--sf-text-2)",
                      }}
                    >
                      {item.dayShort}
                    </span>
                    {isWorkout ? (
                      <ArrowUpRight
                        className="w-3.5 h-3.5"
                        style={{
                          color: isSelected ? "var(--sf-primary)" : "var(--sf-text-2)",
                        }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Moon
                        className="w-3.5 h-3.5"
                        style={{
                          color: isSelected ? "var(--sf-primary)" : "var(--sf-text-2)",
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {/* Bottom row: Subtitle + duration */}
                  <div className="min-w-0">
                    <span
                      className="block text-xs font-semibold truncate leading-tight"
                      style={{ color: "var(--sf-text)" }}
                    >
                      {item.subtitle}
                    </span>
                    <span
                      className="block text-[11px] truncate mt-0.5"
                      style={{ color: "var(--sf-text-2)" }}
                    >
                      {item.duration}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Inspected Day Detail Card ── */}
        <div
          className="rounded-2xl border p-4"
          style={{
            backgroundColor: "var(--sf-surface)",
            borderColor: "var(--sf-border)",
          }}
        >
          <div className="flex items-start gap-3.5 mb-2.5">
            <span
              className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
              style={{ backgroundColor: "var(--sf-tint)" }}
            >
              {activeDay.type === "workout" ? (
                <Dumbbell
                  className="w-5 h-5"
                  strokeWidth={1.75}
                  style={{ color: "var(--sf-primary)" }}
                  aria-hidden="true"
                />
              ) : (
                <Moon
                  className="w-5 h-5"
                  strokeWidth={1.75}
                  style={{ color: "var(--sf-primary)" }}
                  aria-hidden="true"
                />
              )}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3
                  className="text-sm font-semibold leading-snug truncate"
                  style={{ color: "var(--sf-text)" }}
                >
                  {activeDay.title}
                </h3>
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0"
                  style={{
                    backgroundColor: "var(--sf-tint)",
                    color: "var(--sf-primary)",
                  }}
                >
                  {activeDay.duration}
                </span>
              </div>
            </div>
          </div>

          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--sf-text-2)" }}
          >
            {activeDay.focus}
          </p>
        </div>

        {/* ── Smart calibration feature card ── */}
        <div
          className="flex items-center gap-3.5 p-4 rounded-2xl border"
          style={{
            backgroundColor: "var(--sf-surface)",
            borderColor: "var(--sf-border)",
          }}
        >
          <div
            className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border"
            style={{
              backgroundColor: "var(--sf-tint)",
              borderColor: "var(--sf-border)",
            }}
          >
            <img
              src="/auth-hero.png"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <span
              className="block text-[11px] font-semibold uppercase tracking-wider mb-0.5"
              style={{ color: "var(--sf-primary)" }}
            >
              Smart calibration
            </span>
            <p
              className="text-sm font-semibold leading-snug"
              style={{ color: "var(--sf-text)" }}
            >
              Personalized baseline
            </p>
            <p
              className="text-xs mt-0.5 leading-relaxed truncate"
              style={{ color: "var(--sf-text-2)" }}
            >
              Your set weights start conservative so you can build...
            </p>
          </div>
        </div>

        {/* ── What to expect card ── */}
        <div
          className="rounded-2xl border p-4 space-y-3"
          style={{
            backgroundColor: "var(--sf-surface)",
            borderColor: "var(--sf-border)",
          }}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--sf-text)" }}
            >
              What to expect
            </h3>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: "var(--sf-tint)",
                color: "var(--sf-primary)",
              }}
            >
              Estimate
            </span>
          </div>

          {/* Highlight banner */}
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: "var(--sf-tint)" }}
          >
            <p
              className="text-xs font-medium leading-relaxed"
              style={{ color: "var(--sf-text)" }}
            >
              3 structured gym sessions • ~135 minutes total training • Built for
              steady progression without burnout
            </p>
          </div>

          {/* Bullet 1 */}
          <div className="flex items-start gap-3">
            <RefreshCw
              className="w-4 h-4 mt-0.5 shrink-0"
              strokeWidth={1.75}
              style={{ color: "var(--sf-primary)" }}
              aria-hidden="true"
            />
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--sf-text-2)" }}
            >
              Weights and sets calibrate after every workout based on your logged
              RPE and movement pace.
            </p>
          </div>

          {/* Bullet 2 */}
          <div className="flex items-start gap-3">
            <Moon
              className="w-4 h-4 mt-0.5 shrink-0"
              strokeWidth={1.75}
              style={{ color: "var(--sf-primary)" }}
              aria-hidden="true"
            />
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--sf-text-2)" }}
            >
              Four rest days preserve joint health and ensure your nervous
              system recovers completely.
            </p>
          </div>
        </div>
      </main>

      {/* ── Fixed bottom action area ── */}
      <footer
        className="fixed bottom-0 inset-x-0 px-4 pt-3 border-t"
        style={{
          backgroundColor: "var(--sf-surface)",
          borderColor: "var(--sf-border)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
          zIndex: "var(--z-bars)",
        }}
      >
        {/* Save my plan */}
        <button
          type="button"
          onClick={handleSavePlan}
          className="w-full h-[52px] rounded-xl text-sm font-semibold mb-1"
          style={{
            backgroundColor: "var(--sf-primary)",
            color: "var(--sf-on-primary)",
          }}
        >
          Save my plan
        </button>

        {/* Continue without an account */}
        <button
          type="button"
          onClick={handleContinueWithoutAccount}
          className="w-full h-11 flex items-center justify-center text-xs font-medium"
          style={{ color: "var(--sf-text-2)" }}
        >
          Continue without an account
        </button>
      </footer>
    </div>
  );
}
