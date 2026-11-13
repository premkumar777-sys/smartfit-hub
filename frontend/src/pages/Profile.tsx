import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  User,
  Target,
  Dumbbell,
  Clock,
  TrendingUp,
  Trophy,
  Flame,
  Check,
  Scale,
  Ruler,
  Activity,
  Edit2,
  Calendar,
  Loader2,
  X,
  LogOut,
  Sparkles,
  ChevronRight,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useGamification } from "@/hooks/useGamification";
import { updateOnboardingDraft } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { DesktopSidebar } from "@/components/DesktopSidebar";

type ProfileTab = "summary" | "biometrics" | "workouts";

const FITNESS_GOALS = [
  "Build muscle & strength",
  "Lose fat & get lean",
  "Improve endurance & stamina",
  "Maintain weight & stay active",
  "Functional mobility & agility",
];

const PRESET_AVATARS = [
  "/prem-avatar.jpg",
  "/workouts/upper_body_male.jpg",
  "/workouts/lower_body_male.jpg",
  "/workouts/upper_body_female.jpg",
  "/workouts/lower_body_female.jpg",
  "/height-athlete.png",
];

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const gamification = useGamification();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("summary");

  // Edit profile dialog
  const [editOpen, setEditOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [height, setHeight] = useState<number | string>(178);
  const [weight, setWeight] = useState<number | string>(74);
  const [age, setAge] = useState<number | string>(26);
  const [fitnessGoal, setFitnessGoal] = useState("Build muscle & strength");
  const [avatarUrl, setAvatarUrl] = useState("/prem-avatar.jpg");
  const [savingProfile, setSavingProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("smartfit_biometric_active_user");
      sessionStorage.removeItem("smartfit_checkin_prompted");
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out");
    }
  };

  useEffect(() => {
    const loadProfile = async (userId: string) => {
      try {
        // 1. Load user profile from Supabase
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (data) {
          setProfile(data);
          const loadedName = data.full_name || authUser?.user_metadata?.full_name || "";
          const loadedAvatar = data.avatar_url || authUser?.user_metadata?.avatar_url || "/prem-avatar.jpg";
          setFullName(loadedName);
          setBio(data.bio || "");
          setHeight(Number(data.height) || Number(data.height_cm) || 178);
          setWeight(Number(data.weight) || Number(data.weight_kg) || 74);
          setAge(Number(data.age) || 26);
          setFitnessGoal(data.fitness_goal || "Build muscle & strength");
          setAvatarUrl(loadedAvatar);

          if (loadedName) {
            localStorage.setItem("smartfit_profile_name", loadedName);
          }
          if (loadedAvatar) {
            localStorage.setItem("smartfit_user_avatar", loadedAvatar);
          }
        }

        // 2. Load completed workouts telemetry from Supabase
        const { data: workoutsData, error: workoutsErr } = await supabase
          .from("completed_workouts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(25);

        if (!workoutsErr && workoutsData && workoutsData.length > 0) {
          setWorkouts(workoutsData);
        } else {
          // Local storage fallback for offline / guest migration
          const savedWorkouts = localStorage.getItem("smartfit_completed_workouts_v1");
          if (savedWorkouts) {
            try {
              setWorkouts(JSON.parse(savedWorkouts));
            } catch (e) {
              console.warn("Could not parse local workouts:", e);
            }
          }
        }
      } catch (err) {
        console.error("Error loading profile from Supabase:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (!authUser) {
        navigate("/auth");
      } else {
        loadProfile(authUser.id);
      }
    }
  }, [authUser, authLoading, navigate]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    setSavingProfile(true);

    try {
      const parsedHeight = Number(height) || 178;
      const parsedWeight = Number(weight) || 74;
      const parsedAge = Number(age) || 26;

      const updates: Record<string, any> = {
        full_name: fullName.trim(),
        bio: bio.trim(),
        height: parsedHeight,
        weight: parsedWeight,
        age: parsedAge,
        fitness_goal: fitnessGoal,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", authUser.id);

      if (error) throw error;

      setProfile((prev: any) => ({
        ...prev,
        ...updates,
      }));

      // Synchronize with local onboarding state so workout calculations across the app remain synced
      if (fullName.trim()) {
        localStorage.setItem("smartfit_profile_name", fullName.trim());
      }
      if (avatarUrl) {
        localStorage.setItem("smartfit_user_avatar", avatarUrl);
      }
      updateOnboardingDraft({
        goals: [fitnessGoal],
        metrics: {
          age: parsedAge,
          height: parsedHeight,
          weight: parsedWeight,
          units: "metric",
        },
      });

      toast.success("Profile updated in Supabase!");
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const displayName =
    profile?.full_name ||
    authUser?.user_metadata?.full_name ||
    profile?.username ||
    "Athlete";

  const memberSince = (() => {
    if (profile?.created_at) {
      const date = new Date(profile.created_at);
      return `Member since ${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
    }
    return "Member since Jan 2026";
  })();

  const heightVal = Number(profile?.height) || Number(profile?.height_cm) || 178;
  const weightVal = Number(profile?.weight) || Number(profile?.weight_kg) || 74;
  const ageVal = Number(profile?.age) || 26;
  const genderVal = profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : "Athlete";
  const goalVal = profile?.fitness_goal || "Build muscle & strength";
  const dailyCalories = profile?.daily_calories_target || 2450;

  // Safe BMI calculation
  const bmiNumber = weightVal / ((heightVal / 100) * (heightVal / 100));
  const bmiVal = isNaN(bmiNumber) || !isFinite(bmiNumber) ? "23.4" : bmiNumber.toFixed(1);

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-amber-400" };
    if (bmi < 25) return { label: "Normal (Athletic)", color: "text-[#00FF9C]" };
    if (bmi < 30) return { label: "Overweight / Bulking", color: "text-cyan-400" };
    return { label: "High Density", color: "text-purple-400" };
  };

  const bmiCategory = getBmiCategory(Number(bmiVal));

  // Dynamic Weekly Stats calculation
  const weeklyWorkoutsCount = Math.max(
    workouts.filter((w) => {
      const workoutDate = new Date(w.date || w.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - workoutDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length,
    gamification.totalWorkouts > 0 ? Math.min(gamification.totalWorkouts, 4) : 0
  );

  const weeklyTimeMinutes = workouts.reduce((acc, curr) => {
    const mins = parseInt(curr.duration, 10) || 45;
    return acc + mins;
  }, 0) || 180;

  const weeklyVolumeKg = workouts.reduce((acc, curr) => {
    const vol = Number(curr.volume) || 0;
    return acc + vol;
  }, 0) || 9450;

  // Weekly Schedule items
  const dayNames = [
    { day: "Monday", short: "Mon" },
    { day: "Tuesday", short: "Tue" },
    { day: "Wednesday", short: "Wed" },
    { day: "Thursday", short: "Thu" },
    { day: "Friday", short: "Fri" },
    { day: "Saturday", short: "Sat" },
    { day: "Sunday", short: "Sun" },
  ];

  const currentDayIndex = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  if (authLoading || loading) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ backgroundColor: "var(--sf-bg, #080A0C)" }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-[#00FF9C]" />
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh flex flex-col lg:flex-row overflow-x-hidden"
      style={{
        backgroundColor: "var(--sf-bg, #080A0C)",
        color: "var(--sf-text, #F0F4F2)",
      }}
    >
      <DesktopSidebar
        avatarUrl={profile?.avatar_url || avatarUrl}
        userName={displayName}
      />

      <main className="flex-1 min-w-0 w-full">
        <div
          className="w-full max-w-full sm:max-w-xl lg:max-w-4xl mx-auto px-3.5 sm:px-4 lg:px-8 pt-2 sm:pt-4 lg:pt-6"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 130px)",
          }}
        >
          {/* ── Top Bar ── */}
          <header className="flex items-center justify-between h-14 mb-2 pt-[max(env(safe-area-inset-top,0px),0px)] shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Back"
                className="flex items-center justify-center w-10 h-10 -ml-1 rounded-full hover:bg-white/5 active:scale-95 transition-transform cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" strokeWidth={2.2} />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Profile</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/settings")}
                aria-label="Settings"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5 active:scale-95 transition-transform cursor-pointer"
              >
                <SettingsIcon className="w-5 h-5 text-white/70 hover:text-white" strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={() => setEditOpen(true)}
                aria-label="Profile Avatar"
                className="w-9 h-9 rounded-full bg-[#00FF9C]/10 border border-[#00FF9C]/30 text-[#00FF9C] flex items-center justify-center shadow-xs overflow-hidden cursor-pointer"
              >
                {profile?.avatar_url || avatarUrl ? (
                  <img
                    src={profile?.avatar_url || avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-[#00FF9C]" strokeWidth={2.2} />
                )}
              </button>
            </div>
          </header>

          {/* ── User Avatar & Header Card ── */}
          <div className="text-center pt-2 pb-2">
            <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden shadow-lg ring-4 ring-[#00FF9C]/20 border-2 border-[#00FF9C]/40 group">
              <img
                src={profile?.avatar_url || avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/prem-avatar.jpg";
                }}
              />
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-3 text-white">
              {displayName}
            </h2>
            <p className="text-xs text-white/50 mt-0.5 font-medium">
              {memberSince}
            </p>

            {profile?.bio && (
              <p className="text-xs text-white/70 max-w-sm mx-auto mt-2 italic px-4">
                "{profile.bio}"
              </p>
            )}

            {/* Action Buttons: Edit Profile & Sign Out */}
            <div className="flex items-center justify-center gap-2.5 mt-3.5">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#00FF9C]" />
                <span>Edit profile</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-xs font-semibold text-red-400 shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Sign out</span>
              </button>
            </div>
          </div>

          {/* ── Tabs Navigation (Summary | Biometrics | Workouts) ── */}
          <div className="flex items-center gap-6 border-b border-white/10 mt-5 px-1">
            {[
              { id: "summary" as ProfileTab, label: "Summary" },
              { id: "biometrics" as ProfileTab, label: "Biometrics" },
              { id: "workouts" as ProfileTab, label: "Workouts" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "pb-2.5 text-sm transition-colors relative whitespace-nowrap cursor-pointer",
                    isActive
                      ? "font-bold text-[#00FF9C]"
                      : "font-medium text-white/50 hover:text-white"
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#00FF9C] rounded-full shadow-[0_0_8px_#00FF9C]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── TAB CONTENT: Summary ── */}
          {activeTab === "summary" && (
            <div className="mt-4 space-y-4 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0 items-start">
              <div className="lg:col-span-7 space-y-4">
                {/* Card 1: My Goal */}
                <div className="bg-[#121614] rounded-2xl p-4 sm:p-5 border border-white/10 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#00FF9C]/10 text-[#00FF9C] flex items-center justify-center">
                        <Target className="w-4 h-4" strokeWidth={2.2} />
                      </div>
                      <span className="text-xs font-semibold text-white/60">
                        My goal
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditOpen(true)}
                      className="text-xs font-bold text-[#00FF9C] hover:underline cursor-pointer"
                    >
                      Change goal
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-white mt-2.5">
                    {goalVal}
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    {profile?.preferences?.trainingDays?.length || 4} gym sessions / week • Smart AI Split
                  </p>

                  <div className="flex items-center justify-between text-xs mt-3.5">
                    <span className="font-bold text-[#00FF9C]">
                      Active Protocol
                    </span>
                    <span className="text-white/60 font-medium">
                      Level {gamification.level} Athlete
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-[#00FF9C] rounded-full transition-all duration-500 shadow-[0_0_8px_#00FF9C]"
                      style={{ width: `${Math.min(100, Math.max(25, (gamification.xp / (gamification.nextLevelXp || 1000)) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Card 2: This Week */}
                <div className="bg-[#121614] rounded-2xl p-4 sm:p-5 border border-white/10 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-white">
                      This week
                    </h3>
                    <span className="text-xs text-white/50 font-medium">
                      {gamification.currentStreak} Day Streak 🔥
                    </span>
                  </div>

                  {/* 3 Stats Tiles */}
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 grid grid-cols-3 gap-2 mt-3 text-center">
                    <div>
                      <Dumbbell className="w-4 h-4 mx-auto text-[#00FF9C]" />
                      <p className="font-bold text-sm text-white mt-1">
                        {weeklyWorkoutsCount} of 4
                      </p>
                      <p className="text-[11px] text-white/50 font-medium">
                        Workouts
                      </p>
                    </div>
                    <div>
                      <Clock className="w-4 h-4 mx-auto text-[#00FF9C]" />
                      <p className="font-bold text-sm text-white mt-1">
                        {weeklyTimeMinutes} min
                      </p>
                      <p className="text-[11px] text-white/50 font-medium">
                        Time
                      </p>
                    </div>
                    <div>
                      <TrendingUp className="w-4 h-4 mx-auto text-[#00FF9C]" />
                      <p className="font-bold text-sm text-white mt-1">
                        {weeklyVolumeKg.toLocaleString()} kg
                      </p>
                      <p className="text-[11px] text-white/50 font-medium">
                        Volume
                      </p>
                    </div>
                  </div>

                  {/* Daily Schedule */}
                  <p className="text-xs text-white/50 font-medium mt-4 mb-2.5">
                    Weekly training schedule
                  </p>

                  <div className="flex items-center justify-between px-1">
                    {dayNames.map((item, idx) => {
                      const isPastOrToday = idx <= currentDayIndex;
                      const isToday = idx === currentDayIndex;
                      return (
                        <div key={item.day} className="flex flex-col items-center gap-1.5">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-transform",
                              isToday
                                ? "bg-[#00FF9C] text-black ring-2 ring-[#00FF9C]/50 shadow-[0_0_10px_#00FF9C]"
                                : isPastOrToday
                                ? "bg-[#00FF9C]/20 text-[#00FF9C] border border-[#00FF9C]/40"
                                : "bg-white/5 text-white/40 border border-white/5"
                            )}
                          >
                            {isPastOrToday ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : "R"}
                          </div>
                          <span
                            className={cn(
                              "text-[11px] font-medium",
                              isToday ? "text-[#00FF9C] font-bold" : "text-white/50"
                            )}
                          >
                            {item.short}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Achievements (Card 3) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#121614] rounded-2xl p-4 sm:p-5 border border-white/10 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-white">
                      Achievements
                    </h3>
                    <span className="text-xs text-[#00FF9C] font-semibold">
                      Level {gamification.level}
                    </span>
                  </div>

                  <div className="divide-y divide-white/5 mt-2">
                    {/* Badge 1: Streak */}
                    <div className="flex items-center gap-3 py-3">
                      <div className="w-10 h-10 rounded-full bg-[#00FF9C]/10 text-[#00FF9C] flex items-center justify-center shrink-0 border border-[#00FF9C]/20">
                        <Flame className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-white leading-snug">
                          {gamification.currentStreak || 1} Day Streak Champion
                        </p>
                        <p className="text-xs text-white/50 mt-0.5">
                          Active consistency record
                        </p>
                      </div>
                    </div>

                    {/* Badge 2: Workouts Completed */}
                    <div className="flex items-center gap-3 py-3">
                      <div className="w-10 h-10 rounded-full bg-[#00FF9C]/10 text-[#00FF9C] flex items-center justify-center shrink-0 border border-[#00FF9C]/20">
                        <Trophy className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-white leading-snug">
                          {workouts.length > 0 ? `${workouts.length} Sessions Logged` : "100 kg Deadlift Club"}
                        </p>
                        <p className="text-xs text-white/50 mt-0.5">
                          Verified strength achievement
                        </p>
                      </div>
                    </div>

                    {/* Badge 3: Athlete Calibration */}
                    <div className="flex items-center gap-3 py-3">
                      <div className="w-10 h-10 rounded-full bg-[#00FF9C]/10 text-[#00FF9C] flex items-center justify-center shrink-0 border border-[#00FF9C]/20">
                        <Zap className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-white leading-snug">
                          Mifflin-St Jeor Calibrated
                        </p>
                        <p className="text-xs text-white/50 mt-0.5">
                          {dailyCalories} kcal daily target active
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/gamification")}
                    className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#00FF9C] font-semibold text-xs flex items-center justify-center mt-3 active:scale-95 transition-all cursor-pointer"
                  >
                    View gamification & XP details
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB CONTENT: Biometrics ── */}
          {activeTab === "biometrics" && (
            <div className="mt-4 space-y-4">
              <div className="bg-[#121614] rounded-2xl p-4 sm:p-5 border border-white/10 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base text-white">
                      Current Body Telemetry
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Synchronized with Supabase profile
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#00FF9C]/10 border border-[#00FF9C]/30 text-[#00FF9C] text-xs font-bold hover:bg-[#00FF9C]/20 transition-colors cursor-pointer"
                  >
                    Update Stats
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <Scale className="w-4 h-4 mx-auto text-[#00FF9C]" />
                    <p className="font-bold text-lg text-white mt-1">{weightVal} kg</p>
                    <p className="text-[11px] text-white/50 font-medium">Body Weight</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <Ruler className="w-4 h-4 mx-auto text-[#00FF9C]" />
                    <p className="font-bold text-lg text-white mt-1">{heightVal} cm</p>
                    <p className="text-[11px] text-white/50 font-medium">Height</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <Activity className="w-4 h-4 mx-auto text-[#00FF9C]" />
                    <p className="font-bold text-lg text-white mt-1">{bmiVal}</p>
                    <p className={cn("text-[11px] font-semibold", bmiCategory.color)}>
                      {bmiCategory.label}
                    </p>
                  </div>
                </div>

                {/* Additional Metrics Row */}
                <div className="grid grid-cols-3 gap-2.5 text-center mt-2.5">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="font-bold text-base text-white">{ageVal} yrs</p>
                    <p className="text-[11px] text-white/50 font-medium">Age</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="font-bold text-base text-white">{genderVal}</p>
                    <p className="text-[11px] text-white/50 font-medium">Gender</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="font-bold text-base text-[#00FF9C]">{dailyCalories}</p>
                    <p className="text-[11px] text-white/50 font-medium">Target kcal</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB CONTENT: Workouts ── */}
          {activeTab === "workouts" && (
            <div className="mt-4 space-y-4">
              <div className="bg-[#121614] rounded-2xl p-4 sm:p-5 border border-white/10 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-base text-white">
                      Workout History ({workouts.length})
                    </h3>
                    <p className="text-xs text-white/50">
                      Logged training telemetry from Supabase
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/app/today")}
                    className="px-3 py-1.5 rounded-xl bg-[#00FF9C] text-black font-bold text-xs hover:bg-[#00e58a] transition-all cursor-pointer shadow-xs"
                  >
                    Start Workout
                  </button>
                </div>

                {workouts.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {workouts.map((w, idx) => (
                      <div key={w.id || idx} className="py-3.5 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm text-white">{w.routine_name || w.routineName || "Custom Workout Session"}</p>
                          <p className="text-xs text-white/50 mt-0.5">
                            {w.date || (w.created_at ? new Date(w.created_at).toLocaleDateString() : "Recent")} • {w.duration || "45 min"} • {w.volume ? `${w.volume} kg` : "Strength"}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#00FF9C]/10 text-[#00FF9C] border border-[#00FF9C]/20 shrink-0">
                          Completed
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4 bg-white/[0.02] rounded-2xl border border-white/5 mt-2">
                    <Dumbbell className="w-10 h-10 mx-auto text-white/30 mb-2" />
                    <p className="font-bold text-sm text-white">No workouts recorded yet</p>
                    <p className="text-xs text-white/50 max-w-xs mx-auto mt-1 mb-4">
                      Complete your first AI guided session to unlock real-time volume, calories, and performance graphs.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/app/today")}
                      className="px-5 py-2.5 rounded-xl bg-[#00FF9C] text-black font-bold text-xs hover:bg-[#00e58a] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,156,0.3)]"
                    >
                      Start Today's Workout →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Edit Profile Modal (Full Supabase Sync) ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-[#121614] border border-white/10 text-white max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <Edit2 className="w-5 h-5 text-[#00FF9C]" /> Edit Athlete Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-white/60">
              Update your body metrics and details. All changes save directly to Supabase.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 mt-3">
            {/* Full Name */}
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-[#00FF9C] focus:ring-1 focus:ring-[#00FF9C]"
              />
            </div>

            {/* Avatar Preset Picker */}
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1.5">
                Choose Athlete Avatar
              </label>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatarUrl(src)}
                    className={cn(
                      "w-11 h-11 rounded-full overflow-hidden border-2 transition-all shrink-0 cursor-pointer",
                      avatarUrl === src
                        ? "border-[#00FF9C] scale-105 shadow-[0_0_10px_#00FF9C]"
                        : "border-white/15 opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={src} alt="Avatar option" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Bio / Fitness Statement
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Dedicated to progressive overload and clean nutrition..."
                rows={2}
                className="w-full p-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-[#00FF9C] focus:ring-1 focus:ring-[#00FF9C] resize-none"
              />
            </div>

            {/* Fitness Goal */}
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Primary Fitness Goal
              </label>
              <select
                value={fitnessGoal}
                onChange={(e) => setFitnessGoal(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-[#17201a] text-sm text-white focus:outline-none focus:border-[#00FF9C]"
              >
                {FITNESS_GOALS.map((g) => (
                  <option key={g} value={g} className="bg-[#121614] text-white">
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Body Metrics Grid (Height, Weight, Age) */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min={100}
                  max={250}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white text-center focus:outline-none focus:border-[#00FF9C]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  min={30}
                  max={250}
                  step={0.5}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white text-center focus:outline-none focus:border-[#00FF9C]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1">
                  Age (yrs)
                </label>
                <input
                  type="number"
                  min={14}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white text-center focus:outline-none focus:border-[#00FF9C]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full h-12 rounded-xl font-bold text-sm bg-[#00FF9C] hover:bg-[#00e58a] text-black active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-[0_0_15px_rgba(0,255,156,0.3)]"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving to Supabase...
                </>
              ) : (
                "Save Changes to Supabase"
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Sign Out Confirmation ── */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-[#121614] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <LogOut className="w-5 h-5 text-red-400" /> Sign out of SmartFit AI?
            </DialogTitle>
            <DialogDescription className="text-xs text-white/60 pt-1.5 leading-relaxed">
              You will need to sign back in with your email or Google account to view your custom workouts and nutrition history.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLogoutConfirm(false);
                handleLogout();
              }}
              className="flex-1 h-11 rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)]"
            >
              Sign out
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
