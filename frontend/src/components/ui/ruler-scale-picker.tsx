import { useRef, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

interface RulerScalePickerProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  majorInterval?: number;
  units?: "metric" | "imperial";
  onUnitsChange?: (u: "metric" | "imperial") => void;
  showTip?: boolean;
  userHeightCm?: number;
  className?: string;
}

export function RulerScalePicker({
  value,
  onChange,
  min = 14,
  max = 90,
  step = 1,
  unit = "yrs",
  majorInterval = 5,
  units,
  onUnitsChange,
  showTip = false,
  userHeightCm = 172,
  className,
}: RulerScalePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingByCode = useRef(false);
  const scrollTimeout = useRef<number | null>(null);

  // Width of each tick mark in pixels
  const TICK_WIDTH = 11;
  const totalSteps = useMemo(() => Math.round((max - min) / step), [min, max, step]);

  const isMounted = useRef(false);
  const lastInternalValue = useRef(value);

  // Pointer drag tracking
  const isPointerDown = useRef(false);
  const pointerStartX = useRef(0);
  const pointerStartScroll = useRef(0);

  // Scroll to target value
  const scrollToValue = useCallback(
    (targetVal: number, smooth = false) => {
      const container = containerRef.current;
      if (!container) return;

      const clamped = Math.max(min, Math.min(max, targetVal));
      const tickIndex = (clamped - min) / step;
      const targetScroll = tickIndex * TICK_WIDTH;

      isScrollingByCode.current = true;
      container.scrollTo({
        left: targetScroll,
        behavior: smooth ? "smooth" : "auto",
      });

      if (scrollTimeout.current) window.clearTimeout(scrollTimeout.current);
      scrollTimeout.current = window.setTimeout(() => {
        isScrollingByCode.current = false;
      }, 150);
    },
    [min, max, step, TICK_WIDTH]
  );

  // Mount initialization: wait for layout
  useEffect(() => {
    const timer = setTimeout(() => {
      lastInternalValue.current = value;
      scrollToValue(value, false);
      isMounted.current = true;
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  // Sync external value updates (e.g. unit toggle LB/KG or prop changes)
  useEffect(() => {
    if (isMounted.current && value !== lastInternalValue.current) {
      lastInternalValue.current = value;
      scrollToValue(value, false);
    }
  }, [value, scrollToValue]);

  // When min/max changes (e.g. switching between LB and KG)
  useEffect(() => {
    if (isMounted.current) {
      scrollToValue(value, false);
    }
  }, [min, max]);

  // Handle user drag/scroll
  const handleScroll = () => {
    if (!isMounted.current || isScrollingByCode.current) return;
    const container = containerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const rawIndex = scrollLeft / TICK_WIDTH;
    const calculatedVal = Math.round(rawIndex) * step + min;
    const clamped = Math.max(min, Math.min(max, calculatedVal));

    if (clamped !== value) {
      lastInternalValue.current = clamped;
      onChange(clamped);
    }
  };

  // Direct pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDown.current = true;
    pointerStartX.current = e.clientX;
    if (containerRef.current) {
      pointerStartScroll.current = containerRef.current.scrollLeft;
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown.current || !containerRef.current) return;
    const deltaX = pointerStartX.current - e.clientX;
    containerRef.current.scrollLeft = pointerStartScroll.current + deltaX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isPointerDown.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Age group derivation
  const ageGroup = useMemo(() => {
    if (value < 18) {
      return {
        label: "Youth",
        badge: "Building Phase",
        pct: 12,
        desc: "Optimal phase for neural adaptation, sports fundamentals, and mobility habits.",
      };
    }
    if (value <= 35) {
      return {
        label: "Prime",
        badge: "Peak Performance",
        pct: 45,
        desc: "Prime training window: Optimal muscle protein synthesis, bone density, and recovery.",
      };
    }
    if (value <= 50) {
      return {
        label: "Mature",
        badge: "Strength & Power",
        pct: 75,
        desc: "Great response to progressive resistance, joint stability, and metabolic conditioning.",
      };
    }
    return {
      label: "Master",
      badge: "Longevity & Vitality",
      pct: 92,
      desc: "Resistance training preserves functional power, hormonal balance, and vitality.",
    };
  }, [value]);

  // BMI derivation for weight
  const bmiData = useMemo(() => {
    const weightKg = units === "imperial" ? value / 2.205 : value;
    const heightM = (userHeightCm || 172) / 100;
    const rawBmi = weightKg / (heightM * heightM);
    const bmi = Math.round(rawBmi * 10) / 10;

    let category = "Normal";
    let pct = 50;
    let desc = "Being within the normal range of BMI, continue to maintain it through fitness!";

    if (bmi < 18.5) {
      category = "Underweight";
      pct = Math.max(10, ((bmi - 15) / (18.5 - 15)) * 25);
      desc = "Below standard BMI range. Focus on nutrient-dense nutrition and hypertrophy workouts.";
    } else if (bmi <= 24.9) {
      category = "Normal";
      pct = 25 + ((bmi - 18.5) / (24.9 - 18.5)) * 40;
      desc = "Being within the normal range of BMI, continue to maintain it through fitness!";
    } else if (bmi <= 29.9) {
      category = "Overweight";
      pct = 65 + ((bmi - 25) / (29.9 - 25)) * 25;
      desc = "Slightly above standard range. Cardiovascular and progressive resistance will lean out body composition.";
    } else {
      category = "High";
      pct = Math.min(95, 90 + ((bmi - 30) / 10) * 10);
      desc = "Structured calorie control and regular daily movement will yield significant health improvements.";
    }

    return { bmi, category, pct, desc };
  }, [value, units, userHeightCm]);

  return (
    <div className={cn("w-full flex flex-col items-center select-none", className)}>
      {/* ── Optional Unit toggle (LB / KG) ── */}
      {onUnitsChange && units && (
        <div
          className="flex rounded-full p-1 mb-6"
          style={{ backgroundColor: "var(--sf-tint)" }}
          role="group"
          aria-label="Weight unit"
        >
          <button
            type="button"
            onClick={() => onUnitsChange("imperial")}
            aria-pressed={units === "imperial"}
            className={cn(
              "px-6 py-1.5 rounded-full text-xs font-bold transition-all",
              units === "imperial"
                ? "shadow-sm"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            )}
            style={{
              backgroundColor: units === "imperial" ? "var(--sf-primary)" : "transparent",
              color: units === "imperial" ? "var(--sf-on-primary)" : "var(--sf-text-2)",
            }}
          >
            LB
          </button>
          <button
            type="button"
            onClick={() => onUnitsChange("metric")}
            aria-pressed={units === "metric"}
            className={cn(
              "px-6 py-1.5 rounded-full text-xs font-bold transition-all",
              units === "metric"
                ? "shadow-sm"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            )}
            style={{
              backgroundColor: units === "metric" ? "var(--sf-primary)" : "transparent",
              color: units === "metric" ? "var(--sf-on-primary)" : "var(--sf-text-2)",
            }}
          >
            KG
          </button>
        </div>
      )}

      {/* ── Large Centered Readout Display ── */}
      <div className="flex items-baseline justify-center gap-1.5 my-2">
        <span
          className="text-6xl sm:text-7xl font-black tracking-tight leading-none"
          style={{ color: "var(--sf-text)" }}
        >
          {value}
        </span>
        <span
          className="text-2xl font-bold ml-1"
          style={{ color: "var(--sf-text-2)" }}
        >
          {unit}
        </span>
      </div>

      {/* ── Clean Floating Horizontal Ruler (No container box) ── */}
      <div className="relative w-full h-24 my-3 overflow-hidden flex flex-col justify-end">
        {/* Brand Green Center Indicator Needle */}
        <div
          className="absolute left-1/2 top-0 bottom-6 -translate-x-1/2 w-[3px] rounded-full z-20 pointer-events-none"
          style={{
            backgroundColor: "var(--sf-primary)",
            boxShadow: "0 0 8px rgba(76, 195, 138, 0.45)",
          }}
        />

        {/* Faded Left and Right Edges */}
        <div
          className="absolute inset-y-0 left-0 w-16 pointer-events-none z-10"
          style={{
            background: "linear-gradient(to right, var(--sf-bg), transparent)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-16 pointer-events-none z-10"
          style={{
            background: "linear-gradient(to left, var(--sf-bg), transparent)",
          }}
        />

        {/* Scrollable Ruler Track */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full overflow-x-auto no-scrollbar flex items-end cursor-grab active:cursor-grabbing select-none"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollBehavior: "auto",
          }}
        >
          {/* Left spacing to center minimum value */}
          <div className="shrink-0 w-[calc(50%-1px)]" />

          {/* Ticks & Numbers */}
          <div className="flex items-end shrink-0" style={{ height: "100%" }}>
            {Array.from({ length: totalSteps + 1 }, (_, i) => {
              const currentTickVal = min + i * step;
              const isMajor = currentTickVal % majorInterval === 0;
              const isMedium = !isMajor && currentTickVal % Math.ceil(majorInterval / 2) === 0;

              return (
                <div
                  key={i}
                  className="flex flex-col items-center justify-end shrink-0"
                  style={{ width: `${TICK_WIDTH}px`, height: "100%" }}
                >
                  {/* Vertical Tick Mark */}
                  <div
                    className={cn(
                      "w-[1.5px] rounded-full mb-2",
                      isMajor ? "h-8" : isMedium ? "h-5" : "h-3"
                    )}
                    style={{
                      backgroundColor: isMajor
                        ? "var(--sf-text)"
                        : "var(--sf-border)",
                    }}
                  />

                  {/* Number label on major ticks */}
                  {isMajor ? (
                    <span
                      className="text-xs font-semibold pb-1 select-none"
                      style={{ color: "var(--sf-text-2)" }}
                    >
                      {currentTickVal}
                    </span>
                  ) : (
                    <span className="h-4 pb-1" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right spacing to center maximum value */}
          <div className="shrink-0 w-[calc(50%-1px)]" />
        </div>
      </div>

      {/* ── Category / Insight Card (Exact layout as reference image) ── */}
      {unit === "yrs" ? (
        /* Age Category Card */
        <div
          className="mt-4 w-full p-4 sm:p-5 rounded-2xl border text-left"
          style={{
            backgroundColor: "var(--sf-surface)",
            borderColor: "var(--sf-border)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-bold" style={{ color: "var(--sf-text)" }}>
              Age Category
            </span>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-md"
              style={{
                backgroundColor: "var(--sf-primary)",
                color: "var(--sf-on-primary)",
              }}
            >
              {ageGroup.badge}
            </span>
          </div>

          {/* Floating Indicator & Track */}
          <div className="relative w-full pt-6 pb-2">
            <div
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-150"
              style={{ left: `${Math.max(10, Math.min(90, ageGroup.pct))}%` }}
            >
              <span
                className="px-2.5 py-0.5 rounded-md text-xs font-black shadow-sm"
                style={{
                  backgroundColor: "var(--sf-primary)",
                  color: "var(--sf-on-primary)",
                }}
              >
                {value} yrs
              </span>
              <div
                className="w-0 h-0 border-x-[4px] border-x-transparent border-t-[5px]"
                style={{ borderTopColor: "var(--sf-primary)" }}
              />
            </div>

            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{
                background:
                  "linear-gradient(90deg, #38BDF8 0%, #34D399 35%, #FBBF24 70%, #A855F7 100%)",
              }}
            />
          </div>

          <div
            className="flex justify-between text-[11px] font-semibold mt-1"
            style={{ color: "var(--sf-text-2)" }}
          >
            <span>Youth</span>
            <span style={{ color: value >= 18 && value <= 35 ? "var(--sf-primary)" : "inherit" }}>
              Normal
            </span>
            <span>Overweight</span>
          </div>

          <p className="text-xs sm:text-sm font-medium leading-relaxed mt-4" style={{ color: "var(--sf-text-2)" }}>
            {ageGroup.desc}
          </p>
        </div>
      ) : (
        /* Weight BMI Card (Exact match to reference image media_1794107032666_718f81e1.jpg) */
        <div
          className="mt-4 w-full p-4 sm:p-5 rounded-2xl border text-left"
          style={{
            backgroundColor: "var(--sf-surface)",
            borderColor: "var(--sf-border)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-bold" style={{ color: "var(--sf-text)" }}>
              Current BMI
            </span>
          </div>

          {/* Floating Tooltip Badge with Arrow pointing to Gauge */}
          <div className="relative w-full pt-6 pb-2">
            <div
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-150"
              style={{ left: `${Math.max(10, Math.min(90, bmiData.pct))}%` }}
            >
              <span
                className="px-2.5 py-0.5 rounded-md text-xs font-black shadow-sm"
                style={{
                  backgroundColor: "var(--sf-primary)",
                  color: "var(--sf-on-primary)",
                }}
              >
                {bmiData.bmi}
              </span>
              <div
                className="w-0 h-0 border-x-[4px] border-x-transparent border-t-[5px]"
                style={{ borderTopColor: "var(--sf-primary)" }}
              />
            </div>

            {/* Rainbow Gauge Bar */}
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{
                background:
                  "linear-gradient(90deg, #38BDF8 0%, #34D399 35%, #FBBF24 70%, #F87171 100%)",
              }}
            />
          </div>

          {/* Category Labels */}
          <div
            className="flex justify-between text-[11px] font-semibold mt-1"
            style={{ color: "var(--sf-text-2)" }}
          >
            <span>Underweight</span>
            <span style={{ color: bmiData.category === "Normal" ? "var(--sf-primary)" : "inherit" }}>
              Normal
            </span>
            <span>Overweight</span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm font-medium leading-relaxed mt-4" style={{ color: "var(--sf-text-2)" }}>
            {bmiData.desc}
          </p>
        </div>
      )}
    </div>
  );
}
