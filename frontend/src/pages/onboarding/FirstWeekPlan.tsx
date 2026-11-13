import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Dumbbell,
  Moon,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Zap,
  Flame,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { updateOnboardingDraft, getPersonalizedPlan, PersonalizedPlan, syncOnboardingToProfile } from "@/lib/onboarding";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingProgressBar } from "@/components/onboarding/OnboardingProgressBar";

export default function FirstWeekPlan() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  // Load calculated plan dynamically from user's draft choices
  const [plan, setPlan] = useState<PersonalizedPlan>(() => getPersonalizedPlan());
  const [selectedDayId, setSelectedDayId] = useState<string>(() => {
    const firstWorkout = plan.weekPlan.find((d) => d.type === "workout");
    return firstWorkout ? firstWorkout.id : "mon";
  });

  // 1.8s "AI Calibrating" transition for user satisfaction
  const [isCalibrating, setIsCalibrating] = useState<boolean>(() => {
    return !localStorage.getItem("smartfit_calibration_seen");
  });
  const [calibrationStep, setCalibrationStep] = useState(0);

  useEffect(() => {
    const freshPlan = getPersonalizedPlan();
    setPlan(freshPlan);
    const firstWorkout = freshPlan.weekPlan.find((d) => d.type === "workout");
    if (firstWorkout) {
      setSelectedDayId(firstWorkout.id);
    }

    if (!localStorage.getItem("smartfit_calibration_seen")) {
      const t1 = setTimeout(() => setCalibrationStep(1), 600);
      const t2 = setTimeout(() => setCalibrationStep(2), 1200);
      const t3 = setTimeout(() => {
        setIsCalibrating(false);
        localStorage.setItem("smartfit_calibration_seen", "true");
      }, 1800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, []);

  const activeDay = plan.weekPlan.find((d) => d.id === selectedDayId) || plan.weekPlan[0];

  const handleSavePlan = async () => {
    updateOnboardingDraft({ planId: `personalized_${plan.primaryGoalId}` });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await syncOnboardingToProfile(session.user.id);
        navigate("/app/today");
        return;
      }
    } catch (err) {
      console.warn("Could not check active session on save plan:", err);
    }
    localStorage.setItem("smartfit_guest_plan_active", "true");
    navigate("/auth?from=onboarding", { state: { returnUrl: "/app/today" } });
  };

  const handleContinueWithoutAccount = () => {
    updateOnboardingDraft({ planId: `personalized_${plan.primaryGoalId}` });
    localStorage.setItem("smartfit_guest_plan_active", "true");
    navigate("/app/today");
  };

  if (isCalibrating && !reducedMotion) {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center p-6 text-center select-none"
        style={{ backgroundColor: "var(--sf-bg)", color: "var(--sf-text)" }}
      >
        <div className="w-16 h-16 rounded-2xl bg-[#00FF9C]/15 border border-[#00FF9C]/30 flex items-center justify-center mb-6 animate-pulse">
          <Sparkles className="w-8 h-8 text-[#00FF9C]" />
        </div>

        <h2 className="text-xl font-bold tracking-tight mb-2">
          Generating Your Custom Plan
        </h2>
        <p className="text-sm text-neutral-400 max-w-xs mb-8">
          Analyzing metrics, weekly volume, and recovery curves...
        </p>

        <div className="w-full max-w-xs space-y-3 text-left">
          <div className="flex items-center gap-3 text-xs">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                calibrationStep >= 0 ? "bg-[#00FF9C] animate-pulse" : "bg-neutral-600"
              )}
            />
            <span className={calibrationStep >= 0 ? "text-white font-medium" : "text-neutral-500"}>
              Calculated BMR &amp; TDEE for {plan.dailyCalories} kcal target
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                calibrationStep >= 1 ? "bg-[#00FF9C] animate-pulse" : "bg-neutral-600"
              )}
            />
            <span className={calibrationStep >= 1 ? "text-white font-medium" : "text-neutral-500"}>
              Tailored {plan.trainingDays.length}-day split: {plan.primaryGoalTitle}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                calibrationStep >= 2 ? "bg-[#00FF9C] animate-pulse" : "bg-neutral-600"
              )}
            />
            <span className={calibrationStep >= 2 ? "text-white font-medium" : "text-neutral-500"}>
              High-protein macro distribution: {plan.macros.protein}g protein
            </span>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Top Progress Track */}
        <OnboardingProgressBar fromPercent={80} valuePercent={100} />

        {/* Placeholder spacer to keep track aligned */}
        <div className="w-10 -mr-2" aria-hidden="true" />
      </header>

      {/* ── Scrollable content ── */}
      <main
        className="flex-1 overflow-y-auto px-4 pt-4 space-y-4"
        style={{ paddingBottom: "calc(150px + env(safe-area-inset-bottom))" }}
      >
        {/* Title & subtitle */}
        <div>
          <h1
            className="text-2xl font-bold mb-1 leading-tight"
            style={{ color: "var(--sf-text)" }}
          >
            Your personalized first week is ready
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: "var(--sf-text-2)" }}>
            Engineered around your {plan.trainingDays.length}-day schedule and body composition.
          </p>
        </div>

        {/* ── Section: Personalized Target Summary Banner ── */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/8">
          <div className="flex flex-col items-center justify-center py-2 px-1 text-center">
            <span className="text-base sm:text-lg font-black text-white leading-none">
              {plan.dailyCalories}
            </span>
            <span className="text-[10px] text-white/50 mt-1 uppercase font-semibold">
              Daily kcal
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-2 px-1 text-center border-x border-white/8">
            <span className="text-base sm:text-lg font-black text-[#00FF9C] leading-none">
              {plan.macros.protein}g
            </span>
            <span className="text-[10px] text-white/50 mt-1 uppercase font-semibold">
              Protein
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-2 px-1 text-center">
            <span className="text-base sm:text-lg font-black text-white leading-none">
              {plan.trainingDays.length} Days
            </span>
            <span className="text-[10px] text-white/50 mt-1 uppercase font-semibold">
              Per Week
            </span>
          </div>
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
            {plan.weekPlan.map((item) => {
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
                    "flex flex-col justify-between p-3 rounded-2xl border text-left shrink-0 w-[104px] h-[92px]",
                    "transition-colors duration-150 cursor-pointer",
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
                      className="text-xs font-bold"
                      style={{
                        color: isSelected ? "var(--sf-primary)" : "var(--sf-text-2)",
                      }}
                    >
                      {item.dayShort}
                    </span>
                    {isWorkout ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#00FF9C]/15">
                        <Dumbbell className="w-3 h-3 text-[#00FF9C]" aria-hidden="true" />
                      </span>
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
          className="rounded-2xl border p-4 space-y-3"
          style={{
            backgroundColor: "var(--sf-surface)",
            borderColor: "var(--sf-border)",
          }}
        >
          <div className="flex items-start gap-3.5">
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
              <p
                className="text-xs leading-relaxed mt-1"
                style={{ color: "var(--sf-text-2)" }}
              >
                {activeDay.focus}
              </p>
            </div>
          </div>

          {/* If workout day, show exercise breakdown */}
          {activeDay.type === "workout" && activeDay.exercises?.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
                Key Movements
              </p>
              {activeDay.exercises.map((ex, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-black/20 text-xs"
                >
                  <span className="font-medium text-white">{ex.name}</span>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                    <span>{ex.sets}</span>
                    <span className="text-[#00FF9C] font-medium">{ex.rpe}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border bg-[#00FF9C]/10 border-[#00FF9C]/25"
          >
            <Zap className="w-6 h-6 text-[#00FF9C]" />
          </div>

          <div className="flex-1 min-w-0">
            <span
              className="block text-[11px] font-semibold uppercase tracking-wider mb-0.5"
              style={{ color: "var(--sf-primary)" }}
            >
              Adaptive Progression
            </span>
            <p
              className="text-sm font-semibold leading-snug"
              style={{ color: "var(--sf-text)" }}
            >
              Weights calibrate after every set
            </p>
            <p
              className="text-xs mt-0.5 leading-relaxed text-neutral-400"
            >
              Your initial reps calibrate your baseline so you progress safely each week.
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
          className="w-full h-[52px] rounded-xl text-sm font-bold mb-1.5 flex items-center justify-center gap-2 cursor-pointer shadow-md"
          style={{
            backgroundColor: "var(--sf-primary)",
            color: "var(--sf-on-primary)",
          }}
        >
          <span>Save My Plan &amp; Create Account</span>
        </button>

        {/* Continue without an account */}
        <button
          type="button"
          onClick={handleContinueWithoutAccount}
          className="w-full h-10 flex items-center justify-center text-xs font-semibold cursor-pointer hover:underline"
          style={{ color: "var(--sf-text-2)" }}
        >
          Preview Plan as Guest &rarr;
        </button>
      </footer>
    </div>
  );
}

