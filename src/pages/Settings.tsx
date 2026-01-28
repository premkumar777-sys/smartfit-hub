import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container } from "@/components/Container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
    Globe,
    Lock,
    User,
    LogOut,
    Moon,
    Sun,
    Shield,
    Smartphone,
    Save,
    Loader2,
    Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserPreferences {
    notifications: {
        email: boolean;
        push: boolean;
    };
    units: "metric" | "imperial";
    privacy: "public" | "private";
    theme: "dark" | "light" | "system";
    language: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
    notifications: {
        email: true,
        push: true
    },
    units: "metric",
    privacy: "public",
    theme: "dark",
    language: "english"
};

export default function Settings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                    navigate("/auth");
                    return;
                }
                setUser(authUser);

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("preferences")
                    .eq("user_id", authUser.id)
                    .single();

                if (profile?.preferences) {
                    setPreferences({
                        ...DEFAULT_PREFERENCES,
                        ...(profile.preferences as any)
                    });
                }
            } catch (error) {
                console.error("Error loading settings:", error);
                toast.error("Failed to load settings");
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [navigate]);

    const handleSavePreferences = async (updater: (prev: UserPreferences) => UserPreferences) => {
        const nextPreferences = updater(preferences);
        setPreferences(nextPreferences);

        setSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    preferences: nextPreferences,
                    updated_at: new Date().toISOString()
                })
                .eq("user_id", user?.id);

            if (error) throw error;
            toast.success("Settings updated");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
            // Revert optimization: In a real app we might revert state here
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    const handleDeleteAccount = () => {
        toast.error("Account deletion is disabled for safety. Please contact support.");
    };

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
                <Link
                    to="/profile"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Profile
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                        <SettingsIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Settings</h1>
                        <p className="text-muted-foreground">Manage your account and app preferences</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Preferences */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* App Settings */}
                        <Card className="glass border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="w-5 h-5 text-primary" />
                                    App Preferences
                                </CardTitle>
                                <CardDescription>Customize how the app looks and feels</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Measurement Units</Label>
                                        <p className="text-sm text-muted-foreground">Choose between Metric and Imperial units</p>
                                    </div>
                                    <Select
                                        value={preferences.units}
                                        onValueChange={(val: any) => handleSavePreferences(p => ({ ...p, units: val }))}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="metric">Metric (kg/cm)</SelectItem>
                                            <SelectItem value="imperial">Imperial (lb/in)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Interface Theme</Label>
                                        <p className="text-sm text-muted-foreground">Select your preferred color theme</p>
                                    </div>
                                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                                        <button
                                            onClick={() => handleSavePreferences(p => ({ ...p, theme: 'dark' }))}
                                            className={`p-2 rounded-md transition-all ${preferences.theme === 'dark' ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'}`}
                                        >
                                            <Moon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleSavePreferences(p => ({ ...p, theme: 'light' }))}
                                            className={`p-2 rounded-md transition-all ${preferences.theme === 'light' ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'}`}
                                        >
                                            <Sun className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleSavePreferences(p => ({ ...p, theme: 'system' }))}
                                            className={`p-2 rounded-md transition-all ${preferences.theme === 'system' ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'}`}
                                        >
                                            <SettingsIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Display Language</Label>
                                        <p className="text-sm text-muted-foreground">Select your interface language</p>
                                    </div>
                                    <Select
                                        value={preferences.language}
                                        onValueChange={(val: any) => handleSavePreferences(p => ({ ...p, language: val }))}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="english">English</SelectItem>
                                            <SelectItem value="spanish">Spanish</SelectItem>
                                            <SelectItem value="french">French</SelectItem>
                                            <SelectItem value="german">German</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notifications */}
                        <Card className="glass border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-primary" />
                                    Notifications
                                </CardTitle>
                                <CardDescription>Manage how you receive updates and alerts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Email Notifications</Label>
                                        <p className="text-sm text-muted-foreground">Receive workout summaries and progress reports via email</p>
                                    </div>
                                    <Switch
                                        checked={preferences.notifications.email}
                                        onCheckedChange={(val) => handleSavePreferences(p => ({ ...p, notifications: { ...p.notifications, email: val } }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Push Notifications</Label>
                                        <p className="text-sm text-muted-foreground">Get real-time alerts for challenges and streak reminders</p>
                                    </div>
                                    <Switch
                                        checked={preferences.notifications.push}
                                        onCheckedChange={(val) => handleSavePreferences(p => ({ ...p, notifications: { ...p.notifications, push: val } }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Privacy */}
                        <Card className="glass border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary" />
                                    Privacy & Safety
                                </CardTitle>
                                <CardDescription>Control your profile visibility and data sharing</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Profile Visibility</Label>
                                        <p className="text-sm text-muted-foreground">Public profiles are visible on leaderboards</p>
                                    </div>
                                    <Select
                                        value={preferences.privacy}
                                        onValueChange={(val: any) => handleSavePreferences(p => ({ ...p, privacy: val }))}
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
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Account Info & Logout */}
                    <div className="space-y-6">
                        <Card className="glass border-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    Account Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Logged in as</p>
                                    <p className="text-sm font-medium">{user?.email}</p>
                                </div>
                                <div className="pt-4 space-y-3">
                                    <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Sign Out
                                    </Button>
                                    <Button variant="destructive" className="w-full justify-start text-red-400 hover:text-red-300 bg-red-500/10 border-red-500/20" onClick={handleDeleteAccount}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Account
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Premium Status */}
                        <Card className="glass border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
                            <CardHeader>
                                <CardTitle className="text-yellow-500 text-lg flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    SmartFit Premium
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Upgrade to unlock personalized AI trainers, advanced analytics, and custom meal plans.
                                </p>
                                <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold border-none" onClick={() => navigate("/upgrade")}>
                                    Manage Subscription
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </Container>
        </div>
    );
}
