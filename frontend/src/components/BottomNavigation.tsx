import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

// ── 1. Today Icon (Calendar with active day dot & neon binder rings) ──────
function TodayIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="w-5 h-5 transition-transform" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="today-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FF9C" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00995E" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect x="3" y="4" width="18" height="17" rx="4" fill="url(#today-fill)" stroke="#00FF9C" strokeWidth="2" />
        <path d="M3 9.5H21" stroke="#00FF9C" strokeWidth="1.5" />
        <path d="M8 2V5M16 2V5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="15" r="2.5" fill="#FFFFFF" filter="drop-shadow(0 0 4px #00FF9C)" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-[#7B889B] group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="4" />
      <line x1="16" y1="2" x2="16" y2="5" />
      <line x1="8" y1="2" x2="8" y2="5" />
      <line x1="3" y1="9.5" x2="21" y2="9.5" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
    </svg>
  );
}

// ── 2. Workouts Icon (3D Hex Dumbbell with glowing metallic plates) ────────
function WorkoutsIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="w-5 h-5 transition-transform" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="dumbbell-glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00FF9C" />
            <stop offset="100%" stopColor="#22CC66" />
          </linearGradient>
        </defs>
        <path d="M6.5 6.5L17.5 17.5" stroke="#00FF9C" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M4 8.5L6.5 6L8.5 8L6 10.5Z" fill="url(#dumbbell-glow)" stroke="#FFFFFF" strokeWidth="1.2" />
        <path d="M2 10.5L4 8.5L6 10.5L4 12.5Z" fill="#00FF9C" fillOpacity="0.6" stroke="#00FF9C" strokeWidth="1" />
        <path d="M15.5 20L17.5 18L19.5 20L17.5 22Z" fill="#00FF9C" fillOpacity="0.6" stroke="#00FF9C" strokeWidth="1" />
        <path d="M17.5 18L20 15.5L22 17.5L19.5 20Z" fill="url(#dumbbell-glow)" stroke="#FFFFFF" strokeWidth="1.2" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-[#7B889B] group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5L17.5 17.5" />
      <path d="M4.5 8.5L6.5 6.5L8.5 8.5L6.5 10.5Z" />
      <path d="M15.5 19.5L17.5 17.5L19.5 19.5L17.5 21.5Z" />
      <path d="M2.5 10.5L4.5 8.5" />
      <path d="M19.5 17.5L21.5 15.5" />
    </svg>
  );
}

// ── 3. Meals Icon (Smart Fork & AI Scan Lens) ─────────────────────────────
function MealsIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="w-5 h-5 transition-transform" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="fork-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FF9C" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#00995E" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path d="M19 2V8C19 9.66 17.66 11 16 11C14.34 11 13 9.66 13 8V2" stroke="#00FF9C" strokeWidth="2" strokeLinecap="round" fill="url(#fork-grad)" />
        <path d="M16 2V12M16 12V22" stroke="#00FF9C" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 2V22C8.5 22 9.5 19 9.5 14V4C9.5 2.9 8.6 2 7.5 2H6Z" fill="#00FF9C" stroke="#FFFFFF" strokeWidth="1.2" />
        <circle cx="20" cy="5" r="1.5" fill="#FFFFFF" filter="drop-shadow(0 0 4px #00FF9C)" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-[#7B889B] group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2V8C18 9.66 16.66 11 15 11C13.34 11 12 9.66 12 8V2" />
      <path d="M15 2V12M15 12V22" />
      <path d="M6 2V22C8.2 22 9 19 9 14V4C9 2.9 8.1 2 7 2H6Z" />
    </svg>
  );
}

// ── 4. Progress Icon (Biometric Telemetry Graph with Apex Glowing Dot) ────
function ProgressIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="w-5 h-5 transition-transform" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="bar-apex" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FF9C" />
            <stop offset="100%" stopColor="#00995E" />
          </linearGradient>
        </defs>
        <rect x="3" y="13" width="4" height="8" rx="2" fill="#00FF9C" fillOpacity="0.35" stroke="#00FF9C" strokeWidth="1.5" />
        <rect x="10" y="5" width="4" height="16" rx="2" fill="url(#bar-apex)" stroke="#FFFFFF" strokeWidth="1.4" />
        <rect x="17" y="9" width="4" height="12" rx="2" fill="#00FF9C" fillOpacity="0.4" stroke="#00FF9C" strokeWidth="1.5" />
        <circle cx="12" cy="5" r="2" fill="#FFFFFF" filter="drop-shadow(0 0 4px #00FF9C)" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-[#7B889B] group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="13" width="4" height="8" rx="1.5" />
      <rect x="10" y="5" width="4" height="16" rx="1.5" />
      <rect x="17" y="9" width="4" height="12" rx="1.5" />
    </svg>
  );
}

// ── 5. Coach Icon (Futuristic Cyber-Visor AI Trainer Helmet) ──────────────
function CoachIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="w-5 h-5 transition-transform" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="visor-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00FF9C" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
          <linearGradient id="helmet-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FF9C" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00995E" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect x="3" y="10" width="18" height="11" rx="4.5" fill="url(#helmet-bg)" stroke="#00FF9C" strokeWidth="2" />
        <rect x="6" y="13" width="12" height="3" rx="1.5" fill="url(#visor-grad)" filter="drop-shadow(0 0 5px #00FF9C)" />
        <path d="M12 6V10" stroke="#00FF9C" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="4.5" r="2" fill="#FFFFFF" stroke="#00FF9C" strokeWidth="1.2" />
        <circle cx="2" cy="15.5" r="1.5" fill="#00FF9C" />
        <circle cx="22" cy="15.5" r="1.5" fill="#00FF9C" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-[#7B889B] group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="10" width="18" height="11" rx="4.5" />
      <line x1="7" y1="14.5" x2="17" y2="14.5" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 6V10" />
      <circle cx="12" cy="4" r="1.5" />
    </svg>
  );
}

const navigationItems = [
  {
    label: "Today",
    href: "/app/today",
    icon: TodayIcon,
  },
  {
    label: "Workouts",
    href: "/home-workouts",
    icon: WorkoutsIcon,
  },
  {
    label: "Meals",
    href: "/app/nutrition",
    icon: MealsIcon,
  },
  {
    label: "Progress",
    href: "/app/progress",
    icon: ProgressIcon,
  },
  {
    label: "Coach",
    href: "/ai-trainer",
    icon: CoachIcon,
  },
];

export function BottomNavigation() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Only render for logged in users on mobile/tablet viewports
  if (isLoading || !isAuthenticated) return null;

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(10);
      } catch (_) {
        // Silently ignore if blocked by browser policy
      }
    }
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 w-full z-50 lg:hidden bg-[#080A0C]/96 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-8px_32px_rgba(0,0,0,0.85)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Specular ambient line across the top rim */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      <div className="w-full max-w-md mx-auto h-16 px-1.5 flex items-center justify-between relative">
        {navigationItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href === "/app/today" && (location.pathname === "/app/today" || location.pathname === "/dashboard")) ||
            (item.href === "/home-workouts" && (location.pathname === "/home-workouts" || location.pathname === "/app/explore" || location.pathname === "/features")) ||
            (item.href === "/app/nutrition" && (location.pathname === "/app/nutrition" || location.pathname === "/nutrition")) ||
            (item.href === "/ai-trainer" && (location.pathname === "/ai-trainer" || location.pathname === "/ai-workout"));
          
          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={triggerHaptic}
              className="group relative flex flex-col items-center justify-center flex-1 min-w-0 h-full py-1 focus:outline-none select-none"
              aria-label={item.label}
            >
              <motion.div 
                whileTap={{ scale: 0.84 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="relative flex flex-col items-center justify-center gap-1 w-full min-w-0 px-0.5"
              >
                <div 
                  className={cn(
                    "transition-all duration-300 flex items-center justify-center shrink-0",
                    isActive ? "scale-110 drop-shadow-[0_0_12px_rgba(0,255,156,0.65)]" : "scale-100"
                  )}
                >
                  <IconComponent active={isActive} />
                </div>
                <span 
                  className={cn(
                    "text-[10px] tracking-tight truncate max-w-full block text-center leading-tight transition-colors duration-200",
                    isActive 
                      ? "text-[#00FF9C] font-bold drop-shadow-[0_0_8px_rgba(0,255,156,0.4)]" 
                      : "text-[#7B889B] font-medium group-hover:text-white"
                  )}
                >
                  {item.label}
                </span>
              </motion.div>

              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active-pill"
                  className="absolute bottom-1 w-5 h-1 rounded-full bg-[#00FF9C] shadow-[0_0_10px_#00FF9C,0_0_20px_rgba(0,255,156,0.5)]"
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
