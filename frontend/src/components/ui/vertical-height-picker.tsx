import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface VerticalHeightPickerProps {
  value: number; // in cm
  onChange: (cmValue: number) => void;
  units?: "metric" | "imperial";
  onUnitsChange?: (u: "metric" | "imperial") => void;
  min?: number; // in cm
  max?: number; // in cm
  step?: number;
  className?: string;
}

export function VerticalHeightPicker({
  value,
  onChange,
  units = "metric",
  onUnitsChange,
  min = 120,
  max = 220,
  step = 1,
  className,
}: VerticalHeightPickerProps) {
  const rulerContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingByCode = useRef(false);
  const scrollTimeout = useRef<number | null>(null);

  // Live float value for butter-smooth dragging
  const [liveValue, setLiveValue] = useState<number>(value);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartVal = useRef(value);

  // Sync external value changes when not actively dragging
  useEffect(() => {
    if (!isDragging) {
      setLiveValue(value);
    }
  }, [value, isDragging]);

  // Stage geometry
  const STAGE_HEIGHT = 490;
  const FLOOR_Y = 472;
  const MIN_ATHLETE_H = 220;
  const MAX_ATHLETE_H = 430;
  const TICK_HEIGHT = 7.5;
  const PADDING_TOP = 270;

  // Calculate live athlete height and head Y position
  const { athleteHeight, headY } = useMemo(() => {
    const clamped = Math.max(min, Math.min(max, liveValue));
    const ratio = (clamped - min) / (max - min); // 0 to 1
    const h = MIN_ATHLETE_H + ratio * (MAX_ATHLETE_H - MIN_ATHLETE_H);
    const y = FLOOR_Y - h;
    return { athleteHeight: h, headY: y };
  }, [liveValue, min, max, FLOOR_Y, MIN_ATHLETE_H, MAX_ATHLETE_H]);

  const totalTicks = useMemo(() => Math.round((max - min) / step), [min, max, step]);

  // Format Imperial / Metric display
  const formatDisplay = (cmVal: number) => {
    const rounded = Math.round(cmVal);
    if (units === "metric") {
      return { number: String(rounded), unit: "cm" };
    }
    const totalInches = Math.round(rounded / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return { number: `${feet}′ ${inches}″`, unit: "" };
  };

  const { number: displayValue, unit: displayUnit } = formatDisplay(liveValue);

  // Scroll ruler so tick `v` matches `headY`
  const syncRulerToValue = useCallback(
    (targetCm: number, targetHeadY: number, smooth = false) => {
      const container = rulerContainerRef.current;
      if (!container) return;

      const clamped = Math.max(min, Math.min(max, targetCm));
      const tickOffset = (max - clamped) * TICK_HEIGHT;
      const targetScroll = tickOffset - targetHeadY + PADDING_TOP;

      isScrollingByCode.current = true;
      container.scrollTo({
        top: targetScroll,
        behavior: smooth ? "smooth" : "auto",
      });

      if (scrollTimeout.current) window.clearTimeout(scrollTimeout.current);
      scrollTimeout.current = window.setTimeout(() => {
        isScrollingByCode.current = false;
      }, 100);
    },
    [min, max, TICK_HEIGHT, PADDING_TOP]
  );

  // Sync ruler on mount or value change
  useEffect(() => {
    syncRulerToValue(liveValue, headY, !isDragging);
  }, [liveValue, headY, isDragging, syncRulerToValue]);

  // Direct touch/pointer drag on stage
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartVal.current = liveValue;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = dragStartY.current - e.clientY; // drag UP = taller
    // Sensitivity: ~2.5 pixels of finger movement per cm
    const deltaCm = deltaY / 2.5;
    const nextVal = Math.max(min, Math.min(max, dragStartVal.current + deltaCm));

    setLiveValue(nextVal);
    const rounded = Math.round(nextVal);
    if (rounded !== value) {
      onChange(rounded);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    const finalVal = Math.round(liveValue);
    setLiveValue(finalVal);
    onChange(finalVal);
  };

  // Ruler manual scroll handler
  const handleRulerScroll = () => {
    if (isScrollingByCode.current || isDragging) return;
    const container = rulerContainerRef.current;
    if (!container) return;

    // Approximate cm from scroll position
    const scrollTop = container.scrollTop;
    const rawVal = max - (scrollTop + headY - PADDING_TOP) / TICK_HEIGHT;
    const clamped = Math.max(min, Math.min(max, Math.round(rawVal)));

    if (clamped !== value) {
      setLiveValue(clamped);
      onChange(clamped);
    }
  };

  return (
    <div className={cn("w-full flex flex-col items-center select-none", className)}>
      {/* ── Unit toggle (FT / CM) ── */}
      {onUnitsChange && (
        <div
          className="flex rounded-full p-1 mb-4"
          style={{ backgroundColor: "var(--sf-tint)" }}
          role="group"
          aria-label="Height unit"
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
            FT
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
            CM
          </button>
        </div>
      )}

      {/* ── Main Stage (Touch anywhere to drag smoothly) ── */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full rounded-2xl border overflow-hidden flex items-start justify-between cursor-ns-resize touch-none"
        style={{
          height: `${STAGE_HEIGHT}px`,
          backgroundColor: "var(--sf-surface)",
          borderColor: "var(--sf-border)",
        }}
      >
        {/* Yellow Horizontal Indicator Line (Moves smoothly with headY) */}
        <div
          className="absolute inset-x-0 z-20 pointer-events-none"
          style={{
            top: `${headY}px`,
            transition: isDragging ? "none" : "top 0.15s cubic-bezier(0.2, 0, 0, 1)",
            willChange: "top",
          }}
        >
          {/* Readout sitting directly ABOVE the yellow line */}
          <div className="absolute left-6 bottom-[3px] flex items-baseline gap-1 pointer-events-none select-none">
            <span
              className="text-5xl font-black tracking-tight leading-none"
              style={{ color: "var(--sf-text)" }}
            >
              {displayValue}
            </span>
            {displayUnit && (
              <span
                className="text-lg font-bold ml-0.5"
                style={{ color: "var(--sf-text-2)" }}
              >
                {displayUnit}
              </span>
            )}
          </div>

          {/* Clean glowing green line spanning from left across to ruler */}
          <div
            className="w-full h-[2.5px] rounded-full"
            style={{
              backgroundColor: "var(--sf-primary)",
              boxShadow: "0 0 8px rgba(76, 195, 138, 0.45)",
            }}
          />
        </div>

        {/* Scaled Athlete Figure: Smoothly expands/shrinks with headY */}
        <div className="relative flex-1 h-full overflow-hidden select-none pointer-events-none">
          <div
            className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none"
            style={{
              top: `${headY + 2}px`,
              height: `${athleteHeight}px`,
              transition: isDragging ? "none" : "top 0.15s cubic-bezier(0.2, 0, 0, 1), height 0.15s cubic-bezier(0.2, 0, 0, 1)",
              willChange: "top, height",
              maskImage: "linear-gradient(to bottom, black 92%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 92%, transparent 100%)",
            }}
          >
            <img
              src="/height-athlete.png"
              alt="Height visual indicator"
              className="h-full w-auto object-top object-contain select-none pointer-events-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
              draggable={false}
            />
          </div>
        </div>

        {/* Right Side: Vertical Ruler */}
        <div className="relative w-24 h-full shrink-0 z-10 pointer-events-none">
          {/* Top & Bottom fade gradients */}
          <div
            className="absolute top-0 inset-x-0 h-12 pointer-events-none z-20"
            style={{
              background: "linear-gradient(to bottom, var(--sf-surface), transparent)",
            }}
          />
          <div
            className="absolute bottom-0 inset-x-0 h-12 pointer-events-none z-20"
            style={{
              background: "linear-gradient(to top, var(--sf-surface), transparent)",
            }}
          />

          <div
            ref={rulerContainerRef}
            onScroll={handleRulerScroll}
            className="w-full h-full overflow-y-auto no-scrollbar flex flex-col items-end pointer-events-auto"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "auto",
            }}
          >
            {/* Top spacing spacer */}
            <div className="shrink-0 w-full" style={{ height: `${PADDING_TOP}px` }} />

            {/* Ticks from max down to min */}
            <div className="flex flex-col items-end shrink-0 w-full">
              {Array.from({ length: totalTicks + 1 }, (_, i) => {
                const tickVal = max - i * step;
                const isMajor = tickVal % 10 === 0;
                const isMedium = !isMajor && tickVal % 5 === 0;
                const totalIn = Math.round(tickVal / 2.54);

                return (
                  <div
                    key={tickVal}
                    className="flex items-center justify-end shrink-0 w-full pr-1.5"
                    style={{ height: `${TICK_HEIGHT}px` }}
                  >
                    {/* Number label on major ticks */}
                    {isMajor && (
                      <span
                        className="text-[11px] font-semibold mr-2 select-none"
                        style={{ color: "var(--sf-text-2)" }}
                      >
                        {units === "metric"
                          ? tickVal
                          : `${Math.floor(totalIn / 12)}′${totalIn % 12}″`}
                      </span>
                    )}

                    {/* Horizontal tick mark */}
                    <div
                      className={cn(
                        "h-[1.5px] rounded-full shrink-0",
                        isMajor ? "w-6" : isMedium ? "w-4" : "w-2.5"
                      )}
                      style={{
                        backgroundColor: isMajor
                          ? "var(--sf-text-2)"
                          : "var(--sf-border)",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Bottom spacer so minimum tick (120 cm / 3' 11") can scroll all the way up to the indicator line */}
            <div className="shrink-0 w-full" style={{ height: "520px" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
