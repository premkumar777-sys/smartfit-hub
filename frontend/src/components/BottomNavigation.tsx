import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Compass, PlusCircle, LineChart, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    label: "Today",
    href: "/app/today",
    icon: LayoutDashboard,
  },
  {
    label: "Explore",
    href: "/app/explore",
    icon: Compass,
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
    label: "Profile",
    href: "/app/profile",
    icon: User,
  },
];

export function BottomNavigation() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Only render for logged in users on mobile/tablet viewports
  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden pb-safe">
      <div 
        className={cn(
          "w-full h-16 px-4 flex items-center justify-around",
          "bg-[#0a0a0a]/85 backdrop-blur-xl border border-white/10 rounded-2xl",
          "shadow-[0_8px_32px_0_rgba(0,0,0,0.6)]",
          "transition-all duration-300"
        )}
      >
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-all active:scale-90"
              aria-label={item.label}
            >
              <div 
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 transition-all duration-300",
                  isActive ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(0,255,156,0.3)]" : "text-gray-400 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 transition-transform" />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </div>

              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#00FF9C]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
