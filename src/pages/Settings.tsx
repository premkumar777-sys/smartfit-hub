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
import { Input } from "@/components/ui/input";
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
    Trash2,
    Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "@/components/ThemeProvider";

interface UserPreferences {
    notifications: {
        email: boolean;
        push: boolean;
    };
    units: "metric" | "imperial";
    privacy: "public" | "private";
    theme: "dark" | "light";
}

const DEFAULT_PREFERENCES: UserPreferences = {
    notifications: {
        email: true,
        push: true
    },
    units: "metric",
    privacy: "public",
    theme: "dark"
};

export default function Settings() {
    const navigate = useNavigate();
    const { theme: currentTheme, setTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
    const [hasChanges, setHasChanges] = useState(false);

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
                    .eq("id", authUser.id)
                    .single();

                if (profile?.preferences) {
                    const loadedPrefs = {
                        ...DEFAULT_PREFERENCES,
                        ...(profile.preferences as any)
                    };
                    setPreferences(loadedPrefs);

                    // Sync theme if different
                    if (loadedPrefs.theme !== currentTheme) {
                        setTheme(loadedPrefs.theme);
                    }
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

    const handlePreferenceChange = (updater: (prev: UserPreferences) => UserPreferences) => {
        setPreferences(prev => {
            const next = updater(prev);
            setHasChanges(true);
            return next;
        });
    };

    const handleSaveSettings = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .upsert({
                    id: user.id,
                    preferences: preferences,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (error) throw error;

            toast.success("Settings saved successfully");
            setHasChanges(false);
        } catch (error: any) {
            console.error("Error saving settings:", error);
            toast.error(error.message || "Failed to save settings");
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link
                            to="/profile"
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Profile
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                                <SettingsIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Settings</h1>
                                <p className="text-muted-foreground">Manage your account and app preferences</p>
                            </div>
                        </div>
                    </div>

                    {hasChanges && (
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-right-4">
                            <span className="text-sm font-medium text-primary">You have unsaved changes</span>
                            <Button onClick={handleSaveSettings} disabled={saving} size="sm" className="bg-primary text-black">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Changes
                            </Button>
                        </div>
                    )}
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
                                        <Label className="text-base font-semibold">Measurement Units</Label>
                                        <p className="text-sm text-muted-foreground">Choose between Metric and Imperial units</p>
                                    </div>
                                    <Select
                                        value={preferences.units}
                                        onValueChange={(val: any) => handlePreferenceChange(p => ({ ...p, units: val }))}
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
                                        <Label className="text-base font-semibold">Interface Theme</Label>
                                        <p className="text-sm text-muted-foreground">Select your preferred color theme</p>
                                    </div>
                                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                                        <button
                                            onClick={() => {
                                                setTheme('dark');
                                                handlePreferenceChange(p => ({ ...p, theme: 'dark' }));
                                            }}
                                            className={`p-2 rounded-md transition-all flex items-center gap-2 ${currentTheme === 'dark' ? 'bg-primary text-black font-bold' : 'text-muted-foreground hover:text-white'}`}
                                        >
                                            <Moon className="w-4 h-4" />
                                            <span className="text-xs">Dark</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setTheme('light');
                                                handlePreferenceChange(p => ({ ...p, theme: 'light' }));
                                            }}
                                            className={`p-2 rounded-md transition-all flex items-center gap-2 ${currentTheme === 'light' ? 'bg-primary text-black font-bold' : 'text-muted-foreground hover:text-white'}`}
                                        >
                                            <Sun className="w-4 h-4" />
                                            <span className="text-xs">Light</span>
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notifications */}
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
                                <CardDescription>Manage how you receive updates and alerts (Currently in development)</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">Email Notifications</Label>
                                        <p className="text-sm text-muted-foreground">Receive workout summaries and progress reports via email</p>
                                    </div>
                                    <Switch
                                        checked={false}
                                        disabled
                                    />
                                </div>
                                <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">Push Notifications</Label>
                                        <p className="text-sm text-muted-foreground">Get real-time alerts for challenges and streak reminders</p>
                                    </div>
                                    <Switch
                                        checked={false}
                                        disabled
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
                                        <Label className="text-base font-semibold">Profile Visibility</Label>
                                        <p className="text-sm text-muted-foreground">Public profiles are visible on leaderboards</p>
                                    </div>
                                    <Select
                                        value={preferences.privacy}
                                        onValueChange={(val: any) => handlePreferenceChange(p => ({ ...p, privacy: val }))}
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

                        {/* Final Save Action for Mobile/Bottom */}
                        {hasChanges && (
                            <div className="lg:hidden p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
                                <p className="text-sm text-center">You have unsaved changes</p>
                                <Button onClick={handleSaveSettings} disabled={saving} className="w-full bg-primary text-black font-bold">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save All Settings
                                </Button>
                            </div>
                        )}
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
                                    <Button variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5" onClick={handleLogout}>
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


                    </div>
                </div>
            </Container>
        </div>
    );
}
