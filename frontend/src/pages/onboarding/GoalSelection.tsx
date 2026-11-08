import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Dumbbell, Flame, Zap, Activity, CalendarCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getOnboardingDraft, updateOnboardingDraft } from "@/lib/onboarding";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Goal {
  id: string;
  Icon: React.ElementType;
  title: string;
  description: string;
}

/* ─── Data (presentational only) ────────────────────────────────────────── */
const GOALS: Goal[] = [
  {
    id: "strength",
    Icon: Dumbbell,
    title: "Build strength",
    description: "Increase raw power and lift heavier with progressive overload",
  },
  {
    id: "fat_loss",
    Icon: Flame,
    title: "Lose fat",
    description: "Burn calories and reduce body fat through targeted deficit training",
  },
  {
    id: "tone",
    Icon: Zap,
    title: "Tone and stay fit",
    description: "Maintain athletic definition, mobility, and everyday energy",
  },
  {
    id: "stamina",
    Icon: Activity,
    title: "Improve stamina",
    description: "Build cardiovascular endurance and workout work capacity",
  },
  {
    id: "habit",
    Icon: CalendarCheck,
    title: "Build a habit",
    description: "Create consistent routine with manageable 20–30 min gym sessions",
  },
];

const MAX_SELECT = 2;
const TOTAL_STEPS = 5;
const CURRENT_STEP = 2;

/* ─── GoalCard ───────────────────────────────────────────────────────────── */
interface GoalCardProps {
  goal: Goal;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: (id: string) => void;
  reducedMotion: boolean;
}

function GoalCard({ goal, isSelected, isDisabled, onToggle, reducedMotion }: GoalCardProps) {
  const { Icon } = goal;

  return (
    <button
      type="button"
      onClick={() => !isDisabled && onToggle(goal.id)}
      disabled={isDisabled}
      aria-pressed={isSelected}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-4 rounded-2xl border text-left",
        "transition-colors duration-200",
        isDisabled && "opacity-40 cursor-not-allowed",
        !isDisabled && "cursor-pointer active:scale-[0.985]",
        !reducedMotion && "transition-transform"
      )}
      style={{
        backgroundColor: isSelected ? "var(--sf-tint)" : "var(--sf-surface)",
        borderColor: isSelected ? "var(--sf-primary)" : "var(--sf-border)",
      }}
    >
      {/* Icon container — 48×48 tap target */}
      <span
        className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
        style={{
          backgroundColor: "var(--sf-tint)",
          color: "var(--sf-primary)",
        }}
      >
        <Icon className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
      </span>

      {/* Label block */}
      <span className="flex-1 min-w-0">
        <span
          className="block text-sm font-semibold leading-snug"
          style={{ color: "var(--sf-text)" }}
        >
          {goal.title}
        </span>
        <span
          className="block text-xs mt-0.5 leading-relaxed"
          style={{ color: "var(--sf-text-2)" }}
        >
          {goal.description}
        </span>
      </span>

      {/* Checkbox — 24×24 visual, outer touch target is the whole card row */}
      <span
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full shrink-0 border-2",
          "transition-colors duration-200"
        )}
        style={{
          backgroundColor: isSelected ? "var(--sf-primary)" : "transparent",
          borderColor: isSelected ? "var(--sf-primary)" : "var(--sf-border)",
        }}
        aria-hidden="true"
      >
        {isSelected && (
          <Check className="w-3.5 h-3.5" strokeWidth={2.5} style={{ color: "var(--sf-on-primary)" }} />
        )}
      </span>
    </button>
  );
}

/* ─── GoalSelection page ─────────────────────────────────────────────────── */
export default function GoalSelection() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [selected, setSelected] = useState<string[]>(() => getOnboardingDraft().goals);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((g) => g !== id)
        : prev.length >= MAX_SELECT
        ? prev
        : [...prev, id];
      updateOnboardingDraft({ goals: updated });
      return updated;
    });
  };

  const handleContinue = () => {
    updateOnboardingDraft({ goals: selected });
    navigate("/onboarding/body-metrics");
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
          onClick={() => navigate("/onboarding/basics")}
          aria-label="Go back"
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full active:scale-95 transition-transform"
          style={{ color: "var(--sf-text)" }}
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="text-sm font-medium px-2 py-1 rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
          style={{ color: "var(--sf-primary)" }}
        >
          Skip
        </button>
      </header>

      {/* ── Scrollable content ── */}
      <main
        className="flex-1 overflow-y-auto px-4 pt-4"
        /* Bottom padding = fixed bar height (≈112px) + 16px breathing room */
        style={{ paddingBottom: "calc(128px + env(safe-area-inset-bottom))" }}
      >
        {/* Step counter */}
        <p className="text-sm mb-2" style={{ color: "var(--sf-text-2)" }}>
          Step {CURRENT_STEP} of {TOTAL_STEPS}
        </p>

        {/* Heading */}
        <h1
          className="text-2xl font-semibold mb-1 leading-tight"
          style={{ color: "var(--sf-text)" }}
        >
          What's your main goal?
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--sf-text-2)" }}>
          Pick up to {MAX_SELECT}. You can change this anytime.
        </p>

        {/* Goal cards */}
        <div className="flex flex-col gap-3">
          {GOALS.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              isSelected={selected.includes(goal.id)}
              isDisabled={!selected.includes(goal.id) && selected.length >= MAX_SELECT}
              onToggle={toggle}
              reducedMotion={reducedMotion}
            />
          ))}
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
        {/* Selection count */}
        {selected.length > 0 && (
          <p
            className="text-sm text-center mb-3 font-medium"
            style={{ color: "var(--sf-text-2)" }}
          >
            {selected.length} of {MAX_SELECT} selected
          </p>
        )}

        {/* Continue button — 52px tall, 12px radius per design system */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={selected.length === 0}
          className={cn(
            "w-full h-[52px] rounded-xl text-sm font-semibold",
            "transition-opacity duration-200",
            selected.length === 0 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
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
