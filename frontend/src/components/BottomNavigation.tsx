import { Link, useLocation } from "react-router-dom";
import { Calendar, Dumbbell, PlusCircle, LineChart, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    label: "Today",
    href: "/app/today",
    icon: Calendar,
  },
  {
    label: "Workouts",
    href: "/home-workouts",
    icon: Dumbbell,
  },
  {
    label: "Log",
    href: "/app/workout/session",
    icon: PlusCircle,
  },
  {
    label: "Progress",
    href: "/app/progress",
    icon: LineChart,
  },
  {
    label: "Coach",
    href: "/ai-trainer",
    icon: Bot,
  },
];

export function BottomNavigation() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Only render for logged in users on mobile/tablet viewports
  if (isLoading || !isAuthenticated) return null;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 w-full z-50 lg:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.6)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="w-full max-w-md mx-auto h-16 px-2 flex items-center justify-between">
        {navigationItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href === "/app/today" && (location.pathname === "/app/today" || location.pathname === "/dashboard")) ||
            (item.href === "/home-workouts" && (location.pathname === "/home-workouts" || location.pathname === "/app/explore" || location.pathname === "/features")) ||
            (item.href === "/ai-trainer" && (location.pathname === "/ai-trainer" || location.pathname === "/ai-workout"));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className="relative flex flex-col items-center justify-center flex-1 min-w-0 h-full py-1 text-xs font-medium transition-all active:scale-90"
              aria-label={item.label}
            >
              <div 
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 transition-all duration-300 w-full min-w-0 px-1",
                  isActive ? "text-[#4CC38A] scale-105 drop-shadow-[0_0_8px_rgba(76,195,138,0.3)]" : "text-gray-400 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 transition-transform shrink-0" />
                <span className="text-[10px] tracking-tight truncate max-w-full block leading-none">{item.label}</span>
              </div>

              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#4CC38A] shadow-[0_0_8px_#4CC38A]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
