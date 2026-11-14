import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Utensils, Box, Sparkles, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureSlide {
  id: string;
  tabLabel: string;
  icon: typeof Video;
  image: string;
  title: string;
  subtitle: string;
  hudMetrics: {
    topBadge: string;
    leftBadge: string;
    rightBadge: string;
  };
}

const FEATURE_SLIDES: FeatureSlide[] = [
  {
    id: "vision",
    tabLabel: "AI Vision Coach",
    icon: Video,
    image: "/hero-vision-coach.jpg",
    title: "Real-Time Computer Vision Tracking",
    subtitle: "MoveNet 3D joint tracking monitors your cadence, posture, and barbell bar path.",
    hudMetrics: {
      topBadge: "MoveNet 3D • 99.2% Precision",
      leftBadge: "Angle: 165° Optimal",
      rightBadge: "Cadence: 2.1s • Rep 8",
    },
  },
  {
    id: "nutrition",
    tabLabel: "Meal Scanner",
    icon: Utensils,
    image: "/hero-meal-scanner.jpg",
    title: "Instant AI Nutrition & Macro Scanner",
    subtitle: "Snap a photo of your plate to instantly log calories, protein, carbs, and healthy fats.",
    hudMetrics: {
      topBadge: "Instant Match 99.4%",
      leftBadge: "38g Carbs • 18g Fats",
      rightBadge: "580 kcal • 46g Protein",
    },
  },
  {
    id: "trainer",
    tabLabel: "3D Trainer",
    icon: Box,
    image: "/hero-3d-trainer.jpg",
    title: "Interactive 3D Virtual Coach",
    subtitle: "Turn camera off or use PiP for animated biomechanical trajectory demonstrations.",
    hudMetrics: {
      topBadge: "3D Virtual Coach • 15+ Exercises",
      leftBadge: "Knee Angle: 92° Parallel",
      rightBadge: "Trajectory: 100% Vertical",
    },
  },
];

export function HeroFeatureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auto-advance every 4.5 seconds unless user hovers or interacts
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % FEATURE_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped left -> next slide
        setCurrentIndex((prev) => (prev + 1) % FEATURE_SLIDES.length);
      } else {
        // Swiped right -> prev slide
        setCurrentIndex((prev) => (prev - 1 + FEATURE_SLIDES.length) % FEATURE_SLIDES.length);
      }
    }
    touchStartX.current = null;
    setIsPaused(false);
  };

  const activeSlide = FEATURE_SLIDES[currentIndex];

  return (
    <div
      className="w-full max-w-xl lg:max-w-3xl mx-auto flex flex-col items-center select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Tab Switcher Buttons ── */}
      <div className="flex items-center justify-center gap-1 sm:gap-2.5 p-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl mb-3.5 sm:mb-5 max-w-full overflow-x-auto no-scrollbar">
        {FEATURE_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIndex;
          const Icon = slide.icon;

          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-sm font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap active:scale-95",
                isActive
                  ? "bg-[#00FF9C]/15 border border-[#00FF9C] text-[#00FF9C] shadow-[0_0_16px_rgba(0,255,156,0.3)]"
                  : "border border-transparent text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-3 sm:w-3.5 h-3 sm:h-3.5", isActive ? "text-[#00FF9C]" : "text-white/50")} />
              <span>{slide.tabLabel}</span>
            </button>
          );
        })}
      </div>

      {/* ── Carousel Feature Card with Touch Swiping ── */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-3xl overflow-hidden border border-white/15 bg-black/60 shadow-[0_20px_60px_rgba(0,0,0,0.85)] group"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative w-full h-full"
          >
            {/* Visual Media */}
            <img
              src={activeSlide.image}
              alt={activeSlide.title}
              className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
            />

            {/* Cinematic Edge Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl pointer-events-none" />

            {/* Top HUD Badge */}
            <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between pointer-events-none">
              <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-[#00FF9C]/40 text-[#00FF9C] text-[10px] sm:text-xs font-bold tracking-tight shadow-lg flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9C] animate-pulse" />
                {activeSlide.hudMetrics.topBadge}
              </span>
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 text-white/70 text-[10px] font-semibold">
                SmartFit Live Vision
              </span>
            </div>

            {/* Bottom Floating Telemetry Overlay Cards */}
            <div className="absolute bottom-3.5 inset-x-3.5 flex items-end justify-between gap-2 pointer-events-none">
              {/* Left Telemetry Pill */}
              <div className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-white shadow-lg">
                <p className="text-[10px] sm:text-xs font-bold text-white/90">
                  {activeSlide.hudMetrics.leftBadge}
                </p>
              </div>

              {/* Right Telemetry Pill */}
              <div className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-[#00FF9C]/30 text-white shadow-lg">
                <p className="text-[10px] sm:text-xs font-bold text-[#00FF9C]">
                  {activeSlide.hudMetrics.rightBadge}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Ambient Corner Glow */}
        <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-[#00FF9C]/15 blur-3xl pointer-events-none" />
      </div>

      {/* ── Slide Progress Dots ── */}
      <div className="flex items-center gap-2 mt-4">
        {FEATURE_SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
              idx === currentIndex
                ? "w-7 bg-[#00FF9C] shadow-[0_0_8px_rgba(0,255,156,0.6)]"
                : "w-2 bg-white/20 hover:bg-white/40"
            )}
          />
        ))}
      </div>
    </div>
  );
}
