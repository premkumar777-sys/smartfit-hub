import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Clock,
  Dumbbell,
  Flame,
  Zap,
  Droplet,
  Plus,
  Building2,
  Bot,
  ArrowRight,
  Loader2,
  Check,
  Utensils,
  Video,
  Sparkles,
  Trophy,
  Calendar,
  Box,
  Users,
  Moon,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { getPersonalizedPlan, PersonalizedPlan, hasLocalOnboardingDraft } from "@/lib/onboarding";
import { getPersonalizedWorkoutHero } from "@/lib/workoutImages";
import { NotificationOptInCard } from "@/components/NotificationOptInCard";
import { AppWalkthroughTour } from "@/components/AppWalkthroughTour";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const gamification = useGamification();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [plan, setPlan] = useState<PersonalizedPlan>(() => getPersonalizedPlan());

  // Water tracking state (persisted locally)
  const [waterGlasses, setWaterGlasses] = useState<number>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const stored = localStorage.getItem(`smartfit_water_${today}`);
    return stored ? parseInt(stored, 10) : 0;
  });

  // Gym check-in state
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  useEffect(() => {
    const isGuest = localStorage.getItem("smartfit_guest_plan_active") === "true";

    const loadUserData = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, username, avatar_url, preferences, daily_calories_target, fitness_goal, gender, age, height, weight")
          .eq("id", userId)
          .single();

        if (data) {
          const prefs = (data.preferences as Record<string, any>) || {};
          const hasCompletedFlag = prefs.onboardingCompleted === true;
          const hasMetrics = Boolean(data.fitness_goal && (data.gender || data.weight));

          // If athlete has no metrics, no onboarding completion, and no local draft, redirect to calibration
          if (!hasCompletedFlag && !hasMetrics && !hasLocalOnboardingDraft()) {
            navigate("/onboarding/basics", { replace: true });
            return;
          }

          setProfile(data);
          setPlan(getPersonalizedPlan(data));
        }
      } catch (err) {
        console.error("Error loading dashboard profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (!authUser) {
        if (!isGuest) {
          navigate("/auth");
        } else {
          // Guest mode: load plan from onboarding draft in localStorage
          setPlan(getPersonalizedPlan());
          setLoading(false);
        }
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
    profile?.full_name?.trim() ||
    localStorage.getItem("smartfit_profile_name")?.trim() ||
    authUser?.user_metadata?.full_name?.trim() ||
    authUser?.user_metadata?.name?.trim() ||
    profile?.username?.trim() ||
    (authUser?.email ? authUser.email.split("@")[0].replace(/[0-9_.-]+$/, "") : "") ||
    (authUser ? "Athlete" : "Guest Athlete");

  const cleanFirstName = (() => {
    let first = rawName.split(" ")[0]?.trim() || "Athlete";
    if (first && first.length > 0) {
      first = first.charAt(0).toUpperCase() + first.slice(1);
    }
    return first;
  })();
  const firstName = cleanFirstName;

  // Formatted date string for desktop header
  const todayDateString = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

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
  const level = gamification?.level || 1;
  const xp = gamification?.xp || 150;
  const nextLevelXp = gamification?.nextLevelXp || 300;
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

  // ─────────────────────────────────────────────────────────────
  // Reusable Component: Hero Workout Card
  // ─────────────────────────────────────────────────────────────
  const WorkoutHeroCard = () => {
    const isRest = plan.todayWorkout.isRestDay;
    const userGender = profile?.gender || profile?.preferences?.gender || "male";
    const heroConfig = getPersonalizedWorkoutHero(
      plan.todayWorkout.title,
      plan.todayWorkout.focus,
      userGender,
      isRest
    );

    return (
      <div className="bg-white dark:bg-[#181D1A] rounded-3xl p-4 sm:p-6 shadow-xs border border-emerald-950/5 dark:border-neutral-800 space-y-3.5">
        {/* Card Top Row */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {isRest ? "Today: Active Recovery" : "Today's workout"}
          </span>
        </div>

        {/* Workout Title & Meta */}
        <div>
          <h3 className="text-xl lg:text-2xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
            {plan.todayWorkout.title}
          </h3>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{plan.todayWorkout.duration}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Dumbbell className="w-3.5 h-3.5" />
              <span>{plan.todayWorkout.exerciseCount} exercises</span>
            </div>
          </div>
        </div>


        {/* Hero Workout Image */}
        <div className="relative w-full h-40 sm:h-52 lg:h-64 rounded-2xl overflow-hidden shadow-2xs group">
          <img
            src={heroConfig.src}
            alt={plan.todayWorkout.title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = heroConfig.fallback;
            }}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />
          <div className="absolute bottom-3 left-3 text-white text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
              {heroConfig.tag}
            </span>
          </div>
        </div>

        {/* Start Workout Button */}
        <button
          type="button"
          onClick={() => navigate("/app/workout/session")}
          className="w-full h-12 lg:h-13 rounded-xl bg-[#0D3B29] hover:bg-[#134e37] text-white font-bold text-sm lg:text-base active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/10"
        >
          <span>{isRest ? "Start Recovery Mobility Session" : "Start Today's Workout"}</span>
        </button>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Reusable Component: 3D Trainer Hero Card (Plan B)
  // ─────────────────────────────────────────────────────────────
  const Virtual3DTrainerCard = () => (
    <div 
      id="tour-virtual-trainer"
      className="relative rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#121614] to-[#18221c] border border-[#00FF9C]/25 shadow-lg shadow-emerald-950/20 overflow-hidden group"
    >
      {/* Background glow */}
      <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-[#00FF9C]/10 blur-3xl pointer-events-none group-hover:bg-[#00FF9C]/20 transition-all duration-700" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#00FF9C]/20 text-[#00FF9C] border border-[#00FF9C]/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9C] animate-pulse" />
              Interactive 3D Coach
            </span>
            <span className="text-[11px] font-bold text-white/50">15 Video Demos</span>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>3D Trainer &amp; Form Vault</span>
            <Sparkles className="w-4 h-4 text-[#00FF9C]" />
          </h3>

          <p className="text-xs text-white/70 leading-relaxed max-w-xl">
            Camera-free workout mode with animated 3D demonstrations, rep tempo intervals, joint angle guidance, and real-time voice coaching.
          </p>

          {/* Quick Exercise Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
            {["Squats", "Push-ups", "Bicep Curls", "Lat Pulls", "Shoulder Press", "+10 more"].map((pill) => (
              <span
                key={pill}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 border border-white/10 text-white/80"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/3d-trainer")}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#00FF9C] hover:bg-[#00e58a] text-black font-extrabold text-xs sm:text-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,255,156,0.25)] shrink-0"
        >
          <span>Launch 3D Trainer</span>
          <ArrowRight className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // Reusable Component: 2x2 Stats Grid
  // ─────────────────────────────────────────────────────────────
  const StatsGrid = () => (
    <div className="grid grid-cols-2 gap-3">
      {/* Tile 1: Workouts */}
      <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Workouts
          </span>
          <Dumbbell className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
        </div>

        <div className="mt-2.5">
          <p className="font-bold text-xl text-neutral-900 dark:text-neutral-100">
            0/{plan.trainingDays.length}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            {plan.trainingDays.length} sessions scheduled
          </p>
          <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-[#1F7A5A] dark:bg-[#4CC38A] rounded-full w-[8%]" />
          </div>
        </div>
      </div>

      {/* Tile 2: Streak */}
      <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Streak
          </span>
          <Flame className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
        </div>

        <div className="mt-2.5">
          <p className="font-bold text-xl text-neutral-900 dark:text-neutral-100">
            {streakDays} {streakDays === 1 ? "day" : "days"}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Day 1 of transformation
          </p>
        </div>
      </div>

      {/* Tile 3: Calories (Links to Meal Analyser) */}
      <div
        onClick={() => navigate("/app/nutrition")}
        role="button"
        tabIndex={0}
        aria-label="Open Meal Analyser"
        className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex flex-col justify-between cursor-pointer hover:border-emerald-600/30 active:scale-[0.98] transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Daily Calories
          </span>
          <Zap className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
        </div>

        <div className="mt-2.5">
          <p className="font-bold text-xl text-neutral-900 dark:text-neutral-100">
            0 / {plan.dailyCalories.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#1F7A5A] dark:text-[#4CC38A] font-semibold mt-1">
            Target: {plan.macros.protein}g protein
          </p>
        </div>
      </div>

      {/* Tile 4: Water */}
      <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
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
  );

  // ─────────────────────────────────────────────────────────────
  // Reusable Component: Check In At Your Gym
  // ─────────────────────────────────────────────────────────────
  const GymCheckInCard = () => (
    <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex items-center justify-between">
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
          "px-4 h-9 rounded-xl border text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer",
          isCheckedIn
            ? "bg-[#EAF5EE] dark:bg-[#1E2D24] border-[#1F7A5A] text-[#1F7A5A] dark:text-[#4CC38A]"
            : "border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
        )}
      >
        {isCheckedIn ? "Checked in" : "Check in"}
      </button>
    </div>
  );


  // ─────────────────────────────────────────────────────────────
  // Reusable Component: Weekly Schedule Strip
  // ─────────────────────────────────────────────────────────────
  const WeeklyScheduleCard = () => {
    const dayNamesShort = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const currentDayShort = dayNamesShort[new Date().getDay()];

    return (
      <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#1F7A5A] dark:text-[#4CC38A]" />
            Your {plan.trainingDays.length}-Day Schedule
          </span>
          <span className="text-[11px] font-semibold text-neutral-400">
            0 of {plan.trainingDays.length} done
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1 w-full">
          {plan.weekPlan.map((d) => {
            const isToday = d.id === currentDayShort;
            const isWorkout = d.type === "workout";

            return (
              <div key={d.id} className="flex flex-col items-center justify-center min-w-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all mx-auto",
                    isToday && isWorkout &&
                      "bg-[#EAF5EE] dark:bg-[#1F7A5A]/30 text-[#1F7A5A] dark:text-[#4CC38A] ring-2 ring-[#1F7A5A]",
                    isToday && !isWorkout &&
                      "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 ring-2 ring-sky-500",
                    !isToday && isWorkout &&
                      "bg-[#0D3B29] dark:bg-[#1E2D24] text-[#4CC38A]",
                    !isToday && !isWorkout &&
                      "bg-neutral-100 dark:bg-neutral-800/60 text-neutral-400"
                  )}
                >
                  {isWorkout ? (
                    <Dumbbell className="w-3.5 h-3.5" />
                  ) : (
                    "R"
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold text-center block w-full mt-1",
                    isToday ? "text-[#1F7A5A] dark:text-[#4CC38A] font-bold" : "text-neutral-500"
                  )}
                >
                  {d.dayShort}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Reusable Component: Smart AI Tools Grid
  // ─────────────────────────────────────────────────────────────
  const SmartToolsSection = () => (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Smart AI Tools
        </h3>
        <span className="text-[11px] font-semibold text-[#1F7A5A] dark:text-[#4CC38A]">
          Personalized for {plan.primaryGoalTitle}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {/* Card 1: AI Meal Scanner */}
        <button
          id="tour-meal-scanner"
          type="button"
          onClick={() => navigate("/nutrition")}
          className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex items-start gap-3.5 text-left hover:border-emerald-500/30 transition-colors group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Utensils className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
                AI Meal Scanner
              </p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A]">
                Instant
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Track against your {plan.dailyCalories} kcal &amp; {plan.macros.protein}g protein targets
            </p>
          </div>
        </button>

        {/* Card 2: AI Form Coach */}
        <button
          type="button"
          onClick={() => navigate("/app/workout/session")}
          className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex items-start gap-3.5 text-left hover:border-emerald-500/30 transition-colors group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Video className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
                Live Rep Counter
              </p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A]">
                Camera
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Real-time rep counting and posture guidance for your lifts
            </p>
          </div>
        </button>

        {/* Card 3: Home & Travel Mode */}
        <button
          type="button"
          onClick={() => navigate("/home-workouts")}
          className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex items-start gap-3.5 text-left hover:border-emerald-500/30 transition-colors group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Box className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
                Home &amp; Travel Mode
              </p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A]">
                Zero Gear
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Hotel and bodyweight adaptations that fit into your day
            </p>
          </div>
        </button>

        {/* Card 4: Community & Leaderboards */}
        <button
          type="button"
          onClick={() => navigate("/gamification")}
          className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex items-start gap-3.5 text-left hover:border-emerald-500/30 transition-colors group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
                Gym Challenges
              </p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A]">
                XP &amp; Badges
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Earn workout XP, maintain streaks, and climb community leaderboards
            </p>
          </div>
        </button>

        {/* Card 5: SmartFit Chatbot */}
        <button
          type="button"
          onClick={() => navigate("/ai-trainer")}
          className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex items-start gap-3.5 text-left hover:border-emerald-500/30 transition-colors group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
                SmartFit AI Advisor
              </p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A]">
                24/7 AI
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Personalized guidance on progressive overload, recovery, and meal timing
            </p>
          </div>
        </button>

        {/* Card 6: 1-on-1 Coaching */}
        <button
          type="button"
          onClick={() => navigate("/pro-coaching")}
          className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 shadow-xs border border-emerald-950/5 dark:border-neutral-800 flex items-start gap-3.5 text-left hover:border-emerald-500/30 transition-colors group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
                1-on-1 Online Coaching
              </p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A]">
                Human Pro
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Personalized programs, WhatsApp accountability, and consultation calls
            </p>
          </div>
        </button>
      </div>
    </section>
  );

  return (
    <div
      className="min-h-dvh flex flex-col lg:flex-row overflow-x-hidden"
      style={{
        backgroundColor: "var(--sf-bg, #F2F7F4)",
        color: "var(--sf-text, #16211C)",
      }}
    >
      {/* ── Desktop Left Sidebar (Only visible on lg screens) ── */}
      <DesktopSidebar
        avatarUrl={profile?.avatar_url || "/prem-avatar.jpg"}
        userName={firstName}
      />

      {/* ── Main Content Area ── */}
      <main className="flex-1 min-w-0 w-full">
        {/* ── Desktop Top Header Bar (lg:flex, hidden on mobile) ── */}
        <header className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-emerald-950/5 dark:border-neutral-800 bg-white/60 dark:bg-[#111413]/60 backdrop-blur-md sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
                {greeting}, {firstName}
              </h1>
              <span className="text-2xl">👋</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A]">
                Level {level}
              </span>
              <span>•</span>
              <span>
                {xp} / {nextLevelXp} XP
              </span>
              <span>•</span>
              <span>{todayDateString}</span>
              <span>•</span>
              <span className="text-[#1F7A5A] dark:text-[#4CC38A] font-semibold">
                Daily Target: {plan.dailyCalories} kcal ({plan.macros.protein}g protein)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleCheckIn}
              className={cn(
                "px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 shadow-2xs active:scale-95 cursor-pointer",
                isCheckedIn
                  ? "bg-[#EAF5EE] dark:bg-[#1E2D24] border-[#1F7A5A] text-[#1F7A5A] dark:text-[#4CC38A]"
                  : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
              )}
            >
              <Building2 className="w-4 h-4 text-[#1F7A5A] dark:text-[#4CC38A]" />
              <span>{isCheckedIn ? "Gym Checked In" : "Check in at gym (+30 XP)"}</span>
            </button>

            <div
              onClick={() => navigate("/app/profile")}
              role="button"
              tabIndex={0}
              className="w-10 h-10 rounded-full overflow-hidden shadow-xs ring-2 ring-emerald-600/20 cursor-pointer active:scale-95 transition-transform"
            >
              <img
                src={profile?.avatar_url || "/prem-avatar.jpg"}
                alt={firstName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* ── Content Container: Responsive Mobile & Desktop Grid ── */}
        <div
          className="w-full max-w-lg lg:max-w-7xl mx-auto px-3.5 sm:px-4 lg:px-8 pt-[max(env(safe-area-inset-top,0px),12px)] lg:pt-8 py-2 lg:py-8"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
          }}
        >
          {/* ── Guest Mode Banner (if previewing plan without login) ── */}
          {!authUser && (
            <div className="mb-4 p-3.5 rounded-2xl bg-[#00FF9C]/10 border border-[#00FF9C]/30 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-4 h-4 text-[#00FF9C] shrink-0" />
                <p className="text-xs text-neutral-900 dark:text-neutral-100 font-medium truncate">
                  Viewing your custom <strong>{plan.primaryGoalTitle}</strong> plan
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/auth?from=dashboard")}
                className="px-3 py-1.5 rounded-xl bg-[#00FF9C] hover:bg-[#00e88c] text-black text-xs font-bold shrink-0 transition-transform active:scale-95 cursor-pointer shadow-sm"
              >
                Save Progress
              </button>
            </div>
          )}

          {/* ── Mobile Native Top Bar (Hidden on desktop) ── */}
          <div className="lg:hidden mb-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00FF9C]/20 to-[#00995E]/10 border border-[#00FF9C]/30 flex items-center justify-center shadow-[0_0_12px_rgba(0,255,156,0.2)]">
                  <Dumbbell className="w-4 h-4 text-[#00FF9C]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold tracking-tight text-white leading-none">
                    SmartFit <span className="text-[#00FF9C]">AI</span>
                  </span>
                  <span className="text-[10px] text-white/50 font-medium tracking-tight mt-0.5">
                    {todayDateString}
                  </span>
                </div>
              </div>

              {/* Tap Avatar to open Athlete Profile */}
              <button
                type="button"
                onClick={() => navigate("/app/profile")}
                aria-label="Profile"
                className="flex items-center gap-2 pl-2.5 pr-1 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              >
                <div className="flex flex-col items-end leading-none">
                  <span className="text-[11px] font-bold text-white max-w-[85px] truncate">{firstName}</span>
                  <span className="text-[9px] font-bold text-[#00FF9C]">Lvl {level}</span>
                </div>
                <div className="w-7 h-7 rounded-full overflow-hidden border border-[#00FF9C]/40 ring-1 ring-[#00FF9C]/20 shadow-xs">
                  <img
                    src={profile?.avatar_url || localStorage.getItem("smartfit_user_avatar") || "/prem-avatar.jpg"}
                    alt={firstName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>
            </div>

            {/* Mobile Greeting & Telemetry Header */}
            <div className="pt-2.5 space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
                {greeting}, <span className="text-[#00FF9C]">{firstName}</span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-white/60 font-medium flex-wrap">
                <span className="flex items-center gap-1 text-[#00FF9C] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#00FF9C] shrink-0 animate-pulse" />
                  Level {level}
                </span>
                <span>•</span>
                <span>{xp} / {nextLevelXp} XP</span>
                <span>•</span>
                <span className="text-white/80">{plan.dailyCalories} kcal target</span>
              </div>
            </div>
          </div>

          {/* ── Mobile Layout (Single Column) ── */}
          <div className="lg:hidden space-y-4">
            <NotificationOptInCard userId={authUser?.id} userName={firstName} />
            <WorkoutHeroCard />
            <Virtual3DTrainerCard />
            <StatsGrid />
            <WeeklyScheduleCard />
            <GymCheckInCard />
            <SmartToolsSection />
          </div>

          {/* ── Desktop Layout (2-Column Grid) ── */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 items-start">
            {/* Left Column (Main Focus: Workout Hero + 3D Virtual Coach + Smart AI Tools) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              <NotificationOptInCard userId={authUser?.id} userName={firstName} />
              <WorkoutHeroCard />
              <Virtual3DTrainerCard />
              <SmartToolsSection />
            </div>

            {/* Right Column (Side Focus: Stats + Gym Check-in + Coach Tip + Weekly Schedule) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-5 sticky top-28">
              <StatsGrid />
              <WeeklyScheduleCard />
              <GymCheckInCard />
            </div>
          </div>
        </div>

        {/* ── First-Time User Interactive Spotlight Tour ── */}
        <AppWalkthroughTour />
      </main>
    </div>
  );
}
