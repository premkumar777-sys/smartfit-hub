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
import { useAuth } from "@/hooks/use-auth";
import { useGamification } from "@/hooks/useGamification";
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
            type: "spring" as const,
            stiffness: 100,
            damping: 15
        }
    }
};

type ProfileBase = Tables<"profiles">;
type Profile = ProfileBase & {
    full_name?: string;
    bio?: string;
    location?: string;
    preferences?: Record<string, unknown>;
    age?: number;
    weight?: number;
    height?: number;
    streak?: number;
    xp?: number;
};
type Workout = Tables<"workouts">;

// StreakData and STREAK_STORAGE_KEY removed in favor of useGamification

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
    const gamification = useGamification();
    const { user: authUser, isLoading: authLoading } = useAuth();

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

    // Map streak from central gamification hook
    const streak = {
        currentStreak: gamification.currentStreak,
        bestStreak: gamification.longestStreak,
        totalActiveDays: gamification.totalWorkouts || gamification.currentStreak
    };

    // Load user data
    useEffect(() => {
        const loadUserData = async (userId: string) => {
            try {
                // Load profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
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
                    .eq('user_id', userId)
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

        if (!authLoading) {
            if (!authUser) {
                navigate("/auth");
            } else {
                setUser(authUser);
                loadUserData(authUser.id);
            }
        }
    }, [authUser, authLoading, navigate]);

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

    if (authLoading || loading || !gamification.isLoaded) {
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
                        <Button
                            variant="ghost"
                            size="sm"
                            className="bg-transparent hover:bg-transparent p-0 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back
                        </Button>
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

                    {/* REDESIGNED MAIN LAYOUT */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* LEFT COLUMN: HERO IDENTITY CARD & BIOMETRICS */}
                        <div className="col-span-1 lg:col-span-8 space-y-6">
                            {/* HERO PROFILE CARD */}
                            <motion.div variants={itemVariants}>
                                <Card className="glass border-primary/20 overflow-hidden relative rounded-3xl shadow-2xl">
                                    {/* Premium Banner */}
                                    <div className="h-32 bg-gradient-to-r from-primary/30 via-purple-600/20 to-orange-500/30 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
                                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest text-primary uppercase">
                                            NEURAL LINK ACTIVE
                                        </div>
                                    </div>

                                    <CardContent className="p-6 pt-0 relative">
                                        {/* Avatar Overflowing */}
                                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 mb-4">
                                            <div className="relative group/avatar">
                                                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-purple-500 to-orange-500 opacity-30 group-hover/avatar:opacity-60 blur transition-opacity" />
                                                <Avatar className="w-28 h-28 border-4 border-background relative z-10 shadow-2xl">
                                                    <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-3xl font-black">
                                                        {initials}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 rounded-full cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 backdrop-blur-sm">
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

                                                {hasPremiumAccess && (
                                                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-1.5 z-30 shadow-lg border-2 border-background">
                                                        <Crown className="w-4 h-4 text-black" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Name & Handle */}
                                            <div className="text-center sm:text-left flex-1 space-y-1.5 pt-2">
                                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                                                    <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent uppercase">
                                                        {profile?.full_name || profile?.username || "SmartFit Warrior"}
                                                    </h1>
                                                    {hasPremiumAccess && (
                                                        <Badge className="bg-gradient-to-r from-amber-500 to-rose-500 text-white border-0 shadow-lg px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase animate-pulse">
                                                            PRO
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
                                                    <p className="text-primary text-xs font-bold flex items-center gap-1.5">
                                                        @{profile?.username || "warrior"}
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_hsl(var(--neon-green))]" />
                                                    </p>
                                                    <span className="text-muted-foreground/40 text-xs">|</span>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {profile?.location || "Earth"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bio */}
                                        {profile?.bio && (
                                            <p className="text-sm text-gray-300 leading-relaxed max-w-2xl text-center sm:text-left border-t border-white/5 pt-4 mt-2">
                                                {profile.bio}
                                            </p>
                                        )}

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-2.5 pt-5 justify-center sm:justify-start border-t border-white/5 mt-4">
                                            <Button onClick={handleOpenEdit} size="sm" className="rounded-full px-5 shadow-glow transition-transform hover:scale-105 active:scale-95 text-xs font-bold">
                                                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                                                Edit Profile
                                            </Button>
                                            <Button variant="outline" size="sm" className="rounded-full px-5 hover:bg-primary/5 transition-all text-xs font-bold border-white/10" onClick={() => navigate('/settings')}>
                                                <Settings className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                                                Settings
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* STATS OVERVIEW DASHBOARD */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* STREAK WIDGET */}
                                <motion.div variants={itemVariants}>
                                    <Card className="glass border-orange-500/20 overflow-hidden relative group rounded-2xl">
                                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <CardContent className="p-5 flex items-center justify-between relative z-10">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Daily Streak</p>
                                                <h3 className="text-3xl font-black text-white">{streak.currentStreak} Days</h3>
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold mt-1">
                                                    <span>BEST: {streak.bestStreak}</span>
                                                    <span>•</span>
                                                    <span>TOTAL: {streak.totalActiveDays}</span>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-orange-500/25 blur-xl rounded-full" />
                                                <Flame className="w-12 h-12 text-orange-500 relative z-10 animate-pulse" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* LEVEL & EXPERIENCE */}
                                <motion.div variants={itemVariants}>
                                    <Card className="glass border-primary/20 p-5 rounded-2xl flex flex-col justify-between h-full">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Neural Level</p>
                                                <p className="text-xl font-black text-primary">Level {(profile as any)?.level || 1}</p>
                                            </div>
                                            <div className="p-2 bg-primary/15 rounded-xl">
                                                <Zap className="w-5 h-5 text-primary" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span className="text-muted-foreground uppercase">Experience</span>
                                                <span>{(profile as any)?.xp || 0} XP</span>
                                            </div>
                                            <Progress value={((profile as any)?.xp || 0) % 100} className="h-1.5 bg-primary/10" />
                                        </div>
                                    </Card>
                                </motion.div>
                            </div>

                            {/* BIOMETRICS PANEL */}
                            <motion.div variants={itemVariants}>
                                <Card className="glass border-white/10 rounded-2xl overflow-hidden">
                                    <CardHeader className="pb-3 border-b border-white/5">
                                        <CardTitle className="text-sm font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                                            <User className="w-4 h-4 text-primary" />
                                            Biometric Parameters
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-white/5 text-center">
                                            {[
                                                { label: "Age", value: profile?.age || "--", suffix: " Yrs", color: "text-blue-400" },
                                                { label: "Weight", value: profile?.weight || "--", suffix: " Kg", color: "text-green-400" },
                                                { label: "Height", value: profile?.height || "--", suffix: " Cm", color: "text-purple-400" },
                                                { label: "Fitness Goal", value: (profile?.fitness_goal || "Not Set").split(' ')[0], suffix: "", color: "text-orange-400" }
                                            ].map((stat, idx) => (
                                                <div key={idx} className="p-5 flex flex-col justify-center items-center">
                                                    <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-1">{stat.label}</span>
                                                    <span className={`text-lg font-black ${stat.color}`}>
                                                        {stat.value}
                                                        <span className="text-xs font-normal text-muted-foreground ml-0.5">{stat.suffix}</span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* RIGHT COLUMN: WORKOUTS ACTIVITY & QUICK ACTIONS */}
                        <div className="col-span-1 lg:col-span-4 space-y-6">
                            {/* ACTIVITY FORGE */}
                            <motion.div variants={itemVariants}>
                                <Card className="glass border-primary/20 rounded-3xl overflow-hidden flex flex-col">
                                    <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5">
                                        <CardTitle className="text-sm font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                                            <Dumbbell className="w-4 h-4 text-primary" />
                                            Activity Forge
                                        </CardTitle>
                                        <Link to="/ai-workout">
                                            <Button variant="ghost" size="xs" className="text-[10px] font-bold rounded-full border border-white/10 px-2.5 h-6">
                                                NEW FORGE
                                            </Button>
                                        </Link>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3">
                                        {workouts.length === 0 ? (
                                            <div className="py-8 text-center space-y-3">
                                                <BookOpen className="w-7 h-7 text-muted-foreground/45 mx-auto" />
                                                <div>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No Records</p>
                                                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Generate a workout to begin.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {workouts.map((workout) => (
                                                    <div
                                                        key={workout.id}
                                                        className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 group/workout transition-all cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-background flex items-center justify-center border border-white/5 group-hover/workout:scale-105 transition-transform">
                                                                <Dumbbell className="w-4.5 h-4.5 text-primary" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="font-bold text-xs truncate uppercase tracking-tight text-gray-200">{workout.title}</h4>
                                                                <span className="text-[9px] font-bold text-muted-foreground block mt-0.5">
                                                                    {new Date(workout.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover/workout:translate-x-0.5 transition-transform" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* QUICK ACTIONS PANEL */}
                            <motion.div variants={itemVariants}>
                                <Card className="glass border-white/10 rounded-3xl p-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Card
                                            className="bg-white/5 border border-white/5 p-4 flex flex-col justify-center items-center text-center cursor-pointer hover:bg-primary/5 hover:border-primary/20 transition-all rounded-2xl group"
                                            onClick={() => navigate("/ai-workout")}
                                        >
                                            <Zap className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-300">New Forge</span>
                                        </Card>
                                        {!hasPremiumAccess ? (
                                            <Card
                                                className="bg-gradient-to-br from-amber-500 to-rose-600 border-0 p-4 flex flex-col justify-center items-center text-center cursor-pointer hover:opacity-90 transition-all rounded-2xl shadow-xl group"
                                                onClick={() => navigate("/upgrade")}
                                            >
                                                <Crown className="w-5 h-5 text-white mb-2 group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] font-black uppercase tracking-wider text-white">Go PRO</span>
                                            </Card>
                                        ) : (
                                            <Card
                                                className="bg-white/5 border border-white/5 p-4 flex flex-col justify-center items-center text-center cursor-pointer hover:bg-primary/5 hover:border-primary/20 transition-all rounded-2xl group"
                                                onClick={() => navigate("/progress")}
                                            >
                                                <Trophy className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-300">Milestones</span>
                                            </Card>
                                        )}
                                        <Card
                                            className="bg-red-500/5 border border-red-500/10 p-4 flex flex-col justify-center items-center text-center cursor-pointer hover:bg-red-500/10 hover:border-red-500/30 transition-all rounded-2xl col-span-2 group"
                                            onClick={handleLogout}
                                        >
                                            <LogOut className="w-5 h-5 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-red-400">Abort Session (Logout)</span>
                                        </Card>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </Container>

            {/* EDIT PROFILE SHEET */}
            <Sheet open={isEditing} onOpenChange={setIsEditing}>
                <SheetContent side="right" className="sm:max-w-md border-border glass-strong p-0 flex flex-col">
                    <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
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
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Location</Label>
                                <Input
                                    value={editLocation}
                                    onChange={(e) => setEditLocation(e.target.value)}
                                    className="bg-muted/30 border-primary/10 h-12 rounded-xl"
                                    placeholder="City, Country"
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
