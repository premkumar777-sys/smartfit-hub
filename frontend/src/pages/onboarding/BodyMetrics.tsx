import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Cake,
  Ruler,
  Scale,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getOnboardingDraft, updateOnboardingDraft } from "@/lib/onboarding";
import { RulerScalePicker } from "@/components/ui/ruler-scale-picker";
import { VerticalHeightPicker } from "@/components/ui/vertical-height-picker";
import { OnboardingProgressBar } from "@/components/onboarding/OnboardingProgressBar";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type UnitSystem = "metric" | "imperial";
type FieldKey = "age" | "height" | "weight";
type ViewMode = "overview" | "age" | "height" | "weight";

export default function BodyMetrics() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active view: "overview" (all 3 in one screen) or individual picker
  const initialStep = (searchParams.get("step") as ViewMode) || "overview";
  const [view, setView] = useState<ViewMode>(initialStep);

  // Draft metrics state
  const draft = getOnboardingDraft().metrics;
  const [units, setUnits] = useState<UnitSystem>(draft.units || "metric");
  const [age, setAge] = useState<number | null>(draft.age ?? 28);
  const [height, setHeight] = useState<number | null>(draft.height ?? 172);
  const [weight, setWeight] = useState<number | null>(() => {
    const rawKg = draft.weight ?? 74;
    return units === "imperial" ? Math.round(rawKg * 2.205) : rawKg;
  });

  // Formatters for the overview card
  const fmtAge = (v: number | null) => (v !== null ? `${v} yrs` : "Not set");
  const fmtHeight = (v: number | null) => {
    if (v === null) return "Not set";
    if (units === "metric") return `${v} cm`;
    const totalIn = Math.round(v / 2.54);
    const ft = Math.floor(totalIn / 12);
    const inches = totalIn % 12;
    return `${ft}′ ${inches}″`;
  };
  const fmtWeight = (v: number | null) => {
    if (v === null) return "Not set";
    return units === "metric" ? `${v} kg` : `${v} lb`;
  };

  // Persist draft helper
  const persistDraft = (overrides?: {
    age?: number | null;
    height?: number | null;
    weight?: number | null;
    units?: UnitSystem;
  }) => {
    const activeUnits = overrides?.units ?? units;
    const currentWeight = overrides?.weight !== undefined ? overrides.weight : weight;
    const finalWeightKg =
      currentWeight === null
        ? null
        : activeUnits === "imperial"
        ? Math.round((currentWeight / 2.205) * 10) / 10
        : currentWeight;

    updateOnboardingDraft({
      metrics: {
        age: overrides?.age !== undefined ? overrides.age : age,
        height: overrides?.height !== undefined ? overrides.height : height,
        weight: finalWeightKg,
        units: activeUnits,
      },
    });
  };

  // Switch units between metric and imperial
  const handleUnitSystemToggle = (newUnits: UnitSystem) => {
    if (newUnits !== units) {
      setUnits(newUnits);
      if (weight !== null) {
        if (newUnits === "imperial") {
          setWeight(Math.round(weight * 2.205));
        } else {
          setWeight(Math.round(weight / 2.205));
        }
      }
      persistDraft({ units: newUnits });
    }
  };

  // Navigation handlers
  const handleOpenPicker = (k: FieldKey) => {
    setView(k);
    setSearchParams({ step: k });
  };

  const handleClosePicker = () => {
    persistDraft();
    setView("overview");
    setSearchParams({});
  };

  const handleContinueOverview = () => {
    persistDraft();
    navigate("/onboarding/training-days");
  };

  // Overview rows definition
  const overviewRows = [
    { key: "age" as FieldKey, Icon: Cake, label: "Age", display: fmtAge(age) },
    { key: "height" as FieldKey, Icon: Ruler, label: "Height", display: fmtHeight(height) },
    { key: "weight" as FieldKey, Icon: Scale, label: "Weight", display: fmtWeight(weight) },
  ];

  /* ══════════════════════════════════════════════════════════════════════════
     VIEW 1: OVERVIEW SCREEN (All in one screen: Age, Height, Weight)
     ══════════════════════════════════════════════════════════════════════════ */
  if (view === "overview") {
    return (
      <div
        className="min-h-dvh flex flex-col justify-between"
        style={{
          backgroundColor: "var(--sf-bg)",
          color: "var(--sf-text)",
        }}
      >
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-4 h-14 shrink-0"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            backgroundColor: "var(--sf-bg)",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/onboarding/goals")}
            aria-label="Go back"
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full active:scale-95 transition-transform"
            style={{ color: "var(--sf-text)" }}
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2.5} aria-hidden="true" />
          </button>

          {/* Top Progress Track */}
          <OnboardingProgressBar fromPercent={40} valuePercent={60} />

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="text-sm font-semibold min-h-[44px] min-w-[44px] flex items-center justify-center px-2 cursor-pointer"
            style={{ color: "var(--sf-primary)" }}
          >
            Skip
          </button>
        </header>

        {/* Main Content: Overview with Age, Height, Weight */}
        <main
          className="flex-1 overflow-y-auto px-4 pt-2 max-w-md w-full mx-auto"
          style={{ paddingBottom: "120px" }}
        >
          {/* Header text */}
          <h1
            className="text-2xl sm:text-3xl font-extrabold mb-1.5 tracking-tight"
            style={{ color: "var(--sf-text)" }}
          >
            A little about you (optional)
          </h1>
          <p className="text-xs sm:text-sm mb-5 leading-relaxed" style={{ color: "var(--sf-text-2)" }}>
            Used only to calibrate calorie targets and set realistic goals. Tap any field to adjust.
          </p>

          {/* Unit System Toggle (Metric vs Imperial) */}
          <div
            className="flex rounded-xl p-1 mb-5"
            role="group"
            aria-label="Unit system"
            style={{ backgroundColor: "var(--sf-tint)" }}
          >
            {(["metric", "imperial"] as UnitSystem[]).map((u) => {
              const active = units === u;
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleUnitSystemToggle(u)}
                  aria-pressed={active}
                  className="flex-1 h-10 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer"
                  style={{
                    backgroundColor: active ? "var(--sf-primary)" : "transparent",
                    color: active ? "var(--sf-on-primary)" : "var(--sf-text-2)",
                  }}
                >
                  {u === "metric" ? "Metric (kg, cm)" : "Imperial (lb, ft)"}
                </button>
              );
            })}
          </div>

          {/* 3 Metric Rows in One Clean Card */}
          <div
            className="rounded-2xl border overflow-hidden mb-5 shadow-sm"
            style={{
              backgroundColor: "var(--sf-surface)",
              borderColor: "var(--sf-border)",
            }}
          >
            {overviewRows.map((row, idx) => (
              <div key={row.key}>
                {idx > 0 && (
                  <div className="h-px mx-4" style={{ backgroundColor: "var(--sf-border)" }} />
                )}
                <button
                  type="button"
                  onClick={() => handleOpenPicker(row.key)}
                  className="w-full flex items-center justify-between px-4 py-4 min-h-[72px] text-left hover:bg-neutral-500/5 active:bg-neutral-500/10 transition-colors cursor-pointer"
                >
                  {/* Left icon + label */}
                  <div className="flex items-center gap-3.5">
                    <span
                      className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
                      style={{ backgroundColor: "var(--sf-tint)" }}
                    >
                      <row.Icon
                        className="w-5 h-5"
                        strokeWidth={2}
                        style={{ color: "var(--sf-primary)" }}
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <span className="block text-sm font-bold" style={{ color: "var(--sf-text)" }}>
                        {row.label}
                      </span>
                      <span className="block text-xs mt-0.5" style={{ color: "var(--sf-text-2)" }}>
                        Tap to adjust
                      </span>
                    </div>
                  </div>

                  {/* Right: formatted value + arrow */}
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold" style={{ color: "var(--sf-text)" }}>
                      {row.display}
                    </span>
                    <ChevronRight className="w-5 h-5" style={{ color: "var(--sf-text-2)" }} />
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Privacy Note */}
          <div
            className="flex items-start gap-3 p-4 rounded-2xl border"
            role="note"
            style={{
              backgroundColor: "var(--sf-surface)",
              borderColor: "var(--sf-border)",
            }}
          >
            <Lock
              className="w-5 h-5 mt-0.5 shrink-0"
              strokeWidth={2}
              style={{ color: "var(--sf-primary)" }}
              aria-hidden="true"
            />
            <div>
              <p className="text-xs sm:text-sm font-bold mb-0.5" style={{ color: "var(--sf-text)" }}>
                Your data stays private
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--sf-text-2)" }}>
                SmartFit never sells your metrics to advertisers. You can edit this anytime in Settings.
              </p>
            </div>
          </div>
        </main>

        {/* Fixed Continue Button */}
        <footer
          className="fixed bottom-0 inset-x-0 w-full max-w-md mx-auto px-4 pb-4 pt-3"
          style={{
            backgroundColor: "var(--sf-bg)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 14px)",
            zIndex: "var(--z-bars)",
          }}
        >
          <button
            type="button"
            onClick={handleContinueOverview}
            className="w-full h-[52px] rounded-2xl text-base font-bold shadow-sm active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center"
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

  /* ══════════════════════════════════════════════════════════════════════════
     VIEW 2: INDIVIDUAL PICKER SCREENS (Opened by tapping a row)
     ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div
      className="min-h-dvh flex flex-col justify-between"
      style={{
        backgroundColor: "var(--sf-bg)",
        color: "var(--sf-text)",
      }}
    >
      {/* Top Header */}
      <header
        className="flex items-center justify-between px-4 h-14 shrink-0"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          backgroundColor: "var(--sf-bg)",
        }}
      >
        <button
          type="button"
          onClick={handleClosePicker}
          aria-label="Back to overview"
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full active:scale-95 transition-transform"
          style={{ color: "var(--sf-text)" }}
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} aria-hidden="true" />
        </button>

        <p className="text-xs font-semibold" style={{ color: "var(--sf-text-2)" }}>
          {view === "age" ? "Age" : view === "height" ? "Height" : "Weight"}
        </p>

        <button
          type="button"
          onClick={handleClosePicker}
          className="text-sm font-semibold min-h-[44px] min-w-[44px] flex items-center justify-center px-2 cursor-pointer"
          style={{ color: "var(--sf-primary)" }}
        >
          Done
        </button>
      </header>

      {/* Main Picker Content */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-2 pb-6 w-full max-w-md mx-auto">
        {/* AGE PICKER */}
        {view === "age" && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-6"
              style={{ color: "var(--sf-text)" }}
            >
              Your age
            </h1>
            <RulerScalePicker
              value={age ?? 28}
              onChange={(newAge) => setAge(newAge)}
              min={14}
              max={85}
              step={1}
              majorInterval={5}
              unit="yrs"
            />
          </div>
        )}

        {/* HEIGHT PICKER */}
        {view === "height" && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-1"
              style={{ color: "var(--sf-text)" }}
            >
              Your height
            </h1>
            <p
              className="text-xs sm:text-sm text-center mb-4 leading-relaxed max-w-xs"
              style={{ color: "var(--sf-text-2)" }}
            >
              Height information helps us calculate your BMI more accurately
            </p>
            <VerticalHeightPicker
              value={height ?? 172}
              onChange={(newHeight) => setHeight(newHeight)}
              units={units}
              onUnitsChange={(newU) => handleUnitSystemToggle(newU)}
              min={120}
              max={220}
            />
          </div>
        )}

        {/* WEIGHT PICKER */}
        {view === "weight" && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-4"
              style={{ color: "var(--sf-text)" }}
            >
              Your current weight
            </h1>
            <RulerScalePicker
              value={weight ?? 74}
              onChange={(newWeight) => setWeight(newWeight)}
              min={units === "metric" ? 35 : 80}
              max={units === "metric" ? 180 : 400}
              step={1}
              majorInterval={units === "metric" ? 10 : 20}
              unit={units === "metric" ? "kg" : "lb"}
              units={units}
              onUnitsChange={(newU) => handleUnitSystemToggle(newU)}
              userHeightCm={height ?? 172}
              showTip={true}
            />
          </div>
        )}
      </main>

      {/* Save Button to Return to Overview */}
      <footer
        className="w-full max-w-md mx-auto px-4 pb-4 pt-2"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + 14px)",
        }}
      >
        <button
          type="button"
          onClick={handleClosePicker}
          className="w-full h-[52px] rounded-2xl text-base font-bold shadow-sm active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center"
          style={{
            backgroundColor: "var(--sf-primary)",
            color: "var(--sf-on-primary)",
          }}
        >
          Save & Return
        </button>
      </footer>
    </div>
  );
}
