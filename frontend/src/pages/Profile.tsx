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
  Sun,
  Check,
  Scale,
  Ruler,
  Activity,
  Edit2,
  Calendar,
  Loader2,
  X,
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
import { cn } from "@/lib/utils";
import { DesktopSidebar } from "@/components/DesktopSidebar";

type ProfileTab = "summary" | "biometrics" | "workouts" | "progress";

interface DaySchedule {
  day: string;
  short: string;
  type: "done" | "rest" | "session";
  label?: string;
}

const SCHEDULE: DaySchedule[] = [
  { day: "Monday", short: "Mon", type: "done" },
  { day: "Tuesday", short: "Tue", type: "done" },
  { day: "Wednesday", short: "Wed", type: "rest", label: "R" },
  { day: "Thursday", short: "Thu", type: "done" },
  { day: "Friday", short: "Fri", type: "session", label: "4" },
  { day: "Saturday", short: "Sat", type: "rest", label: "R" },
  { day: "Sunday", short: "Sun", type: "rest", label: "R" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("summary");

  // Edit profile dialog
  const [editOpen, setEditOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const loadProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (data) {
          setProfile(data);
          setFullName(data.full_name || authUser?.user_metadata?.full_name || "");
          setBio(data.bio || "");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
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
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id);

      if (error) throw error;
      setProfile((prev: any) => ({ ...prev, full_name: fullName, bio }));
      toast.success("Profile updated successfully!");
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
    "Prem";

  const memberSince = (() => {
    if (profile?.created_at) {
      const date = new Date(profile.created_at);
      return `Member since ${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
    }
    return "Member since Jan 2026";
  })();

  const heightVal = profile?.height_cm || 178;
  const weightVal = profile?.weight_kg || 74;
  const bmiVal = ((weightVal / (heightVal * heightVal)) * 10000).toFixed(1);

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
      className="min-h-dvh flex flex-col lg:flex-row overflow-x-hidden"
      style={{
        backgroundColor: "var(--sf-bg, #F2F7F4)",
        color: "var(--sf-text, #16211C)",
      }}
    >
      <DesktopSidebar
        avatarUrl={profile?.avatar_url || "/prem-avatar.jpg"}
        userName={displayName}
      />

      <main className="flex-1 min-w-0 w-full">
        <div
          className="w-full max-w-md lg:max-w-4xl mx-auto px-4 lg:px-8 py-2 lg:py-6"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
          }}
        >
        {/* ── Top Bar ── */}
        <header className="flex items-center justify-between h-14 mb-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <h1 className="text-xl font-bold tracking-tight">Profile</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/settings")}
              aria-label="Settings"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
            >
              <SettingsIcon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/app/profile")}
              aria-label="Profile Avatar"
              className="w-8 h-8 rounded-full bg-[#0D3B29] text-[#4CC38A] flex items-center justify-center shadow-2xs"
            >
              <User className="w-4 h-4 text-[#4CC38A]" strokeWidth={2.2} />
            </button>
          </div>
        </header>

        {/* ── User Avatar & Header ── */}
        <div className="text-center pt-2 pb-1">
          <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden shadow-sm ring-4 ring-white/80 dark:ring-neutral-800">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src="/height-athlete.png"
                alt={displayName}
                className="w-full h-full object-cover bg-neutral-200 dark:bg-neutral-800"
              />
            )}
          </div>

          <h2 className="text-xl font-bold tracking-tight mt-3 text-neutral-900 dark:text-neutral-100">
            {displayName}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
            {memberSince}
          </p>

          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="px-6 py-2 rounded-xl bg-white dark:bg-[#181D1A] border border-neutral-200/90 dark:border-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-2xs mt-3 mx-auto block hover:bg-neutral-50 dark:hover:bg-neutral-800/60 active:scale-95 transition-all"
          >
            Edit profile
          </button>
        </div>

        {/* ── Tabs Navigation ── */}
        <div className="flex items-center gap-6 border-b border-neutral-200/80 dark:border-neutral-800 mt-5 px-1">
          {[
            { id: "summary" as ProfileTab, label: "Summary" },
            { id: "biometrics" as ProfileTab, label: "Biometrics" },
            { id: "workouts" as ProfileTab, label: "Workouts" },
            { id: "progress" as ProfileTab, label: "Progress" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-2.5 text-sm transition-colors relative whitespace-nowrap",
                  isActive
                    ? "font-bold text-[#1F7A5A] dark:text-[#4CC38A]"
                    : "font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                )}
              >
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#1F7A5A] dark:bg-[#4CC38A] rounded-full" />
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
            <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 border border-emerald-950/5 dark:border-neutral-800 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A] flex items-center justify-center">
                    <Target className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                  <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    My goal
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/settings")}
                  className="text-xs font-bold text-[#1F7A5A] dark:text-[#4CC38A] hover:underline"
                >
                  Change goal
                </button>
              </div>

              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 mt-2.5">
                Build muscle & strength
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                4 gym sessions / week • Upper/lower split
              </p>

              <div className="flex items-center justify-between text-xs mt-3.5">
                <span className="font-bold text-[#1F7A5A] dark:text-[#4CC38A]">
                  On track
                </span>
                <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                  Week 6 of 12
                </span>
              </div>

              <div className="h-1.5 w-full bg-[#EAF5EE] dark:bg-[#1E2D24] rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-[#1F7A5A] dark:bg-[#4CC38A] rounded-full w-[45%]" />
              </div>
            </div>

            {/* Card 2: This Week */}
            <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 border border-emerald-950/5 dark:border-neutral-800 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                  This week
                </h3>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  Week 24
                </span>
              </div>

              {/* 3 Stats Tiles */}
              <div className="bg-[#F0F7F3] dark:bg-[#17221C] rounded-2xl p-3 grid grid-cols-3 gap-2 mt-3 text-center">
                <div>
                  <Dumbbell className="w-4 h-4 mx-auto text-neutral-600 dark:text-neutral-300" />
                  <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mt-1">
                    3 of 4
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                    Workouts
                  </p>
                </div>
                <div>
                  <Clock className="w-4 h-4 mx-auto text-neutral-600 dark:text-neutral-300" />
                  <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mt-1">
                    180 min
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                    Time
                  </p>
                </div>
                <div>
                  <TrendingUp className="w-4 h-4 mx-auto text-neutral-600 dark:text-neutral-300" />
                  <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mt-1">
                    9,450 kg
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                    Volume
                  </p>
                </div>
              </div>

              {/* Daily Schedule */}
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-4 mb-2.5">
                Daily schedule
              </p>

              <div className="flex items-center justify-between px-1">
                {SCHEDULE.map((item) => {
                  return (
                    <div key={item.day} className="flex flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-transform",
                          item.type === "done" &&
                            "bg-[#1F7A5A] dark:bg-[#4CC38A] text-white dark:text-[#0D3B29]",
                          item.type === "rest" &&
                            "bg-[#EAF5EE] dark:bg-[#1E2D24] text-neutral-600 dark:text-neutral-400",
                          item.type === "session" &&
                            "bg-[#D8E9DF] dark:bg-[#25392D] text-[#1F7A5A] dark:text-[#4CC38A]"
                        )}
                      >
                        {item.type === "done" ? (
                          <Check className="w-4 h-4" strokeWidth={3} />
                        ) : (
                          item.label
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
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
            <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 border border-emerald-950/5 dark:border-neutral-800 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                  Achievements
                </h3>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  12 unlocked
                </span>
              </div>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 mt-2">
                {/* Badge 1 */}
                <div className="flex items-center gap-3 py-3">
                  <div className="w-10 h-10 rounded-full bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A] flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
                      100 kg deadlift club
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Unlocked 2 weeks ago
                    </p>
                  </div>
                </div>

                {/* Badge 2 */}
                <div className="flex items-center gap-3 py-3">
                  <div className="w-10 h-10 rounded-full bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A] flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
                      30-day consistency streak
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Active streak on track
                    </p>
                  </div>
                </div>

                {/* Badge 3 */}
                <div className="flex items-center gap-3 py-3">
                  <div className="w-10 h-10 rounded-full bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A] flex items-center justify-center shrink-0">
                    <Sun className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
                      Early riser
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      5 workouts before 8:00 AM
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="w-full h-11 rounded-xl bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A] font-semibold text-xs flex items-center justify-center mt-3 hover:opacity-90 active:scale-95 transition-all"
              >
                View all badges
              </button>
            </div>
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: Biometrics ── */}
        {activeTab === "biometrics" && (
          <div className="mt-4 space-y-4">
            <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 border border-emerald-950/5 dark:border-neutral-800 shadow-xs">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 mb-3">
                Current Body Metrics
              </h3>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-[#F0F7F3] dark:bg-[#17221C]">
                  <Scale className="w-4 h-4 mx-auto text-[#1F7A5A] dark:text-[#4CC38A]" />
                  <p className="font-bold text-base mt-1">{weightVal} kg</p>
                  <p className="text-[11px] text-neutral-500">Weight</p>
                </div>
                <div className="p-3 rounded-xl bg-[#F0F7F3] dark:bg-[#17221C]">
                  <Ruler className="w-4 h-4 mx-auto text-[#1F7A5A] dark:text-[#4CC38A]" />
                  <p className="font-bold text-base mt-1">{heightVal} cm</p>
                  <p className="text-[11px] text-neutral-500">Height</p>
                </div>
                <div className="p-3 rounded-xl bg-[#F0F7F3] dark:bg-[#17221C]">
                  <Activity className="w-4 h-4 mx-auto text-[#1F7A5A] dark:text-[#4CC38A]" />
                  <p className="font-bold text-base mt-1">{bmiVal}</p>
                  <p className="text-[11px] text-neutral-500">BMI (Normal)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: Workouts ── */}
        {activeTab === "workouts" && (
          <div className="mt-4 space-y-4">
            <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 border border-emerald-950/5 dark:border-neutral-800 shadow-xs">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 mb-2">
                Recent Training Sessions
              </h3>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Full Body Hypertrophy</p>
                    <p className="text-xs text-neutral-500">Yesterday • 52 min • 8 exercises</p>
                  </div>
                  <span className="text-xs font-bold text-[#1F7A5A] dark:text-[#4CC38A]">Completed</span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Upper Body Strength A</p>
                    <p className="text-xs text-neutral-500">3 days ago • 45 min • 6 exercises</p>
                  </div>
                  <span className="text-xs font-bold text-[#1F7A5A] dark:text-[#4CC38A]">Completed</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: Progress ── */}
        {activeTab === "progress" && (
          <div className="mt-4 space-y-4">
            <div className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 border border-emerald-950/5 dark:border-neutral-800 shadow-xs">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 mb-1">
                Monthly Volume Trend
              </h3>
              <p className="text-xs text-neutral-500 mb-4">
                Total load lifted across all completed sets
              </p>
              <div className="h-28 flex items-end justify-between gap-2 px-2 pt-2">
                {[
                  { w: "W1", h: "45%" },
                  { w: "W2", h: "60%" },
                  { w: "W3", h: "75%" },
                  { w: "W4", h: "90%" },
                ].map((item) => (
                  <div key={item.w} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div
                      className="w-full bg-[#1F7A5A] dark:bg-[#4CC38A] rounded-t-lg transition-all"
                      style={{ height: item.h }}
                    />
                    <span className="text-[11px] text-neutral-500 font-semibold">{item.w}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* ── Edit Profile Modal ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-[#1F7A5A]" /> Edit Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Update your athlete information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-3.5 mt-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F7A5A]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Bio / Status
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your fitness journey..."
                rows={3}
                className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F7A5A] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full h-11 rounded-xl font-semibold text-sm bg-[#0D3B29] text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
