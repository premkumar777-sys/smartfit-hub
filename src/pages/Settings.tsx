import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container } from "@/components/Container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Settings as SettingsIcon,
    Bell,
    Lock,
    User,
    LogOut,
    Moon,
    Sun,
    Shield,
    Smartphone,
    Save,
    Loader2,
    Trash2,
    Dumbbell,
    Bot,
    Palette,
    Key,
    Volume2,
    CheckCircle,
    Eye,
    EyeOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "@/components/ThemeProvider";

interface UserPreferences {
    notifications: { email: boolean; push: boolean; streakReminder: boolean };
    units: "metric" | "imperial";
    privacy: "public" | "private";
    theme: "dark" | "light";
    accentColor: string;
    fitnessGoal: string;
    activityLevel: string;
    weeklyTarget: number;
    coachingTone: string;
    voiceCoach: boolean;
    defaultDuration: number;
    defaultDifficulty: string;
    showOnLeaderboard: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
    notifications: { email: true, push: true, streakReminder: true },
    units: "metric",
    privacy: "public",
    theme: "dark",
    accentColor: "green",
    fitnessGoal: "",
    activityLevel: "moderate",
    weeklyTarget: 4,
    coachingTone: "motivational",
    voiceCoach: true,
    defaultDuration: 30,
    defaultDifficulty: "intermediate",
    showOnLeaderboard: true,
};

const ACCENT_COLORS = [
    { id: "green", label: "Neon Green", class: "bg-[#00FF9C]" },
    { id: "blue", label: "Electric Blue", class: "bg-[#4CC9F0]" },
    { id: "purple", label: "Violet", class: "bg-[#A855F7]" },
    { id: "orange", label: "Energy Orange", class: "bg-[#F97316]" },
];

const FITNESS_GOALS = [
    "Fat Loss", "Muscle Gain", "Endurance",
    "Flexibility", "General Fitness", "Strength Training", "Weight Maintenance",
];

export default function Settings() {
    const navigate = useNavigate();
    const { theme: currentTheme, setTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
    const [hasChanges, setHasChanges] = useState(false);

    // Change password state
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [changingPw, setChangingPw] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) { navigate("/auth"); return; }
                setUser(authUser);

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("preferences")
                    .eq("id", authUser.id)
                    .single();

                if (profile?.preferences) {
                    const loaded = { ...DEFAULT_PREFERENCES, ...(profile.preferences as any) };
                    setPreferences(loaded);
                    if (loaded.theme !== currentTheme) setTheme(loaded.theme);
                }
            } catch (error) {
                console.error("Error loading settings:", error);
                toast.error("Failed to load settings");
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, [navigate, setTheme]);

    const handlePref = (updater: (prev: UserPreferences) => UserPreferences) => {
        setPreferences(prev => { const next = updater(prev); setHasChanges(true); return next; });
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const { error } = await supabase.from("profiles").upsert(
                { id: user.id, preferences, updated_at: new Date().toISOString() },
                { onConflict: "id" }
            );
            if (error) throw error;
            toast.success("Settings saved!");
            setHasChanges(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword !== confirmPassword) {
            toast.error("Passwords don't match");
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
            setShowPasswordForm(false);
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error(error.message || "Failed to update password");
        } finally {
            setChangingPw(false);
        }
    };

    const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };
    const handleDeleteAccount = () => toast.error("Contact support to delete your account.");

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <Container>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link to="/profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Profile
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                                <SettingsIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Settings</h1>
                                <p className="text-muted-foreground">Manage your account and preferences</p>
                            </div>
                        </div>
                    </div>
                    {hasChanges && (
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-right-4">
                            <span className="text-sm font-medium text-primary">Unsaved changes</span>
                            <Button onClick={handleSave} disabled={saving} size="sm" className="bg-primary text-black">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Save
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 1. FITNESS PREFERENCES */}
                        <Card className="glass border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Dumbbell className="w-5 h-5 text-primary" />
                                    Fitness Preferences
                                </CardTitle>
                                <CardDescription>Personalise your training profile</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Fitness Goal */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">Fitness Goal</Label>
                                        <p className="text-sm text-muted-foreground">Your primary training objective</p>
                                    </div>
                                    <Select
                                        value={preferences.fitnessGoal}
                                        onValueChange={(v) => handlePref(p => ({ ...p, fitnessGoal: v }))}
                                    >
                                        <SelectTrigger className="w-44">
                                            <SelectValue placeholder="Select goal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FITNESS_GOALS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Activity Level */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">Activity Level</Label>
                                        <p className="text-sm text-muted-foreground">Your current lifestyle activity</p>
                                    </div>
                                    <Select
                                        value={preferences.activityLevel}
                                        onValueChange={(v) => handlePref(p => ({ ...p, activityLevel: v }))}
                                    >
                                        <SelectTrigger className="w-44">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sedentary">Sedentary</SelectItem>
                                            <SelectItem value="light">Lightly Active</SelectItem>
                                            <SelectItem value="moderate">Moderately Active</SelectItem>
                                            <SelectItem value="active">Very Active</SelectItem>
                                            <SelectItem value="extreme">Athlete</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Weekly Workout Target */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">Weekly Workout Target</Label>
                                        <p className="text-sm text-muted-foreground">Days per week you plan to train</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-primary/10 transition font-bold"
                                            onClick={() => handlePref(p => ({ ...p, weeklyTarget: Math.max(1, p.weeklyTarget - 1) }))}
                                        >−</button>
                                        <span className="text-xl font-bold w-6 text-center">{preferences.weeklyTarget}</span>
                                        <button
                                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-primary/10 transition font-bold"
                                            onClick={() => handlePref(p => ({ ...p, weeklyTarget: Math.min(7, p.weeklyTarget + 1) }))}
                                        >+</button>
                                        <span className="text-sm text-muted-foreground ml-1">days</span>
                                    </div>
                                </div>

                                {/* Measurement Units */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">Measurement Units</Label>
                                        <p className="text-sm text-muted-foreground">Metric or Imperial</p>
                                    </div>
                                    <Select
                                        value={preferences.units}
                                        onValueChange={(v: any) => handlePref(p => ({ ...p, units: v }))}
                                    >
                                        <SelectTrigger className="w-44">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="metric">Metric (kg / cm)</SelectItem>
                                            <SelectItem value="imperial">Imperial (lb / in)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. AI TRAINER PREFERENCES */}
                        <Card className="glass border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="w-5 h-5 text-primary" />
                                    AI Trainer Preferences
                                </CardTitle>
                                <CardDescription>Customise how your AI coach behaves</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Coaching Tone */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">Coaching Tone</Label>
                                        <p className="text-sm text-muted-foreground">How your AI trainer communicates</p>
                                    </div>
                                    <Select
                                        value={preferences.coachingTone}
                                        onValueChange={(v) => handlePref(p => ({ ...p, coachingTone: v }))}
                                    >
                                        <SelectTrigger className="w-44">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="motivational">🔥 Motivational</SelectItem>
                                            <SelectItem value="calm">🧘 Calm & Steady</SelectItem>
                                            <SelectItem value="strict">💪 Strict Coach</SelectItem>
                                            <SelectItem value="friendly">😊 Friendly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Voice Coach */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold flex items-center gap-2">
                                            <Volume2 className="w-4 h-4 text-primary" />
                                            Voice Coach
                                        </Label>
                                        <p className="text-sm text-muted-foreground">Enable spoken cues in 3D Trainer Mode</p>
                                    </div>
                                    <Switch
                                        checked={preferences.voiceCoach}
                                        onCheckedChange={(v) => handlePref(p => ({ ...p, voiceCoach: v }))}
                                    />
                                </div>

                                {/* Default Workout Duration */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">Default Workout Duration</Label>
                                        <p className="text-sm text-muted-foreground">Pre-fill when generating workouts</p>
                                    </div>
                                    <Select
                                        value={String(preferences.defaultDuration)}
                                        onValueChange={(v) => handlePref(p => ({ ...p, defaultDuration: Number(v) }))}
                                    >
                                        <SelectTrigger className="w-44">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="15">15 minutes</SelectItem>
                                            <SelectItem value="30">30 minutes</SelectItem>
                                            <SelectItem value="45">45 minutes</SelectItem>
                                            <SelectItem value="60">60 minutes</SelectItem>
                                            <SelectItem value="90">90 minutes</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Default Difficulty */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">Default Difficulty</Label>
                                        <p className="text-sm text-muted-foreground">Starting intensity for AI workouts</p>
                                    </div>
                                    <Select
                                        value={preferences.defaultDifficulty}
                                        onValueChange={(v) => handlePref(p => ({ ...p, defaultDifficulty: v }))}
                                    >
                                        <SelectTrigger className="w-44">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="beginner">🟢 Beginner</SelectItem>
                                            <SelectItem value="intermediate">🟡 Intermediate</SelectItem>
                                            <SelectItem value="advanced">🔴 Advanced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>


                        {/* 4. NOTIFICATIONS */}
                        <Card className="glass border-primary/10 opacity-80">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-5 h-5 text-primary" />
                                        <CardTitle>Notifications</CardTitle>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-primary/20 text-primary border border-primary/20">
                                        Coming Soon
                                    </span>
                                </div>
                                <CardDescription>Manage alerts and reminders (in development)</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pointer-events-none opacity-50">
                                {[
                                    { label: "Email Notifications", desc: "Workout summaries sent to your email" },
                                    { label: "Streak Reminder", desc: "Daily nudge if you haven't trained" },
                                    { label: "Weekly Progress Report", desc: "Sunday summary of your week" },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-semibold">{item.label}</Label>
                                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                                        </div>
                                        <Switch checked={false} disabled />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* 5. PRIVACY */}
                        <Card className="glass border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary" />
                                    Privacy & Safety
                                </CardTitle>
                                <CardDescription>Control your visibility and data sharing</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">Profile Visibility</Label>
                                        <p className="text-sm text-muted-foreground">Public profiles appear on leaderboards</p>
                                    </div>
                                    <Select
                                        value={preferences.privacy}
                                        onValueChange={(v: any) => handlePref(p => ({ ...p, privacy: v }))}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="public">Public</SelectItem>
                                            <SelectItem value="private">Private</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">Show on Leaderboard</Label>
                                        <p className="text-sm text-muted-foreground">Appear in global rankings</p>
                                    </div>
                                    <Switch
                                        checked={preferences.showOnLeaderboard}
                                        onCheckedChange={(v) => handlePref(p => ({ ...p, showOnLeaderboard: v }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Mobile Save Button */}
                        {hasChanges && (
                            <div className="lg:hidden p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
                                <p className="text-sm text-center">You have unsaved changes</p>
                                <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-black font-bold">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save All Settings
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        {/* Account Info */}
                        <Card className="glass border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    Account
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Logged in as</p>
                                    <p className="text-sm font-medium truncate">{user?.email}</p>
                                </div>
                                <div className="pt-2 space-y-3">
                                    <Button variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5" onClick={handleLogout}>
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Sign Out
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="w-full justify-start text-red-400 hover:text-red-300 bg-red-500/10 border-red-500/20"
                                        onClick={handleDeleteAccount}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Account
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Change Password */}
                        <Card className="glass border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="w-5 h-5 text-primary" />
                                    Security
                                </CardTitle>
                                <CardDescription>Update your login password</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!showPasswordForm ? (
                                    <Button
                                        variant="outline"
                                        className="w-full border-white/10 hover:bg-white/5"
                                        onClick={() => setShowPasswordForm(true)}
                                    >
                                        <Lock className="w-4 h-4 mr-2" />
                                        Change Password
                                    </Button>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Input
                                                type={showPw ? "text" : "password"}
                                                placeholder="New password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="pr-10"
                                            />
                                            <button
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowPw(!showPw)}
                                            >
                                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <Input
                                            type={showPw ? "text" : "password"}
                                            placeholder="Confirm password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                className="flex-1 border-white/10"
                                                onClick={() => { setShowPasswordForm(false); setNewPassword(""); setConfirmPassword(""); }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                className="flex-1 bg-primary text-black font-bold"
                                                onClick={handleChangePassword}
                                                disabled={changingPw}
                                            >
                                                {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                                                Update
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* App Info */}
                        <Card className="glass border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="w-5 h-5 text-primary" />
                                    App Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Version</span>
                                    <span className="font-medium">SmartFit AI 2.0</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Plan</span>
                                    <span className="font-medium text-primary">Free — All Features</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Legal Footer */}
                <div className="mt-12 pt-6 border-t border-border/50 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                    <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                    <Link to="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</Link>
                    <Link to="/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</Link>
                    <Link to="/contact-us" className="hover:text-foreground transition-colors">Contact Us</Link>
                </div>
            </Container>
        </div>
    );
}
