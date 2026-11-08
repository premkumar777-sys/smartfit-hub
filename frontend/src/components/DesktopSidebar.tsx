import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Dumbbell,
  PlusCircle,
  LineChart,
  Utensils,
  Bot,
  User,
  Settings,
  LogOut,
  Flame,
  Zap,
  Sparkles,
  Box,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

interface DesktopSidebarProps {
  avatarUrl?: string;
  userName?: string;
}

export function DesktopSidebar({ avatarUrl, userName }: DesktopSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { level, xp, nextLevelXp, streakDays } = useGamification();

  const displayName = userName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Prem";
  const userAvatar = avatarUrl || user?.user_metadata?.avatar_url || "/prem-avatar.jpg";

  const navItems = [
    {
      label: "Today",
      href: "/app/today",
      icon: Calendar,
      activePattern: ["/app/today", "/dashboard"],
    },
    {
      label: "Workouts",
      href: "/home-workouts",
      icon: Dumbbell,
      activePattern: ["/home-workouts", "/app/explore", "/features"],
    },
    {
      label: "Log Workout",
      href: "/app/workout/session",
      icon: PlusCircle,
      activePattern: ["/app/workout/session"],
    },
    {
      label: "Progress",
      href: "/app/progress",
      icon: LineChart,
      activePattern: ["/app/progress", "/progress"],
    },
    {
      label: "Nutrition",
      href: "/nutrition",
      icon: Utensils,
      activePattern: ["/nutrition", "/app/nutrition"],
    },
    {
      label: "AI Coach",
      href: "/ai-trainer",
      icon: Bot,
      activePattern: ["/ai-trainer", "/ai-workout"],
    },
    {
      label: "3D Trainer",
      href: "/3d-trainer",
      icon: Box,
      activePattern: ["/3d-trainer"],
    },
    {
      label: "Online Coaching",
      href: "/online-coaching",
      icon: Users,
      activePattern: ["/online-coaching"],
    },
  ];

  const secondaryItems = [
    {
      label: "Profile",
      href: "/app/profile",
      icon: User,
      activePattern: ["/app/profile", "/profile"],
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      activePattern: ["/settings", "/app/settings"],
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 h-screen sticky top-0 border-r border-emerald-950/5 dark:border-neutral-800 bg-white/90 dark:bg-[#111413]/90 backdrop-blur-xl z-30 select-none">
      {/* ── Brand Header ── */}
      <div className="h-20 px-6 flex items-center justify-between border-b border-emerald-950/5 dark:border-neutral-800 shrink-0">
        <Link to="/app/today" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0D3B29] to-[#1F7A5A] dark:from-[#1F7A5A] dark:to-[#4CC38A] flex items-center justify-center text-white shadow-md shadow-emerald-950/10 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-[#4CC38A] dark:text-[#EAF5EE]" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-neutral-900 dark:text-neutral-50 block leading-tight">
              SmartFit AI
            </span>
            <span className="text-[10px] font-bold text-[#1F7A5A] dark:text-[#4CC38A] uppercase tracking-wider">
              Fitness Intelligence
            </span>
          </div>
        </Link>
      </div>

      {/* ── Navigation Links ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div>
          <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.activePattern.some(
                (p) => location.pathname === p || location.pathname.startsWith(p + "/")
              );
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all group",
                    isActive
                      ? "bg-[#EAF5EE] dark:bg-[#1A2520] text-[#0D3B29] dark:text-[#4CC38A] shadow-2xs font-bold"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform group-hover:scale-110",
                      isActive
                        ? "text-[#1F7A5A] dark:text-[#4CC38A]"
                        : "text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300"
                    )}
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-5 rounded-full bg-[#1F7A5A] dark:bg-[#4CC38A]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Account
          </p>
          <nav className="space-y-1">
            {secondaryItems.map((item) => {
              const isActive = item.activePattern.some(
                (p) => location.pathname === p || location.pathname.startsWith(p + "/")
              );
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all group",
                    isActive
                      ? "bg-[#EAF5EE] dark:bg-[#1A2520] text-[#0D3B29] dark:text-[#4CC38A] shadow-2xs font-bold"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform group-hover:scale-110",
                      isActive
                        ? "text-[#1F7A5A] dark:text-[#4CC38A]"
                        : "text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300"
                    )}
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Mini Streak Card in Sidebar ── */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EAF5EE] to-[#D5EEDB] dark:from-[#17221C] dark:to-[#1E2D24] border border-[#D5EEDB] dark:border-[#24352B]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#1F7A5A] dark:text-[#4CC38A] flex items-center gap-1.5">
              <Flame className="w-4 h-4 fill-current" />
              Active Streak
            </span>
            <span className="text-xs font-black text-neutral-800 dark:text-neutral-100">
              {streakDays} {streakDays === 1 ? "day" : "days"}
            </span>
          </div>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
            Log today's workout to keep your streak alive!
          </p>
        </div>
      </div>

      {/* ── User Footer Profile Card ── */}
      <div className="p-4 border-t border-emerald-950/5 dark:border-neutral-800 shrink-0">
        <div className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 transition-colors">
          <div
            onClick={() => navigate("/app/profile")}
            className="flex items-center gap-3 min-w-0 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-emerald-600/20 shrink-0">
              <img
                src={userAvatar}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {displayName}
              </p>
              <p className="text-[11px] font-semibold text-[#1F7A5A] dark:text-[#4CC38A] flex items-center gap-1 truncate">
                <Zap className="w-3 h-3 fill-current" />
                Level {level} • {xp} XP
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            title="Sign out"
            aria-label="Sign out"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
