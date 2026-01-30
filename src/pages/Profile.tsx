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
    BookOpen,
    TrendingUp,
    Zap,
    Activity,
    ChevronRight,
    Share2,
    Settings,
    MoreVertical
} from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { Tables } from "@/integrations/supabase/types";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

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
        const loadStreak = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const stored = localStorage.getItem(STREAK_STORAGE_KEY);
            const today = new Date().toISOString().split('T')[0];

            let currentStreakData: StreakData;

            if (stored) {
                currentStreakData = JSON.parse(stored);
            } else if (authUser) {
                // Try to load from Supabase if local is empty
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('streak, updated_at')
                    .eq('id', authUser.id)
                    .single();

                currentStreakData = {
                    currentStreak: profileData?.streak || 0,
                    bestStreak: profileData?.streak || 0,
                    lastActiveDate: profileData?.updated_at?.split('T')[0] || "",
                    totalActiveDays: profileData?.streak || 0
                };
            } else {
                return;
            }

            const lastDate = currentStreakData.lastActiveDate;
            let newStreak: StreakData;

            if (lastDate === today) {
                // Already logged in today
                setStreak(currentStreakData);
                return;
            } else {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastDate === yesterdayStr) {
                    // Consecutive day - increment streak
                    newStreak = {
                        currentStreak: currentStreakData.currentStreak + 1,
                        bestStreak: Math.max(currentStreakData.bestStreak, currentStreakData.currentStreak + 1),
                        lastActiveDate: today,
                        totalActiveDays: currentStreakData.totalActiveDays + 1
                    };
                } else {
                    // Missed days - reset streak
                    newStreak = {
                        currentStreak: 1,
                        bestStreak: currentStreakData.bestStreak,
                        lastActiveDate: today,
                        totalActiveDays: currentStreakData.totalActiveDays + 1
                    };
                }
            }

            localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(newStreak));
            setStreak(newStreak);

            // Sync to Supabase if logged in
            if (authUser) {
                await supabase
                    .from('profiles')
                    .update({ streak: newStreak.currentStreak })
                    .eq('id', authUser.id);
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

    const handleOpenEdit = () => {
        setEditUsername(profile?.username || "");
        setEditFullName(profile?.full_name || "");
        setEditBio(profile?.bio || "");
        setEditLocation(profile?.location || "");
        setEditGoal(profile?.fitness_goal || "");
        setIsEditing(true);
    };

    const handleSaveProfile = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const updateData = {
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
                .upsert({ id: user.id, ...updateData }, { onConflict: 'id' });

            if (error) {
                console.error("Supabase error updating profile:", error);
                toast.error(`Failed to update profile: ${error.message}`);
                return;
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
        <div className="min-h-screen pt-24 pb-12 overflow-x-hidden">
            <Container>
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="space-y-6"
                >
                    {/* Navigation & Actions Header */}
                    <motion.div variants={itemVariants} className="flex items-center justify-between mb-2">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </Link>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full hover:bg-primary/10 hover:text-primary"
                                onClick={() => toast.info("Profile sharing coming soon!")}
                            >
                                <Share2 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>

                    {/* MAIN BENTO GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4 auto-rows-min">

                        {/* 1. HERO CARD (User Identity) */}
                        <motion.div
                            variants={itemVariants}
                            className="col-span-1 md:col-span-4 lg:col-span-8 row-span-2 relative group"
                        >
                            <Card className="glass h-full border-primary/20 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
                                <CardContent className="p-8 h-full flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left relative z-10">
                                    {/* Avatar with Ring */}
                                    <div className="relative group/avatar">
                                        <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-purple-500 to-orange-500 opacity-20 group-hover/avatar:opacity-40 blur transition-opacity" />
                                        <Avatar className="w-32 h-32 border-4 border-background relative z-10 shadow-xl">
                                            <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                                            <AvatarFallback className="bg-primary/10 text-primary text-4xl font-black">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>

                                        <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 backdrop-blur-sm scale-95 group-hover/avatar:scale-100">
                                            {uploading ? (
                                                <Loader2 className="w-8 h-8 animate-spin text-white" />
                                            ) : (
                                                <Camera className="w-8 h-8 text-white" />
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleAvatarUpload}
                                                disabled={uploading}
                                            />
                                        </label>

                                        {hasPremiumAccess && (
                                            <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-2 z-30 shadow-lg border-2 border-background">
                                                <Crown className="w-5 h-5 text-black" />
                                            </div>
                                        )}
                                    </div>

                                    {/* User Details */}
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-1">
                                                <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                                                    {profile?.full_name || profile?.username || "SmartFit Warrior"}
                                                </h1>
                                                {hasPremiumAccess && (
                                                    <Badge className="bg-gradient-to-r from-amber-500 to-rose-500 text-white border-0 shadow-lg px-3 py-1 font-bold animate-pulse">
                                                        PRO
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-primary font-medium flex items-center justify-center md:justify-start gap-2">
                                                @{profile?.username || "warrior"}
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_hsl(var(--neon-green))]" />
                                            </p>
                                        </div>

                                        {profile?.bio && (
                                            <p className="text-muted-foreground leading-relaxed max-w-xl line-clamp-2 md:line-clamp-none">
                                                {profile.bio}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {profile?.location || "Earth"}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Joined {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                            </div>
                                        </div>

                                        <div className="pt-4 flex flex-wrap gap-3 justify-center md:justify-start">
                                            <Button onClick={handleOpenEdit} className="rounded-full px-6 shadow-glow transition-transform hover:scale-105 active:scale-95">
                                                <Edit2 className="w-4 h-4 mr-2" />
                                                Edit Profile
                                            </Button>
                                            <Button variant="outline" className="rounded-full px-6 hover:bg-primary/5 transition-all">
                                                <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
                                                Settings
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* 2. STREAK CARD (Mini Bento) */}
                        <motion.div
                            variants={itemVariants}
                            className="col-span-1 md:col-span-2 lg:col-span-4 row-span-2"
                        >
                            <Card className="glass h-full border-orange-500/20 overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center relative z-10">
                                    <div className="relative mb-4">
                                        <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full" />
                                        <Flame className="w-16 h-16 text-orange-500 relative z-10 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-black mb-1">
                                        {streak.currentStreak}
                                    </h3>
                                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">
                                        Daily Streak
                                    </p>

                                    <div className="w-full space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="text-left">
                                                <p className="text-xs text-muted-foreground font-semibold">BEST STREAK</p>
                                                <p className="text-xl font-bold">{streak.bestStreak} Days</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground font-semibold">TOTAL ACTIVE</p>
                                                <p className="text-xl font-bold">{streak.totalActiveDays} Days</p>
                                            </div>
                                        </div>

                                        {streakBadge && (
                                            <div className={`${streakBadge.color} rounded-xl p-3 flex items-center justify-center gap-2 shadow-lg`}>
                                                <span className="text-xl">{streakBadge.icon}</span>
                                                <span className="font-bold text-white text-sm">{streakBadge.label}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* 3. EXPERIENCE CARD (Real stats from profiles table) */}
                        <motion.div
                            variants={itemVariants}
                            className="col-span-1 md:col-span-2 lg:col-span-4"
                        >
                            <Card className="glass border-primary/20 p-6 h-full flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-primary/10 rounded-xl">
                                        <Zap className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Level</p>
                                        <p className="text-2xl font-black text-primary">{(profile as any)?.level || 1}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-muted-foreground uppercase">Experience</span>
                                        <span>{(profile as any)?.xp || 0} XP</span>
                                    </div>
                                    <Progress value={((profile as any)?.xp || 0) % 100} className="h-2 bg-primary/10" />
                                </div>
                            </Card>
                        </motion.div>

                        {/* 4. BIO-STATS BENTO GRID (4 small cards) */}
                        {[
                            { label: "Age", value: profile?.age || "--", suffix: " yrs", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
                            { label: "Weight", value: profile?.weight || "--", suffix: " kg", icon: Activity, color: "text-green-500", bg: "bg-green-500/10" },
                            { label: "Height", value: profile?.height || "--", suffix: " cm", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
                            { label: "Goal", value: (profile?.fitness_goal || "Not set").split(' ')[0], suffix: "", icon: Target, color: "text-orange-500", bg: "bg-orange-500/10" }
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                variants={itemVariants}
                                className="col-span-1 md:col-span-1 lg:col-span-2"
                            >
                                <Card className="glass border-primary/10 p-5 h-full hover:border-primary/30 transition-colors">
                                    <div className={`${stat.bg} ${stat.color} w-8 h-8 rounded-lg flex items-center justify-center mb-3`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">
                                        {stat.label}
                                    </p>
                                    <p className="text-xl font-black truncate">
                                        {stat.value}<span className="text-sm font-normal text-muted-foreground ml-0.5">{stat.suffix}</span>
                                    </p>
                                </Card>
                            </motion.div>
                        ))}

                        {/* 5. RECENT WORKOUTS (List Card) */}
                        <motion.div
                            variants={itemVariants}
                            className="col-span-1 md:col-span-4 lg:col-span-8 overflow-hidden"
                        >
                            <Card className="glass border-primary/20 h-full">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Dumbbell className="w-5 h-5 text-primary" />
                                        Activity Forge
                                    </CardTitle>
                                    <Link to="/ai-workout">
                                        <Button variant="ghost" size="sm" className="h-8 text-xs font-bold rounded-full border border-border/50">
                                            CREATE NEW
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    {workouts.length === 0 ? (
                                        <div className="py-12 text-center space-y-4">
                                            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                                                <BookOpen className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">No Forge Records Found</p>
                                                <p className="text-xs text-muted-foreground/60">Generate an AI workout to start your legacy.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {workouts.map((workout) => (
                                                <div
                                                    key={workout.id}
                                                    className="flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 rounded-2xl border border-border/50 group/workout transition-all cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-border/50 group-hover/workout:scale-110 transition-transform">
                                                            <Dumbbell className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-sm truncate uppercase tracking-tight">{workout.title}</h4>
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                                                                <Calendar className="w-3 h-3" />
                                                                {new Date(workout.created_at).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover/workout:translate-x-1 transition-transform" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* 6. QUICK ACTIONS (Square cards) */}
                        <motion.div
                            variants={itemVariants}
                            className="col-span-1 md:col-span-4 lg:col-span-4"
                        >
                            <div className="grid grid-cols-2 gap-4 h-full">
                                <Card
                                    className="glass border-primary/20 p-6 flex flex-col justify-center items-center text-center cursor-pointer hover:bg-primary/5 transition-colors group"
                                    onClick={() => navigate("/ai-workout")}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Zap className="w-6 h-6 text-primary" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest">New</p>
                                    <p className="text-xs font-black uppercase tracking-widest text-primary">Forge</p>
                                </Card>
                                {!hasPremiumAccess && (
                                    <Card
                                        className="bg-gradient-to-br from-amber-500 to-rose-600 border-0 p-6 flex flex-col justify-center items-center text-center cursor-pointer hover:opacity-90 transition-all shadow-xl group"
                                        onClick={() => navigate("/upgrade")}
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Crown className="w-6 h-6 text-white" />
                                        </div>
                                        <p className="text-xs font-black uppercase tracking-widest text-white">Go</p>
                                        <p className="text-xs font-black uppercase tracking-widest text-white/80">PRO</p>
                                    </Card>
                                )}
                                <Card
                                    className="glass border-destructive/20 p-6 flex flex-col justify-center items-center text-center cursor-pointer hover:bg-destructive/5 transition-colors group lg:col-span-2"
                                    onClick={handleLogout}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <LogOut className="w-6 h-6 text-destructive" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest text-destructive">Terminate</p>
                                    <p className="text-xs font-black uppercase tracking-widest text-destructive/80">Session</p>
                                </Card>
                            </div>
                        </motion.div>

                    </div>
                </motion.div>
            </Container>

            {/* EDIT PROFILE SHEET */}
            <Sheet open={isEditing} onOpenChange={setIsEditing}>
                <SheetContent side="right" className="sm:max-w-md border-border glass-strong p-0">
                    <div className="p-8 space-y-8 h-full flex flex-col">
                        <SheetHeader className="text-left">
                            <SheetTitle className="text-3xl font-black uppercase tracking-tighter italic">Edit Identity</SheetTitle>
                            <SheetDescription className="text-muted-foreground">
                                Update your physical and digital parameters. Changes will sync to the neural hub.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 space-y-6 pt-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Username</Label>
                                <Input
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    className="bg-muted/30 border-primary/10 h-12 rounded-xl"
                                    placeholder="warrior_tag"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Full Designation</Label>
                                <Input
                                    value={editFullName}
                                    onChange={(e) => setEditFullName(e.target.value)}
                                    className="bg-muted/30 border-primary/10 h-12 rounded-xl"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Deployment Hub</Label>
                                <Input
                                    value={editLocation}
                                    onChange={(e) => setEditLocation(e.target.value)}
                                    className="bg-muted/30 border-primary/10 h-12 rounded-xl"
                                    placeholder="Silicon Valley, CA"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Fitness Protocol</Label>
                                <select
                                    value={editGoal}
                                    onChange={(e) => setEditGoal(e.target.value)}
                                    className="w-full bg-muted/30 border border-primary/10 rounded-xl px-4 h-12 font-medium"
                                >
                                    <option value="">Select Protocol</option>
                                    {FITNESS_GOALS.map(goal => (
                                        <option key={goal} value={goal}>{goal}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Status Intel (Bio)</Label>
                                <textarea
                                    value={editBio}
                                    onChange={(e) => setEditBio(e.target.value)}
                                    placeholder="Define your trajectory..."
                                    className="w-full min-h-[120px] bg-muted/30 border border-primary/10 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <SheetFooter className="flex flex-row gap-2 pt-6">
                            <Button variant="outline" className="flex-1 rounded-xl h-12 border-border/50" onClick={() => setIsEditing(false)}>
                                <X className="w-4 h-4 mr-2" />
                                Abort
                            </Button>
                            <Button className="flex-1 rounded-xl h-12 shadow-glow" onClick={handleSaveProfile} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Sync Hub
                            </Button>
                        </SheetFooter>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
