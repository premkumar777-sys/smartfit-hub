import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Container } from "@/components/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    User,
    Mail,
    Calendar,
    Target,
    Flame,
    Trophy,
    Dumbbell,
    Edit2,
    Save,
    X,
    LogOut,
    Crown,
    Loader2,
    CheckCircle,
    Camera,
    MapPin,
    BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Workout = Tables<"workouts">;

interface StreakData {
    currentStreak: number;
    bestStreak: number;
    lastActiveDate: string;
    totalActiveDays: number;
}

const STREAK_STORAGE_KEY = "smartfit-streak-data";

const getStreakBadge = (streak: number) => {
    if (streak >= 100) return { label: "Fitness Legend", icon: "🏆", color: "bg-yellow-500" };
    if (streak >= 30) return { label: "Monthly Champion", icon: "💪", color: "bg-purple-500" };
    if (streak >= 7) return { label: "Week Warrior", icon: "🔥", color: "bg-orange-500" };
    return null;
};

const FITNESS_GOALS = [
    "Fat Loss",
    "Muscle Gain",
    "Endurance",
    "Flexibility",
    "General Fitness",
    "Strength Training",
    "Weight Maintenance"
];

export default function Profile() {
    const navigate = useNavigate();
    const { hasPremiumAccess } = useSubscription();

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit form state
    const [editUsername, setEditUsername] = useState("");
    const [editFullName, setEditFullName] = useState("");
    const [editBio, setEditBio] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [editGoal, setEditGoal] = useState("");
    const [uploading, setUploading] = useState(false);

    // Streak state
    const [streak, setStreak] = useState<StreakData>({
        currentStreak: 0,
        bestStreak: 0,
        lastActiveDate: "",
        totalActiveDays: 0
    });

    // Load and update streak
    useEffect(() => {
        const loadStreak = () => {
            const stored = localStorage.getItem(STREAK_STORAGE_KEY);
            const today = new Date().toISOString().split('T')[0];

            if (stored) {
                const data: StreakData = JSON.parse(stored);
                const lastDate = data.lastActiveDate;

                if (lastDate === today) {
                    // Already logged in today
                    setStreak(data);
                } else {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toISOString().split('T')[0];

                    if (lastDate === yesterdayStr) {
                        // Consecutive day - increment streak
                        const newStreak: StreakData = {
                            currentStreak: data.currentStreak + 1,
                            bestStreak: Math.max(data.bestStreak, data.currentStreak + 1),
                            lastActiveDate: today,
                            totalActiveDays: data.totalActiveDays + 1
                        };
                        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(newStreak));
                        setStreak(newStreak);
                    } else {
                        // Missed days - reset streak
                        const newStreak: StreakData = {
                            currentStreak: 1,
                            bestStreak: data.bestStreak,
                            lastActiveDate: today,
                            totalActiveDays: data.totalActiveDays + 1
                        };
                        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(newStreak));
                        setStreak(newStreak);
                    }
                }
            } else {
                // First time - start streak
                const newStreak: StreakData = {
                    currentStreak: 1,
                    bestStreak: 1,
                    lastActiveDate: today,
                    totalActiveDays: 1
                };
                localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(newStreak));
                setStreak(newStreak);
            }
        };

        loadStreak();
    }, []);

    // Load user data
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (!authUser) {
                    navigate("/auth");
                    return;
                }

                setUser(authUser);

                // Load profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (profileData) {
                    setProfile(profileData);
                    setEditUsername(profileData.username || "");
                    setEditFullName(profileData.full_name || "");
                    setEditBio(profileData.bio || "");
                    setEditLocation(profileData.location || "");
                    setEditGoal(profileData.fitness_goal || "");
                }

                // Load workouts
                const { data: workoutsData } = await supabase
                    .from('workouts')
                    .select('*')
                    .eq('user_id', authUser.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (workoutsData) {
                    setWorkouts(workoutsData);
                }
            } catch (error) {
                console.error("Error loading user data:", error);
                toast.error("Failed to load profile data");
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [navigate]);

    const handleSaveProfile = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const updateData = {
                id: user.id,
                username: editUsername,
                full_name: editFullName,
                bio: editBio,
                location: editLocation,
                fitness_goal: editGoal,
                updated_at: new Date().toISOString()
            };

            console.log("Saving profile with data:", updateData);

            const { error } = await supabase
                .from('profiles')
                .upsert(updateData, { onConflict: 'id' });

            if (error) {
                console.error("Supabase error updating profile:", error);
                throw error;
            }

            setProfile(prev => prev ? {
                ...prev,
                username: editUsername,
                full_name: editFullName,
                bio: editBio,
                location: editLocation,
                fitness_goal: editGoal
            } : null);

            setIsEditing(false);
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error("You must select an image to upload.");
            }

            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const filePath = `${user.id}/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from("profiles")
                .update({ avatar_url: publicUrl })
                .eq("id", user.id);

            if (updateError) throw updateError;

            setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
            toast.success("Avatar updated successfully!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const initials = profile?.username
        ? profile.username.slice(0, 2).toUpperCase()
        : user?.email?.slice(0, 2).toUpperCase() || "U";

    const streakBadge = getStreakBadge(streak.currentStreak);

    return (
        <div className="min-h-screen py-12">
            <Container>
                <Link
                    to="/dashboard"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>

                {/* Profile Header */}
                <Card className="glass border-primary/20 mb-6">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            {/* Avatar */}
                            <div className="relative">
                                <Avatar className="w-24 h-24 border-4 border-primary/30 relative">
                                    <AvatarImage src={profile?.avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                                        {initials}
                                    </AvatarFallback>
                                    {isEditing && (
                                        <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                                            {uploading ? (
                                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                                            ) : (
                                                <Camera className="w-6 h-6 text-white" />
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleAvatarUpload}
                                                disabled={uploading}
                                            />
                                        </label>
                                    )}
                                </Avatar>
                                {hasPremiumAccess && (
                                    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1 z-10">
                                        <Crown className="w-4 h-4 text-black" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                    <h1 className="text-2xl font-bold">{profile?.full_name || profile?.username || "SmartFit User"}</h1>
                                    {hasPremiumAccess && (
                                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                                            Pro Member
                                        </Badge>
                                    )}
                                </div>
                                {profile?.bio && (
                                    <p className="text-sm text-muted-foreground mb-3 max-w-md mx-auto md:mx-0">
                                        {profile.bio}
                                    </p>
                                )}
                                <div className="flex flex-col md:flex-row gap-x-4 gap-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                                        <Mail className="w-4 h-4" />
                                        {user?.email}
                                    </p>
                                    {profile?.location && (
                                        <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {profile.location}
                                        </p>
                                    )}
                                    <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Joined {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                {!isEditing ? (
                                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel
                                        </Button>
                                        <Button onClick={handleSaveProfile} disabled={saving}>
                                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                            Save
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Streak Section */}
                <Card className="glass border-orange-500/30 mb-6 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-yellow-500/10" />
                    <CardContent className="p-6 relative">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-center md:text-left">
                                <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2 justify-center md:justify-start">
                                    <Flame className="w-5 h-5" />
                                    Current Streak
                                </h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-5xl font-bold text-white">
                                        {streak.currentStreak}
                                    </span>
                                    <span className="text-xl text-muted-foreground">days</span>
                                    {streak.currentStreak >= 3 && (
                                        <div className="flex">
                                            {[...Array(Math.min(streak.currentStreak, 5))].map((_, i) => (
                                                <Flame
                                                    key={i}
                                                    className="w-6 h-6 text-orange-500 animate-pulse"
                                                    style={{ animationDelay: `${i * 0.1}s` }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {streakBadge && (
                                    <Badge className={`${streakBadge.color} text-white mt-2`}>
                                        {streakBadge.icon} {streakBadge.label}
                                    </Badge>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-black/30 rounded-lg p-4">
                                    <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                                    <p className="text-2xl font-bold">{streak.bestStreak}</p>
                                    <p className="text-xs text-muted-foreground">Best Streak</p>
                                </div>
                                <div className="bg-black/30 rounded-lg p-4">
                                    <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
                                    <p className="text-2xl font-bold">{streak.totalActiveDays}</p>
                                    <p className="text-xs text-muted-foreground">Total Days</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Personal Information */}
                    <Card className="glass border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isEditing ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Username</Label>
                                            <Input
                                                value={editUsername}
                                                onChange={(e) => setEditUsername(e.target.value)}
                                                placeholder="Enter username"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Full Name</Label>
                                            <Input
                                                value={editFullName}
                                                onChange={(e) => setEditFullName(e.target.value)}
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Location</Label>
                                            <Input
                                                value={editLocation}
                                                onChange={(e) => setEditLocation(e.target.value)}
                                                placeholder="e.g. New York, USA"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Fitness Goal</Label>
                                            <select
                                                value={editGoal}
                                                onChange={(e) => setEditGoal(e.target.value)}
                                                className="w-full bg-background border border-input rounded-md px-3 py-2 h-10"
                                            >
                                                <option value="">Select a goal</option>
                                                {FITNESS_GOALS.map(goal => (
                                                    <option key={goal} value={goal}>{goal}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Bio</Label>
                                            <textarea
                                                value={editBio}
                                                onChange={(e) => setEditBio(e.target.value)}
                                                placeholder="Tell us about yourself..."
                                                className="w-full min-h-[100px] bg-background border border-input rounded-md px-3 py-2"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                                        <span className="text-muted-foreground">Full Name</span>
                                        <span className="font-medium">{profile?.full_name || "Not set"}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                                        <span className="text-muted-foreground">Username</span>
                                        <span className="font-medium">{profile?.username || "Not set"}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                                        <span className="text-muted-foreground">Location</span>
                                        <span className="font-medium flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            {profile?.location || "Not set"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-muted-foreground">Bio</span>
                                        <span className="font-medium text-right max-w-[60%]">{profile?.bio || "No bio yet"}</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Fitness Stats */}
                    <Card className="glass border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Dumbbell className="w-5 h-5 text-primary" />
                                Fitness Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-muted-foreground">Saved Workouts</span>
                                <span className="font-medium text-primary">{workouts.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-muted-foreground">Last Workout</span>
                                <span className="font-medium">
                                    {workouts[0]
                                        ? new Date(workouts[0].created_at).toLocaleDateString()
                                        : "No workouts yet"
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-muted-foreground">Subscription</span>
                                <Badge className={hasPremiumAccess ? "bg-primary text-primary-foreground" : "bg-muted"}>
                                    {hasPremiumAccess ? "Pro" : "Free"}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-muted-foreground">Current Streak</span>
                                <span className="font-medium flex items-center gap-1">
                                    <Flame className="w-4 h-4 text-orange-500" />
                                    {streak.currentStreak} days
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Saved Workouts */}
                <Card className="glass border-primary/20 mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Dumbbell className="w-5 h-5 text-primary" />
                                Recent Workouts
                            </span>
                            <Link to="/ai-workout">
                                <Button variant="outline" size="sm">Create New</Button>
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {workouts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No workouts saved yet</p>
                                <Link to="/ai-workout">
                                    <Button variant="link" className="mt-2">Generate your first AI workout</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {workouts.map((workout) => (
                                    <div
                                        key={workout.id}
                                        className="flex items-center justify-between p-4 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                                    >
                                        <div>
                                            <h4 className="font-medium">{workout.title}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {workout.goal && <span className="text-primary">{workout.goal}</span>}
                                                {workout.goal && " • "}
                                                {new Date(workout.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge variant="outline">{workout.bmi ? `BMI: ${workout.bmi}` : "Custom"}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="glass border-primary/20">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Link to="/ai-workout">
                            <Button variant="outline">
                                <Dumbbell className="w-4 h-4 mr-2" />
                                New Workout
                            </Button>
                        </Link>
                        {!hasPremiumAccess && (
                            <Button
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                                onClick={() => navigate("/upgrade")}
                            >
                                <Crown className="w-4 h-4 mr-2" />
                                Upgrade to Pro
                            </Button>
                        )}
                        <Button variant="destructive" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </CardContent>
                </Card>
            </Container>
        </div>
    );
}
