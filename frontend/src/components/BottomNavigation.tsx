import { Link, useLocation } from "react-router-dom";
import { Calendar, Dumbbell, Utensils, Sparkles, LineChart, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: typeof Calendar;
  isCenter?: boolean;
  matchPaths?: string[];
}

const navigationItems: NavItem[] = [
  {
    label: "Today",
    href: "/app/today",
    icon: Calendar,
    matchPaths: ["/app/today", "/dashboard", "/"],
  },
  {
    label: "Workouts",
    href: "/home-workouts",
    icon: Dumbbell,
    matchPaths: ["/home-workouts", "/app/explore", "/ai-workout", "/features"],
  },
  {
    label: "Meals",
    href: "/app/nutrition",
    icon: Utensils,
    isCenter: true,
    matchPaths: ["/app/nutrition", "/nutrition"],
  },
  {
    label: "Progress",
    href: "/app/progress",
    icon: LineChart,
    matchPaths: ["/app/progress", "/progress", "/analytics"],
  },
  {
    label: "Coach",
    href: "/ai-trainer",
    icon: Bot,
    matchPaths: ["/ai-trainer", "/coach"],
  },
];

export function BottomNavigation() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Only render for logged in users on mobile/tablet viewports
  if (isLoading || !isAuthenticated) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 w-full z-50 lg:hidden bg-[#0a0b0e]/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[20px] shadow-[0_-8px_32px_rgba(0,0,0,0.7)]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)" }}
    >
      <div className="w-full max-w-md mx-auto h-16 px-2 flex items-center justify-around relative">
        {navigationItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.matchPaths && item.matchPaths.includes(location.pathname));
          const Icon = item.icon;

          // 🌟 Center Hero Action Tab ("Meals")
          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                to={item.href}
                className="relative flex flex-col items-center justify-center flex-1 min-w-0 -mt-5 group focus:outline-none"
                aria-label={item.label}
              >
                <div className="relative flex items-center justify-center">
                  {/* Subtle Active Breathing Glow */}
                  {isActive && (
                    <span className="absolute -inset-1 rounded-full bg-[#00FF9C]/40 blur-md animate-pulse pointer-events-none" />
                  )}

                  {/* Elevated Center Hero Circle */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ring-4 ring-[#0a0b0e] active:scale-90",
                      isActive
                        ? "bg-gradient-to-tr from-[#00D07E] via-[#00FF9C] to-[#55FFB8] text-[#060809] shadow-[0_0_22px_rgba(0,255,156,0.6),0_8px_16px_rgba(0,0,0,0.7)] scale-105"
                        : "bg-[#14171e] text-[#00FF9C] border border-white/15 hover:border-[#00FF9C]/40 hover:text-white shadow-[0_4px_14px_rgba(0,0,0,0.5)]"
                    )}
                  >
                    <div className="relative flex items-center justify-center">
                      <Utensils
                        className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
                        strokeWidth={isActive ? 2.4 : 2}
                      />
                      <Sparkles
                        className={cn(
                          "w-2.5 h-2.5 absolute -top-1 -right-1 transition-opacity",
                          isActive ? "text-[#060809]" : "text-[#00FF9C]"
                        )}
                      />
                    </div>
                  </div>
                </div>

                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-tight leading-none mt-1 transition-colors duration-200",
                    isActive
                      ? "text-[#00FF9C] drop-shadow-[0_0_8px_rgba(0,255,156,0.4)]"
                      : "text-gray-400 group-hover:text-white"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          // ⚡ Standard Side Tabs (Today, Workouts, Progress, Coach)
          return (
            <Link
              key={item.href}
              to={item.href}
              className="relative flex flex-col items-center justify-center flex-1 min-w-0 h-full py-1 text-xs font-medium transition-all active:scale-95 group focus:outline-none"
              aria-label={item.label}
            >
              <div
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 transition-all duration-200 w-full min-w-0 px-1 py-0.5 rounded-xl",
                  isActive ? "text-[#00FF9C]" : "text-gray-400 hover:text-gray-200"
                )}
              >
                <div
                  className={cn(
                    "p-1 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-[#00FF9C]/10 border border-[#00FF9C]/20 shadow-[0_0_12px_rgba(0,255,156,0.25)]"
                      : "bg-transparent border border-transparent"
                  )}
                >
                  <Icon
                    className="w-5 h-5 transition-transform duration-200 group-hover:scale-105 shrink-0"
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                </div>

                <span
                  className={cn(
                    "text-[9.5px] sm:text-[10px] tracking-tight truncate max-w-full block text-center leading-none transition-colors duration-200",
                    isActive
                      ? "font-bold text-[#00FF9C]"
                      : "font-medium text-gray-400 group-hover:text-gray-200"
                  )}
                >
                  {item.label}
                </span>
              </div>

              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active-pip"
                  className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#00FF9C] shadow-[0_0_8px_#00FF9C]"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
