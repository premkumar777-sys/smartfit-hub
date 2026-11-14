import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowUp, X, Sparkles, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  preferredArrow: "up" | "down";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "step-coach",
    targetId: "tour-virtual-trainer",
    title: "AI 3D Trainer & Pose Detection",
    description: "Start interactive workouts with real-time camera posture feedback and automated rep counting.",
    preferredArrow: "up",
  },
  {
    id: "step-nutrition",
    targetId: "tour-meal-scanner",
    title: "AI Meal Scanner & Macro Tracker",
    description: "Snap food photos to automatically analyze calories, protein, and nutrients tailored to your goals.",
    preferredArrow: "down",
  },
  {
    id: "step-nav",
    targetId: "tour-bottom-nav",
    title: "Instant Bottom Navigation",
    description: "Switch anytime between your Daily Schedule, Library Workouts, Meal Plans, and Analytics.",
    preferredArrow: "down",
  },
];

export const TOUR_STORAGE_KEY = "smartfit_app_tour_completed_v1";

export function resetAppTour() {
  try {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  } catch (_) {}
}

export function AppWalkthroughTour({ forceShow = false, onComplete }: { forceShow?: boolean; onComplete?: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Check if tour should run
  useEffect(() => {
    try {
      const hasTourParam = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tour") === "true";
      const alreadyCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!alreadyCompleted || forceShow || hasTourParam) {
        // Small delay to let initial page layout settle smoothly
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, [forceShow]);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Update target bounding box and scroll smoothly into view
  const updateTargetPosition = useCallback(() => {
    if (!isVisible || !currentStep) return;

    const el = document.getElementById(currentStep.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);

      // If off-screen, gently scroll into viewport (except bottom nav which is fixed)
      if (currentStep.targetId !== "tour-bottom-nav") {
        const isOffScreen = rect.top < 80 || rect.bottom > window.innerHeight - 80;
        if (isOffScreen) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    } else {
      setTargetRect(null);
    }
  }, [isVisible, currentStep]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", updateTargetPosition, { passive: true });
    return () => {
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", updateTargetPosition);
    };
  }, [updateTargetPosition]);

  // Handle Android hardware back button to dismiss tour
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch (_) {}
    if (onComplete) onComplete();
  };

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  if (!isVisible) return null;

  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Calculate card positioning based on target element
  const getCardPositionStyle = () => {
    if (!targetRect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const margin = 16;
    const cardHeightEstimate = 190;
    const screenHeight = window.innerHeight;

    // For bottom nav, place card securely above it
    if (currentStep.targetId === "tour-bottom-nav") {
      return {
        bottom: `${Math.max(80, screenHeight - targetRect.top + margin)}px`,
        left: "50%",
        transform: "translateX(-50%)",
      };
    }

    // If target is in the lower half of screen, place card above target
    if (targetRect.top > screenHeight / 2) {
      return {
        bottom: `${Math.max(16, screenHeight - targetRect.top + margin)}px`,
        left: "50%",
        transform: "translateX(-50%)",
      };
    }

    // Otherwise place card below target
    return {
      top: `${Math.min(screenHeight - cardHeightEstimate - margin, targetRect.bottom + margin)}px`,
      left: "50%",
      transform: "translateX(-50%)",
    };
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* Dimmed backdrop - tapping dismisses smoothly */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleDismiss}
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px] transition-opacity"
      />

      {/* Pulsing Beacon Ring on the highlighted target element */}
      {targetRect && (
        <motion.div
          key={currentStep.targetId}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            pointerEvents: "none",
          }}
          className="rounded-2xl border-2 border-[#00FF9C] shadow-[0_0_25px_rgba(0,255,156,0.6)]"
        >
          {/* Animated ping wave */}
          <span className="absolute -inset-1 rounded-2xl border border-[#00FF9C]/60 animate-ping opacity-75" />
        </motion.div>
      )}

      {/* Floating Spotlight Card */}
      <div 
        style={getCardPositionStyle()} 
        className="fixed w-[92%] max-w-sm pointer-events-auto z-10"
      >
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 15, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="relative rounded-2xl bg-[#0D1117] border border-[#00FF9C]/40 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(0,255,156,0.15)] text-white"
        >
          {/* Directional Indicator Arrow */}
          <div className="flex justify-center -mt-8 mb-2">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              className="w-8 h-8 rounded-full bg-[#00FF9C] text-black flex items-center justify-center shadow-[0_0_15px_rgba(0,255,156,0.8)]"
            >
              {currentStep.targetId === "tour-bottom-nav" ? (
                <ArrowDown className="w-4 h-4 stroke-[3]" />
              ) : (
                <ArrowUp className="w-4 h-4 stroke-[3]" />
              )}
            </motion.div>
          </div>

          {/* Header & Skip */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#00FF9C]/20 text-[#00FF9C] border border-[#00FF9C]/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#00FF9C]" />
                Feature Tour • {currentStepIndex + 1}/{TOUR_STEPS.length}
              </span>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Skip Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title & Body */}
          <h3 className="font-outfit font-bold text-base text-white leading-snug mb-1.5">
            {currentStep.title}
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed mb-4">
            {currentStep.description}
          </p>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStepIndex
                      ? "w-5 bg-[#00FF9C]"
                      : "w-1.5 bg-zinc-700"
                  }`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-[11px] font-semibold text-zinc-400 hover:text-white px-2 py-1 transition-colors cursor-pointer"
              >
                Skip
              </button>
              <Button
                type="button"
                size="sm"
                onClick={handleNext}
                className="bg-[#00FF9C] hover:bg-[#00e58a] text-black font-extrabold text-xs h-8 px-3.5 rounded-lg transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                {isLastStep ? (
                  <>
                    <span>Get Started</span>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
