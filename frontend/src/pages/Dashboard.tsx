import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Clock,
  Dumbbell,
  MapPin,
  Flame,
  Zap,
  Droplet,
  Plus,
  Building2,
  Bot,
  ArrowRight,
  Loader2,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const gamification = useGamification();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Water tracking state (persisted locally)
  const [waterGlasses, setWaterGlasses] = useState<number>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const stored = localStorage.getItem(`smartfit_water_${today}`);
    return stored ? parseInt(stored, 10) : 0;
  });

  // Gym check-in state
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  useEffect(() => {
    const loadUserData = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, username, avatar_url, preferences, daily_calories_target")
          .eq("id", userId)
          .single();

        if (data) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Error loading dashboard profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (!authUser) {
        navigate("/auth");
      } else {
        loadUserData(authUser.id);
      }
    }
  }, [authUser, authLoading, navigate]);

  // Greeting by time of day
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const rawName =
    profile?.full_name ||
    authUser?.user_metadata?.full_name ||
    profile?.username ||
    "Prem";
  const firstName = rawName.split(" ")[0] || "Prem";

  // Water increment
  const handleAddWater = () => {
    const next = Math.min(waterGlasses + 1, 12);
    setWaterGlasses(next);
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`smartfit_water_${today}`, next.toString());
    toast.success(`Logged 1 glass of water (${next}/8) 💧`);
  };

  // Gym Check-in
  const handleCheckIn = () => {
    if (isCheckedIn) {
      toast.info("Already checked in today! Great consistency!");
      return;
    }
    setIsCheckedIn(true);
    if (gamification?.addXP) {
      gamification.addXP(30);
    }
    toast.success("Checked in at your gym! +30 XP earned! 🏋️");
  };

  // Level & XP
  const level = gamification?.level || 4;
  const xp = gamification?.xp || 420;
  const nextLevelXp = gamification?.nextLevelXp || 600;
  const streakDays = gamification?.streak || 1;

  if (authLoading || loading) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ backgroundColor: "var(--sf-bg, #F2F7F4)" }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-[#1F7A5A] dark:text-[#4CC38A]" />
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh flex flex-col overflow-x-hidden"
      style={{
        backgroundColor: "var(--sf-bg, #F2F7F4)",
        color: "var(--sf-text, #16211C)",
      }}
    >
      <div
        className="w-full max-w-md mx-auto px-4"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
        }}
      >
        {/* ── Top Bar ── */}
        <header className="flex items-center justify-between h-14 mb-2">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Today
          </h1>

          <button
            type="button"
            onClick={() => navigate("/app/profile")}
            aria-label="Profile Avatar"
            className="w-9 h-9 rounded-full bg-[#0D3B29] text-[#4CC38A] flex items-center justify-center shadow-2xs active:scale-95 transition-transform"
          >
            <User className="w-5 h-5 text-[#4CC38A]" strokeWidth={2.2} />
          </button>
        </header>

        {/* ── Greeting & XP Bar ── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {greeting}, {firstName}
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1F7A5A] dark:bg-[#4CC38A] shrink-0" />
              <span>
                Level {level} • {xp} / {nextLevelXp} XP
              </span>
            </p>
          </div>

          <div
            onClick={() => navigate("/app/profile")}
            role="button"
            tabIndex={0}
            className="w-11 h-11 rounded-full overflow-hidden shadow-xs ring-2 ring-white/80 dark:ring-neutral-800 cursor-pointer active:scale-95 transition-transform shrink-0"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={firstName}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src="/prem-avatar.jpg"
                alt={firstName}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        {/* ── Today's Workout Hero Card ── */}
        <div className="bg-white dark:bg-[#181D1A] rounded-3xl p-4 sm:p-5 shadow-xs border border-emerald-950/5 dark:border-neutral-800 space-y-3.5 mb-4">
          {/* Card Top Row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Today's workout
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A]">
              Scheduled
            </span>
          </div>

          {/* Workout Title & Meta */}
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
              Upper body strength
            </h3>
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>45 min</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Dumbbell className="w-3.5 h-3.5" />
                <span>6 exercises</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Gym</span>
              </div>
            </div>
          </div>

          {/* Hero Workout Image */}
          <div className="relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden shadow-2xs">
            <img
              src="/today-workout.jpg"
              alt="Upper body strength"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Start Workout Button */}
          <button
            type="button"
            onClick={() => navigate("/app/workout/session")}
            className="w-full h-12 rounded-xl bg-[#0D3B29] text-white font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer shadow-xs"
          >
            Start workout
          </button>
        </div>

        {/* ── 2x2 Stats Grid ── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Tile 1: Workouts */}
          <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Workouts
              </span>
              <Dumbbell className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            </div>

            <div className="mt-2.5">
              <p className="font-bold text-xl text-neutral-900 dark:text-neutral-100">
                0/5
              </p>
              <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-[#1F7A5A] dark:bg-[#4CC38A] rounded-full w-[10%]" />
              </div>
            </div>
          </div>

          {/* Tile 2: Streak */}
          <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Streak
              </span>
              <Flame className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            </div>

            <div className="mt-2.5">
              <p className="font-bold text-xl text-neutral-900 dark:text-neutral-100">
                {streakDays} {streakDays === 1 ? "day" : "days"}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Personal best: 14
              </p>
            </div>
          </div>

          {/* Tile 3: Calories */}
          <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Calories
              </span>
              <Zap className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            </div>

            <div className="mt-2.5">
              <p className="font-bold text-xl text-neutral-900 dark:text-neutral-100">
                0 / 2,000
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                kcal today
              </p>
            </div>
          </div>

          {/* Tile 4: Water */}
          <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Water
              </span>
              <Droplet className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            </div>

            <div className="flex items-end justify-between mt-2.5">
              <div>
                <p className="font-bold text-xl text-neutral-900 dark:text-neutral-100">
                  {waterGlasses} / 8
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  glasses logged
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddWater}
                aria-label="Log a glass of water"
                className="w-8 h-8 rounded-xl bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A] flex items-center justify-center font-bold text-base hover:opacity-85 active:scale-95 transition-transform cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Check In At Your Gym Card ── */}
        <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
                Check in at your gym
              </h4>
              <p className="text-xs font-semibold text-[#1F7A5A] dark:text-[#4CC38A] mt-0.5">
                +30 XP
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckIn}
            className={cn(
              "px-4 h-9 rounded-xl border text-xs font-bold transition-all shrink-0 active:scale-95",
              isCheckedIn
                ? "bg-[#EAF5EE] dark:bg-[#1E2D24] border-[#1F7A5A] text-[#1F7A5A] dark:text-[#4CC38A]"
                : "border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            )}
          >
            {isCheckedIn ? "Checked in" : "Check in"}
          </button>
        </div>

        {/* ── Coach Tip Card ── */}
        <div className="rounded-2xl p-4 bg-[#EAF5EE] dark:bg-[#17221C] border border-[#D5EEDB] dark:border-[#24352B] mb-6">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#1F7A5A] dark:text-[#4CC38A]" />
            <span className="text-xs font-bold text-[#1F7A5A] dark:text-[#4CC38A]">
              Coach tip
            </span>
          </div>

          <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 mt-2">
            Focus on controlled eccentrics on today's pressing movements to maximize
            muscle tension and joint health.
          </p>

          <button
            type="button"
            onClick={() => navigate("/ai-trainer")}
            className="text-xs font-bold text-[#1F7A5A] dark:text-[#4CC38A] flex items-center gap-1 mt-3 hover:underline cursor-pointer"
          >
            <span>Ask Coach</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
