import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  User,
  Minus,
  Plus,
  Fingerprint,
  Calendar,
  ArrowUpRight,
  LogOut,
  Check,
  Loader2,
  X,
  Lock,
  Cookie,
  ShieldCheck,
} from "lucide-react";
import { openCookiePreferencesModal } from "@/lib/cookieConsent";
import { Switch } from "@/components/ui/switch";
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
import { useSubscription } from "@/hooks/useSubscription";
import {
  isBiometricsAvailable,
  isBiometricRegistered,
  registerBiometric,
  removeBiometric,
} from "@/lib/biometrics";
import { cn } from "@/lib/utils";
import { DesktopSidebar } from "@/components/DesktopSidebar";

interface UserPreferences {
  units?: "metric" | "imperial";
  fitnessGoal?: string;
  activityLevel?: string;
  weeklyTarget?: number;
  coachingTone?: string;
  voiceCoach?: boolean;
  theme?: "light" | "dark";
  notifications?: { email?: boolean; push?: boolean; streakReminder?: boolean };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  units: "metric",
  fitnessGoal: "Build muscle & strength",
  activityLevel: "Advanced (4+ sessions)",
  weeklyTarget: 4,
  coachingTone: "Supportive & analytical",
  voiceCoach: true,
};

const GOAL_OPTIONS = [
  "Build muscle & strength",
  "Lose fat & get lean",
  "Improve endurance & stamina",
  "Maintain weight & stay active",
  "Functional mobility & agility",
];

const ACTIVITY_OPTIONS = [
  "Beginner (1-2 sessions)",
  "Moderate (2-3 sessions)",
  "Advanced (4+ sessions)",
  "Elite athlete (5-6 sessions)",
];

const COACHING_TONES = [
  "Supportive & analytical",
  "Motivational & energetic",
  "Direct & no-nonsense",
  "Calm & mindful",
  "Tough love & disciplined",
];

export default function Settings() {
  const navigate = useNavigate();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { plan, hasPremiumAccess } = useSubscription();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Biometrics
  const [isFingerprintEnabled, setIsFingerprintEnabled] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);

  // Dialog states
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [unitsModalOpen, setUnitsModalOpen] = useState(false);
  const [toneModalOpen, setToneModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // Load preferences & profile from Supabase
  useEffect(() => {
    isBiometricsAvailable().then((supported) => {
      setIsBiometricSupported(supported);
    });
  }, []);

  useEffect(() => {
    if (authUser?.email) {
      setIsFingerprintEnabled(isBiometricRegistered(authUser.email));
    }
  }, [authUser]);

  useEffect(() => {
    const loadData = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, username, avatar_url, preferences, bio")
          .eq("id", userId)
          .single();

        if (data) {
          setProfile(data);
          if (data.preferences) {
            setPreferences((prev) => ({
              ...prev,
              ...(data.preferences as Record<string, any>),
            }));
          }
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (!authUser) {
        navigate("/auth");
      } else {
        loadData(authUser.id);
      }
    }
  }, [authUser, authLoading, navigate]);

  // Persist preference updates
  const savePreference = async (updated: Partial<UserPreferences>) => {
    const nextPrefs = { ...preferences, ...updated };
    setPreferences(nextPrefs);

    if (!authUser) return;
    try {
      await supabase.from("profiles").upsert(
        {
          id: authUser.id,
          preferences: nextPrefs,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (err: any) {
      console.error("Failed to auto-save preference:", err);
    }
  };

  // Stepper handlers
  const handleDecrementWeekly = () => {
    const current = preferences.weeklyTarget ?? 4;
    if (current > 1) {
      savePreference({ weeklyTarget: current - 1 });
    }
  };

  const handleIncrementWeekly = () => {
    const current = preferences.weeklyTarget ?? 4;
    if (current < 7) {
      savePreference({ weeklyTarget: current + 1 });
    }
  };

  // Biometrics toggle
  const handleToggleFingerprint = async (checked: boolean) => {
    if (!authUser?.email) return;
    setFingerprintLoading(true);
    try {
      if (checked) {
        await registerBiometric(authUser.email);
        setIsFingerprintEnabled(true);
        toast.success("Fingerprint authentication enabled! 🔑");
      } else {
        removeBiometric(authUser.email);
        setIsFingerprintEnabled(false);
        toast.info("Fingerprint login disabled on this device.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update biometric login");
      setIsFingerprintEnabled(isBiometricRegistered(authUser.email));
    } finally {
      setFingerprintLoading(false);
    }
  };

  // Password update
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setPasswordModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setChangingPw(false);
    }
  };

  // Sign out
  const handleLogout = async () => {
    localStorage.removeItem("smartfit_biometric_active_user");
    sessionStorage.removeItem("smartfit_checkin_prompted");
    await supabase.auth.signOut();
    navigate("/");
  };

  const displayName =
    profile?.full_name ||
    authUser?.user_metadata?.full_name ||
    profile?.username ||
    "Alex Morgan";

  const displayEmail =
    authUser?.email ||
    authUser?.user_metadata?.email ||
    "alex.morgan@smartfit.ai";

  const isPro = hasPremiumAccess || plan?.plan_name?.toLowerCase().includes("pro");

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
          className="w-full max-w-full sm:max-w-xl lg:max-w-3xl mx-auto px-3.5 sm:px-4 lg:px-8 pt-2 sm:pt-4 lg:pt-6"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 130px)",
          }}
        >
        {/* ── Top Bar ── */}
        <header className="flex items-center justify-between h-14 mb-3 pt-[max(env(safe-area-inset-top,0px),0px)] shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="flex items-center justify-center w-10 h-10 -ml-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-800 dark:text-neutral-200" strokeWidth={2.2} />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Settings</h1>
          </div>

          <button
            type="button"
            onClick={() => navigate("/app/profile")}
            aria-label="View Profile"
            className="w-9 h-9 rounded-full bg-[#0D3B29] text-[#4CC38A] flex items-center justify-center hover:opacity-90 active:scale-95 transition-transform shadow-xs overflow-hidden cursor-pointer"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-[#4CC38A]" strokeWidth={2.2} />
            )}
          </button>
        </header>

        {/* ── Profile Header Card ── */}
        <div
          onClick={() => navigate("/app/profile")}
          role="button"
          tabIndex={0}
          className="bg-white dark:bg-[#181D1A] rounded-2xl p-4 flex items-center justify-between border border-emerald-950/5 dark:border-neutral-800 shadow-xs mb-5 cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#E5F3EB] dark:bg-[#1E2D24] text-[#1E5C41] dark:text-[#4CC38A] flex items-center justify-center shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6" strokeWidth={2} />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm leading-tight truncate">
                {displayName}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                {displayEmail}
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#EAF5EE] dark:bg-[#1E3326] text-[#1D6A48] dark:text-[#52D696] border border-[#D5EEDB] dark:border-[#2A4B38] shrink-0">
            {isPro ? "Pro athlete" : "Active athlete"}
          </span>
        </div>

        {/* ── SECTION: Training ── */}
        <section className="mb-5">
          <h2 className="text-sm font-bold tracking-tight mb-2 px-1 text-neutral-900 dark:text-neutral-100">
            Training
          </h2>
          <div className="bg-white dark:bg-[#181D1A] rounded-2xl border border-emerald-950/5 dark:border-neutral-800 shadow-xs divide-y divide-neutral-100 dark:divide-neutral-800/70 overflow-hidden">
            {/* Goal */}
            <button
              type="button"
              onClick={() => setGoalModalOpen(true)}
              className="w-full flex items-center justify-between p-4 min-h-[64px] text-left hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 active:bg-neutral-100/60 transition-colors"
            >
              <div>
                <p className="font-semibold text-sm leading-snug">Goal</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {preferences.fitnessGoal || "Build muscle & strength"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
            </button>

            {/* Activity Level */}
            <button
              type="button"
              onClick={() => setActivityModalOpen(true)}
              className="w-full flex items-center justify-between p-4 min-h-[64px] text-left hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 active:bg-neutral-100/60 transition-colors"
            >
              <div>
                <p className="font-semibold text-sm leading-snug">Activity level</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {preferences.activityLevel || "Advanced (4+ sessions)"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
            </button>

            {/* Weekly Target Stepper */}
            <div className="flex items-center justify-between p-4 min-h-[64px]">
              <div>
                <p className="font-semibold text-sm leading-snug">Weekly target</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {preferences.weeklyTarget ?? 4} workouts / week
                </p>
              </div>

              <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-neutral-50/50 dark:bg-neutral-800/40 h-8 shadow-2xs">
                <button
                  type="button"
                  onClick={handleDecrementWeekly}
                  aria-label="Decrease target workouts"
                  className="w-8 h-full flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 active:scale-95 transition-transform"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-bold text-sm text-neutral-900 dark:text-neutral-100 select-none">
                  {preferences.weeklyTarget ?? 4}
                </span>
                <button
                  type="button"
                  onClick={handleIncrementWeekly}
                  aria-label="Increase target workouts"
                  className="w-8 h-full flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 active:scale-95 transition-transform"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Units */}
            <button
              type="button"
              onClick={() => setUnitsModalOpen(true)}
              className="w-full flex items-center justify-between p-4 min-h-[64px] text-left hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 active:bg-neutral-100/60 transition-colors"
            >
              <div>
                <p className="font-semibold text-sm leading-snug">Units</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {preferences.units === "imperial"
                    ? "Imperial (lb, ft)"
                    : "Metric (kg, cm)"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
            </button>
          </div>
        </section>

        {/* ── SECTION: Coach ── */}
        <section className="mb-5">
          <h2 className="text-sm font-bold tracking-tight mb-2 px-1 text-neutral-900 dark:text-neutral-100">
            Coach
          </h2>
          <div className="bg-white dark:bg-[#181D1A] rounded-2xl border border-emerald-950/5 dark:border-neutral-800 shadow-xs divide-y divide-neutral-100 dark:divide-neutral-800/70 overflow-hidden">
            {/* Coaching Tone */}
            <button
              type="button"
              onClick={() => setToneDialogOpen(true)}
              className="w-full flex items-center justify-between p-4 min-h-[64px] text-left hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 active:bg-neutral-100/60 transition-colors"
            >
              <div>
                <p className="font-semibold text-sm leading-snug">Coaching tone</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {preferences.coachingTone || "Supportive & analytical"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
            </button>

            {/* Voice Coach Toggle */}
            <div className="flex items-center justify-between p-4 min-h-[64px]">
              <div className="pr-3">
                <p className="font-semibold text-sm leading-snug">Voice coach</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                  Provides audio cues during sets and rest intervals
                </p>
              </div>
              <Switch
                checked={preferences.voiceCoach !== false}
                onCheckedChange={(val) => savePreference({ voiceCoach: val })}
                className="shrink-0 data-[state=checked]:!bg-[#0D3B29] dark:data-[state=checked]:!bg-[#1F7A5A]"
                aria-label="Toggle voice coach audio cues"
              />
            </div>
          </div>
        </section>

        {/* ── SECTION: Security ── */}
        <section className="mb-5">
          <h2 className="text-sm font-bold tracking-tight mb-2 px-1 text-neutral-900 dark:text-neutral-100">
            Security
          </h2>
          <div className="bg-white dark:bg-[#181D1A] rounded-2xl border border-emerald-950/5 dark:border-neutral-800 shadow-xs divide-y divide-neutral-100 dark:divide-neutral-800/70 overflow-hidden">
            {/* Fingerprint Login */}
            <div className="flex items-center justify-between p-4 min-h-[64px]">
              <div className="flex items-center gap-3 pr-2 min-w-0">
                <Fingerprint className="w-5 h-5 text-neutral-600 dark:text-neutral-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-snug">Fingerprint login</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Quick biometric authentication
                  </p>
                </div>
              </div>
              <Switch
                checked={isFingerprintEnabled}
                onCheckedChange={handleToggleFingerprint}
                disabled={fingerprintLoading}
                className="shrink-0 data-[state=checked]:!bg-[#0D3B29] dark:data-[state=checked]:!bg-[#1F7A5A]"
                aria-label="Toggle fingerprint login"
              />
            </div>

            {/* Change Password */}
            <button
              type="button"
              onClick={() => setPasswordModalOpen(true)}
              className="w-full flex items-center justify-between p-4 min-h-[64px] text-left hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 active:bg-neutral-100/60 transition-colors"
            >
              <div>
                <p className="font-semibold text-sm leading-snug">Change password</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Last updated 3 months ago
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
            </button>
          </div>
        </section>

        {/* ── SECTION: Privacy & Cookies ── */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Privacy &amp; Cookies
            </h2>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-[#00FF9C] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Backend Synced
            </span>
          </div>
          <div className="bg-white dark:bg-[#181D1A] rounded-2xl border border-emerald-950/5 dark:border-neutral-800 shadow-xs divide-y divide-neutral-100 dark:divide-neutral-800/70 overflow-hidden">
            {/* Cookie Preferences Trigger */}
            <button
              type="button"
              onClick={openCookiePreferencesModal}
              className="w-full flex items-center justify-between p-4 min-h-[64px] text-left hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 active:bg-neutral-100/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
                  <Cookie className="w-4.5 h-4.5 text-emerald-600 dark:text-[#00FF9C]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm leading-snug">Cookie &amp; Tracking Settings</p>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-tight">
                    Manage AI personalization, analytics telemetry &amp; real storage keys
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
            </button>
          </div>
        </section>

        {/* ── SECTION: Plan ── */}
        <section className="mb-5">
          <h2 className="text-sm font-bold tracking-tight mb-2 px-1 text-neutral-900 dark:text-neutral-100">
            Plan
          </h2>
          <div className="bg-white dark:bg-[#181D1A] rounded-2xl border border-emerald-950/5 dark:border-neutral-800 shadow-xs p-4 space-y-3.5">
            {/* Plan Header */}
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                SmartFit Pro <span className="text-neutral-400 font-normal">•</span> $9.99/mo
              </p>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0D3B29] text-white flex items-center gap-1">
                <Check className="w-3.5 h-3.5" strokeWidth={3} /> Active
              </span>
            </div>

            {/* Auto-renew box */}
            <div className="bg-[#EAF5EE] dark:bg-[#1E2D24] p-3 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium">
                <Calendar className="w-4 h-4 text-neutral-600 dark:text-neutral-300 shrink-0" />
                <span>Renews Nov 24, 2026</span>
              </div>
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                Auto-renew on
              </span>
            </div>

            {/* Manage link */}
            <button
              type="button"
              onClick={() => navigate("/pricing")}
              className="w-full flex items-center justify-between pt-1 text-sm font-semibold text-[#0D3B29] dark:text-[#4CC38A] hover:opacity-85 transition-opacity"
            >
              <span>Manage subscription / Upgrade</span>
              <ChevronRight className="w-4 h-4 shrink-0 text-neutral-400" />
            </button>
          </div>
        </section>

        {/* ── SECTION: About ── */}
        <section className="mb-6">
          <h2 className="text-sm font-bold tracking-tight mb-2 px-1 text-neutral-900 dark:text-neutral-100">
            About
          </h2>
          <div className="bg-white dark:bg-[#181D1A] rounded-2xl border border-emerald-950/5 dark:border-neutral-800 shadow-xs divide-y divide-neutral-100 dark:divide-neutral-800/70 overflow-hidden">
            {/* App Version */}
            <div className="flex items-center justify-between p-4 min-h-[52px]">
              <span className="font-semibold text-sm">App version</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Version 2.4.1 (Build 820)
              </span>
            </div>

            {/* Privacy policy */}
            <Link
              to="/privacy"
              className="flex items-center justify-between p-4 min-h-[52px] hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
            >
              <span className="font-semibold text-sm">Privacy policy</span>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 shrink-0" />
            </Link>

            {/* Terms of service */}
            <Link
              to="/terms"
              className="flex items-center justify-between p-4 min-h-[52px] hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
            >
              <span className="font-semibold text-sm">Terms of service</span>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
            </Link>

            {/* Help & support */}
            <Link
              to="/contact"
              className="flex items-center justify-between p-4 min-h-[52px] hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
            >
              <span className="font-semibold text-sm">Help & support</span>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
            </Link>
          </div>
        </section>

        {/* ── Sign out Button ── */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full h-[52px] bg-white dark:bg-[#181D1A] rounded-2xl border border-emerald-950/5 dark:border-neutral-800 shadow-xs flex items-center justify-center gap-2.5 font-semibold text-sm text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 active:scale-[0.99] transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          <span>Sign out</span>
        </button>

        {/* ── Delete account ── */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate("/delete-account")}
            className="text-sm font-semibold text-red-600 hover:text-red-700 active:scale-95 transition-transform cursor-pointer"
          >
            Delete account
          </button>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-[270px] mx-auto mt-1 leading-relaxed">
            This will permanently erase your workout logs and biometric history.
          </p>
        </div>
        </div>
      </main>

      {/* ── Dialog: Goal ── */}
      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Select Goal</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Personalize your adaptive workout volume and rep targets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-3">
            {GOAL_OPTIONS.map((g) => {
              const isSelected = preferences.fitnessGoal === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    savePreference({ fitnessGoal: g });
                    setGoalModalOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition-all text-left",
                    isSelected
                      ? "border-[#1F7A5A] bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A]"
                      : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  )}
                >
                  <span>{g}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#1F7A5A] dark:text-[#4CC38A]" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Activity Level ── */}
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Activity Level</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              How frequently do you currently exercise each week?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-3">
            {ACTIVITY_OPTIONS.map((lvl) => {
              const isSelected = preferences.activityLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    savePreference({ activityLevel: lvl });
                    setActivityModalOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition-all text-left",
                    isSelected
                      ? "border-[#1F7A5A] bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A]"
                      : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  )}
                >
                  <span>{lvl}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#1F7A5A] dark:text-[#4CC38A]" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Units ── */}
      <Dialog open={unitsModalOpen} onOpenChange={setUnitsModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Preferred Units</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Display metrics in kilograms/centimeters or pounds/feet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-3">
            {[
              { id: "metric" as const, label: "Metric (kg, cm)" },
              { id: "imperial" as const, label: "Imperial (lb, ft)" },
            ].map((u) => {
              const isSelected = (preferences.units || "metric") === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    savePreference({ units: u.id });
                    setUnitsModalOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition-all text-left",
                    isSelected
                      ? "border-[#1F7A5A] bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A]"
                      : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  )}
                >
                  <span>{u.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#1F7A5A] dark:text-[#4CC38A]" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Coaching Tone ── */}
      <Dialog open={toneModalOpen} onOpenChange={setToneModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Coaching Tone</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Select how your AI trainer speaks and motivates during workouts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-3">
            {COACHING_TONES.map((tone) => {
              const isSelected = preferences.coachingTone === tone;
              return (
                <button
                  key={tone}
                  type="button"
                  onClick={() => {
                    savePreference({ coachingTone: tone });
                    setToneModalOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition-all text-left",
                    isSelected
                      ? "border-[#1F7A5A] bg-[#EAF5EE] dark:bg-[#1E2D24] text-[#1F7A5A] dark:text-[#4CC38A]"
                      : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  )}
                >
                  <span>{tone}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#1F7A5A] dark:text-[#4CC38A]" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Change Password ── */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#1F7A5A]" /> Change Password
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Enter a new secure password for your account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-3.5 mt-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F7A5A]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F7A5A]"
              />
            </div>

            <button
              type="submit"
              disabled={changingPw}
              className="w-full h-11 rounded-xl font-semibold text-sm bg-[#0D3B29] text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {changingPw ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
