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
    Check,
    Camera,
    MapPin,
    BookOpen,
    TrendingUp,
    Zap,
    Activity,
    ChevronRight,
    Share2,
    Settings,
    MoreVertical,
    Trash2,
    Sparkles,
    Download
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
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WorkoutSummaryCard, WorkoutSummaryData } from "@/components/WorkoutSummaryCard";
import { toPng } from "html-to-image";

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

const tabContentVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.2 } }
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
    const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);
    const [completedWorkouts, setCompletedWorkouts] = useState<WorkoutSummaryData[]>([]);
    const [selectedWorkoutForCard, setSelectedWorkoutForCard] = useState<WorkoutSummaryData | null>(null);
    const [progressLogs, setProgressLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<string>("summary");
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
                    .order('created_at', { ascending: false });

                if (workoutsData) {
                    setAllWorkouts(workoutsData);
                    setWorkouts(workoutsData.slice(0, 5));
                }

                // Load completed workouts from localStorage
                const savedWorkouts = localStorage.getItem("smartfit_completed_workouts_v1");
                if (savedWorkouts) {
                    try {
                        setCompletedWorkouts(JSON.parse(savedWorkouts));
                    } catch (e) {
                        console.error(e);
                    }
                }

                try {
                    const { data: completedWorkoutsData, error: completedError } = await supabase
                        .from('completed_workouts')
                        .select('*')
                        .eq('user_id', userId)
                        .order('date', { ascending: false });

                    if (!completedError && completedWorkoutsData) {
                        const mapped: WorkoutSummaryData[] = completedWorkoutsData.map((row: any) => ({
                            id: row.id,
                            routineName: row.routine_name,
                            date: row.date,
                            duration: row.duration,
                            sets: row.sets,
                            volume: row.volume,
                            kcal: row.kcal,
                            muscleGroups: row.muscle_groups || [],
                            exercises: row.exercises || [],
                            personalRecordsCount: row.personal_records_count || 0,
                            photoUrl: row.photo_url
                        }));
                        setCompletedWorkouts(mapped);
                        localStorage.setItem("smartfit_completed_workouts_v1", JSON.stringify(mapped));
                    }
                } catch (err) {
                    console.error("Failed to load completed workouts from Supabase:", err);
                }

                // Load progress logs for weight chart
                let loadedLogs: any[] = [];
                const { data: logsData, error: logsError } = await supabase
                    .from('progress_logs')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date', { ascending: true })
                    .limit(15);

                if (!logsError && logsData) {
                    loadedLogs = logsData;
                } else {
                    const saved = localStorage.getItem("smartfit_progress_v1");
                    if (saved) {
                        try {
                            const parsed = JSON.parse(saved);
                            loadedLogs = parsed
                                .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                .slice(-15);
                        } catch (e) {
                            console.error("Error parsing progress logs from localStorage:", e);
                        }
                    }
                }
                setProgressLogs(loadedLogs);
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

    const handleGymCheckIn = async () => {
        if (!user) return;
        
        try {
            const checkInWorkout = {
                user_id: user.id,
                title: "Gym Check-In",
                content: `Checked in to gym session at ${new Date().toLocaleTimeString()}`,
                goal: "Attendance",
                created_at: new Date().toISOString()
            };
            
            // Insert check-in workout
            const { data, error } = await supabase
                .from('workouts')
                .insert([checkInWorkout])
                .select()
                .single();
                
            if (error) {
                console.error("Error logging check-in:", error);
                toast.error("Failed to check in: " + error.message);
                return;
            }
            
            // Award XP & Record Activity in gamification hook
            gamification.recordWorkout(30); // 30 minutes check-in session
            
            // Update local state instantly so heatmap and check-in status update
            setAllWorkouts(prev => [data, ...prev]);
            setWorkouts(prev => [data, ...prev.slice(0, 4)]);
            
            toast.success("Checked in successfully! Streak updated! 💪");
        } catch (err: any) {
            console.error("Check-in error:", err);
            toast.error("Failed to check in");
        }
    };

    const deleteWorkout = async (id: string) => {
        setCompletedWorkouts((prev) => {
            const updated = prev.filter((w: any) => w.id !== id);
            localStorage.setItem("smartfit_completed_workouts_v1", JSON.stringify(updated));
            return updated;
        });

        toast.success("Workout log deleted");

        if (user) {
            try {
                await supabase.from("completed_workouts").delete().eq("id", id);
            } catch (err) {
                console.error("Error deleting completed workout:", err);
            }
        }
    };

    const todayStr = new Date().toDateString();
    const hasCheckedInToday = allWorkouts.some(
        w => w.title === "Gym Check-In" && new Date(w.created_at).toDateString() === todayStr
    );
    const totalCheckIns = allWorkouts.filter(w => w.title === "Gym Check-In").length;

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

    const renderHeatmap = () => {
        // Calculate activities per date string
        const activitiesByDate: Record<string, Workout[]> = {};
        allWorkouts.forEach(w => {
            const dateStr = new Date(w.created_at).toDateString();
            if (!activitiesByDate[dateStr]) {
                activitiesByDate[dateStr] = [];
            }
            activitiesByDate[dateStr].push(w);
        });

        const startDate = new Date(2026, 0, 1);
        const endDate = new Date(2026, 11, 31);
        
        const days: { date: Date | null; workouts: Workout[] }[] = [];
        
        // Pad the beginning of the year so that the grid starts on Sunday
        const startDayOfWeek = startDate.getDay(); // 4 (Thursday)
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ date: null, workouts: [] });
        }
        
        let current = new Date(startDate);
        while (current <= endDate) {
            const dateStr = current.toDateString();
            const dayWorkouts = activitiesByDate[dateStr] || [];
            days.push({ date: new Date(current), workouts: dayWorkouts });
            current.setDate(current.getDate() + 1);
        }

        // Empty = dark cell, Active = transparent (logo only)
        const getIntensityClass = (count: number) => {
            if (count === 0) return "bg-[#18181b] border-white/[0.03]";
            return "bg-transparent border-transparent";
        };

        // Render SmartFit logo filling the full cell for active days
        const renderCellLogo = (workouts: Workout[]) => {
            if (workouts.length === 0) return null;
            return (
                <img
                    src="/favicon.png"
                    alt="SmartFit"
                    className="w-full h-full object-contain select-none pointer-events-none"
                />
            );
        };

        const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const totalActiveDays = Object.keys(activitiesByDate).length;

        return (
            <Card className="glass border-white/10 rounded-2xl p-5 overflow-hidden">
                <CardHeader className="p-0 pb-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-500" />
                            {allWorkouts.length} activities in 2026
                        </CardTitle>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            Active days: {totalActiveDays} days | Max streak: {streak.longestStreak || 0} days
                        </p>
                    </div>
                    {/* Streaks and Info */}
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-black text-[10px] tracking-wider uppercase animate-pulse">
                            <Flame className="w-3.5 h-3.5" />
                            Streak: {streak.currentStreak} Days
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 pt-5 overflow-x-auto custom-scrollbar">
                    <TooltipProvider>
                        <div className="min-w-[700px] flex flex-col gap-4">
                            <div className="flex gap-2">
                                {/* Day labels column */}
                                <div className="grid grid-rows-7 gap-[5px] text-[8px] font-medium text-muted-foreground/60 pr-1 select-none pt-4">
                                    {weekDays.map((day, idx) => (
                                        <div key={idx} className="h-[20px] flex items-center justify-end leading-none">
                                            {idx % 2 === 1 ? day : ""}
                                        </div>
                                    ))}
                                </div>
                                {/* Grid of days */}
                                <div className="flex-1 space-y-1">
                                    {/* Months label bar */}
                                    <div className="flex text-[8px] font-bold text-muted-foreground/60 select-none pb-1 h-3 relative">
                                        {months.map((month, idx) => {
                                            const leftPct = (idx / 12) * 100;
                                            return (
                                                <div key={idx} className="absolute text-[8px]" style={{ left: `${leftPct}%` }}>
                                                    {month}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="grid grid-flow-col grid-rows-7 gap-[5px]">
                                        {days.map((d, idx) => {
                                            if (!d.date) {
                                                return <div key={`pad-${idx}`} className="w-[20px] h-[20px] bg-transparent" />;
                                            }
                                            const count = d.workouts.length;
                                            const dateLabel = d.date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
                                            const statusLabel = count > 0 ? `${count} activities` : "No activity";
                                            return (
                                                <Tooltip key={idx}>
                                                    <TooltipTrigger asChild>
                                                        <div 
                                                            className={`w-[20px] h-[20px] rounded-[4px] border transition-all flex items-center justify-center cursor-pointer ${getIntensityClass(count)}`} 
                                                        >
                                                            {renderCellLogo(d.workouts)}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-[#0a0a0a] text-[10px] px-2 py-1 border border-white/10 rounded-md text-white z-50">
                                                        <span className="font-bold">{dateLabel}</span>: {statusLabel}
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            

                        </div>
                    </TooltipProvider>
                </CardContent>
            </Card>
        );
    };

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

                    {/* REDESIGNED PROFILE HERO CARD */}
                    <motion.div variants={itemVariants}>
                        <Card className="glass border-white/5 overflow-hidden relative rounded-3xl shadow-2xl">
                            {/* Premium Banner with gym-themed image */}
                            <div className="h-48 bg-cover bg-center relative" style={{ backgroundImage: "url('/workout-bg.jpg')" }}>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-black/45 to-transparent" />

                            </div>

                            <CardContent className="p-6 pt-0 relative">
                                {/* Avatar & Details Section */}
                                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 mb-6 px-4">
                                    <div className="relative group/avatar">
                                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-red-600 via-purple-600 to-orange-500 opacity-40 group-hover/avatar:opacity-80 blur transition-opacity" />
                                        <Avatar className="w-32 h-32 rounded-2xl border-4 border-[#0d0d0d] relative z-10 shadow-2xl">
                                            <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                                            <AvatarFallback className="bg-primary/10 text-primary text-3xl font-black rounded-2xl">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>

                                        <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 rounded-2xl cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 backdrop-blur-sm">
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

                                    {/* Name & Badges */}
                                    <div className="text-center sm:text-left flex-1 space-y-1 md:pb-2">
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                                            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
                                                {profile?.full_name || profile?.username || "SmartFit Warrior"}
                                            </h1>

                                        </div>

                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2.5 sm:-mt-12">
                                        <Button onClick={handleOpenEdit} size="sm" className="rounded-full px-5 bg-red-600 hover:bg-red-700 text-white transition-transform hover:scale-105 active:scale-95 text-xs font-bold animate-shimmer">
                                            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                                            Edit Profile
                                        </Button>
                                        <Button variant="outline" size="sm" className="rounded-full px-5 hover:bg-white/5 transition-all text-xs font-bold border-white/10 text-white" onClick={() => navigate('/settings')}>
                                            <Settings className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                                            Settings
                                        </Button>
                                    </div>
                                </div>

                                {/* Custom Scrollable Tab Navigation */}
                                <div className="border-t border-white/10 -mx-6 mt-6 flex overflow-x-auto no-scrollbar scroll-smooth">
                                    {[
                                        { id: "summary", label: "Summary" },
                                        { id: "biometrics", label: "Biometrics" },
                                        { id: "workouts", label: "Workouts" },
                                        { id: "progress", label: "Progress" },
                                        { id: "activity", label: "Activity" }
                                    ].map((tab) => {
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all duration-300 relative whitespace-nowrap ${
                                                    isActive
                                                        ? "border-red-600 text-white bg-white/5"
                                                        : "border-transparent text-muted-foreground hover:text-white hover:bg-white/2"
                                                }`}
                                            >
                                                {tab.label}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeTabUnderline"
                                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600 shadow-[0_0_10px_#ef4444]"
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* DYNAMIC TAB SECTIONS */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            variants={tabContentVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-6"
                        >
                            {/* SUMMARY TAB */}
                            {activeTab === "summary" && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                    {/* Left summary cards (Goal & Bio) */}
                                    <div className="col-span-1 lg:col-span-4 space-y-6">
                                        {/* Fitness Vision Card */}
                                        <Card className="glass border-white/10 rounded-2xl p-5">
                                            <CardHeader className="p-0 pb-3 border-b border-white/5">
                                                <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                                                    <Target className="w-4 h-4 text-red-500" />
                                                    Fitness Protocol & Vision
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0 pt-4 space-y-3">
                                                <div>
                                                    <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground block">Active Goal</span>
                                                    <span className="text-lg font-black text-red-500 uppercase tracking-tight">
                                                        {profile?.fitness_goal || "Not Set"}
                                                    </span>
                                                </div>
                                                {profile?.bio && (
                                                    <div>
                                                        <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground block">Identity status</span>
                                                        <p className="text-xs text-gray-300 leading-relaxed mt-1 italic">
                                                            "{profile.bio}"
                                                        </p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Heatmap Card */}
                                    <div className="col-span-1 lg:col-span-8">
                                        {renderHeatmap()}
                                    </div>
                                </div>
                            )}

                            {/* BIOMETRICS TAB */}
                            {activeTab === "biometrics" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <motion.div variants={itemVariants}>
                                        <Card className="glass border-white/10 rounded-3xl overflow-hidden h-full flex flex-col justify-between">
                                            <CardHeader className="pb-3 border-b border-white/5">
                                                <CardTitle className="text-sm font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                                                    <User className="w-4 h-4 text-red-500" />
                                                    Biometric Parameters
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0 flex-1 flex flex-col justify-center">
                                                <div className="grid grid-cols-2 divide-x divide-y divide-white/5 text-center">
                                                    {[
                                                        { label: "Age", value: profile?.age || "--", suffix: " Yrs", color: "text-blue-400" },
                                                        { label: "Weight", value: profile?.weight || "--", suffix: " Kg", color: "text-green-400" },
                                                        { label: "Height", value: profile?.height || "--", suffix: " Cm", color: "text-purple-400" },
                                                        { label: "Fitness Goal", value: (profile?.fitness_goal || "Not Set").split(' ')[0], suffix: "", color: "text-orange-400" }
                                                    ].map((stat, idx) => (
                                                        <div key={idx} className="p-6 flex flex-col justify-center items-center">
                                                            <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-1.5">{stat.label}</span>
                                                            <span className={`text-2xl font-black ${stat.color}`}>
                                                                {stat.value}
                                                                <span className="text-xs font-normal text-muted-foreground ml-0.5">{stat.suffix}</span>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <Card className="glass border-white/10 rounded-3xl overflow-hidden h-full flex flex-col justify-between animate-fade-in">
                                            <CardHeader className="pb-3 border-b border-white/5">
                                                <CardTitle className="text-sm font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-red-500" />
                                                    Gym Attendance
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
                                                <div className="grid grid-cols-2 gap-4 text-center">
                                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-center items-center">
                                                        <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground block mb-1">Total Visits</span>
                                                        <span className="text-2xl font-black text-red-500">{totalCheckIns}</span>
                                                    </div>
                                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-center items-center">
                                                        <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground block mb-1">Active Streak</span>
                                                        <span className="text-2xl font-black text-orange-500 flex items-center justify-center gap-1">
                                                            <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                                                            {streak.currentStreak}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 pt-2">
                                                    {hasCheckedInToday ? (
                                                        <Button 
                                                            disabled 
                                                            className="w-full py-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
                                                        >
                                                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                            Checked In Today 🎉
                                                        </Button>
                                                    ) : (
                                                        <Button 
                                                            onClick={handleGymCheckIn}
                                                            className="w-full py-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-shimmer"
                                                        >
                                                            <Zap className="w-4 h-4 text-white animate-bounce" />
                                                            Check In Today
                                                        </Button>
                                                    )}
                                                    <p className="text-[10px] text-center text-muted-foreground/60">
                                                        {hasCheckedInToday 
                                                            ? "Awesome job! Come back tomorrow to keep your streak alive." 
                                                            : "Tap check-in to register today's session and update your consistency heatmap."
                                                        }
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </div>
                            )}

                            {/* WORKOUTS TAB */}
                            {activeTab === "workouts" && (
                                <div className="grid grid-cols-1 gap-8 animate-fade-in">
                                    {/* Completed Workout Sessions Grid */}
                                    <motion.div variants={itemVariants}>
                                        <Card className="glass border-white/10 rounded-3xl overflow-hidden flex flex-col">
                                            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5">
                                                <CardTitle className="text-sm font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                                                    <Trophy className="w-4 h-4 text-red-500" />
                                                    Completed Workout Sessions
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                {completedWorkouts.length === 0 ? (
                                                    <div className="py-12 text-center space-y-3">
                                                        <Flame className="w-10 h-10 text-muted-foreground/45 mx-auto animate-pulse" />
                                                        <div>
                                                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">No completed workouts yet</p>
                                                            <p className="text-xs text-muted-foreground/60 mt-1">Start pose-detection training or log a manual session in the Progress page!</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                        {completedWorkouts.map((workout: any) => (
                                                            <Card
                                                                key={workout.id}
                                                                className="bg-black/40 border-white/5 hover:border-red-500/30 transition-all flex flex-col justify-between rounded-2xl overflow-hidden"
                                                            >
                                                                <CardHeader className="pb-3 p-4">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="min-w-0 flex-1">
                                                                            <span className="text-[9px] text-red-500 uppercase font-black tracking-widest block">
                                                                                {workout.date}
                                                                            </span>
                                                                            <CardTitle className="text-base font-black uppercase tracking-tight mt-1 truncate text-white">
                                                                                {workout.routineName}
                                                                            </CardTitle>
                                                                        </div>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => deleteWorkout(workout.id)}
                                                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0 h-8 w-8 rounded-full"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </CardHeader>
                                                                <CardContent className="space-y-4 p-4 pt-0">
                                                                    {/* Quick Stats Grid */}
                                                                    <div className="grid grid-cols-2 gap-2 bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                                                                        <div>
                                                                            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Time</p>
                                                                            <p className="text-xs font-black text-gray-200 mt-0.5">{workout.duration}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Sets</p>
                                                                            <p className="text-xs font-black text-gray-200 mt-0.5">{workout.sets}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Volume</p>
                                                                            <p className="text-xs font-black text-gray-200 mt-0.5">{workout.volume}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Calories</p>
                                                                            <p className="text-xs font-black text-gray-200 mt-0.5">~{workout.kcal} kcal</p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Action Button */}
                                                                    <Button
                                                                        onClick={() => setSelectedWorkoutForCard(workout)}
                                                                        className="w-full font-bold flex items-center justify-center gap-1.5 border-white/10 hover:bg-white/5 text-[10px] h-8 rounded-lg text-white"
                                                                        variant="outline"
                                                                    >
                                                                        <Sparkles className="w-3.5 h-3.5 text-red-500" />
                                                                        View Share Card
                                                                    </Button>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>

                                    {/* Gym Check-Ins & Activity Log */}
                                    <motion.div variants={itemVariants}>
                                        <Card className="glass border-white/10 rounded-3xl overflow-hidden flex flex-col">
                                            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5">
                                                <CardTitle className="text-sm font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                                                    <Dumbbell className="w-4 h-4 text-red-500" />
                                                    Activity Log & History
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                {allWorkouts.length === 0 ? (
                                                    <div className="py-12 text-center space-y-3">
                                                        <BookOpen className="w-10 h-10 text-muted-foreground/45 mx-auto" />
                                                        <div>
                                                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">No Records</p>
                                                            <p className="text-xs text-muted-foreground/60 mt-1">Generate a workout or check in to begin tracking your activity history.</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {allWorkouts.map((workout) => (
                                                            <div
                                                                key={workout.id}
                                                                className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 group/workout transition-all cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-white/5 group-hover/workout:scale-105 transition-transform">
                                                                        {workout.title === "Gym Check-In" ? (
                                                                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                                                                        ) : (
                                                                            <Dumbbell className="w-5 h-5 text-red-500" />
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h4 className="font-bold text-sm truncate uppercase tracking-tight text-gray-200">{workout.title}</h4>
                                                                        <span className="text-[10px] font-bold text-muted-foreground block mt-0.5">
                                                                            {new Date(workout.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
                                </div>
                            )}

                            {/* PROGRESS TAB */}
                            {activeTab === "progress" && (
                                <div className="grid grid-cols-1 gap-6">
                                    <motion.div variants={itemVariants}>
                                        <Card className="glass border-white/10 rounded-3xl overflow-hidden">
                                            <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
                                                <CardTitle className="text-sm font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4 text-red-500" />
                                                    Neural Progress Track (Weight Trend)
                                                </CardTitle>
                                                <Link to="/progress">
                                                    <Button variant="ghost" size="xs" className="text-[10px] font-bold rounded-full border border-white/10 px-2.5 h-6">
                                                        VIEW DETAILED DASHBOARD
                                                    </Button>
                                                </Link>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                {progressLogs.length === 0 ? (
                                                    <div className="py-12 text-center space-y-3">
                                                        <Activity className="w-10 h-10 text-muted-foreground/45 mx-auto" />
                                                        <div>
                                                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">No Sync Logs Found</p>
                                                            <p className="text-xs text-muted-foreground/60 mt-1">Log your weight in the dashboard to populate neural data.</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div className="h-64 w-full mt-2">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <AreaChart data={progressLogs}>
                                                                    <defs>
                                                                        <linearGradient id="profileWeightGradient" x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                                                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                                        </linearGradient>
                                                                    </defs>
                                                                    <XAxis 
                                                                        dataKey="date" 
                                                                        stroke="#666" 
                                                                        fontSize={10}
                                                                        tickFormatter={(str) => {
                                                                            try {
                                                                                const date = new Date(str);
                                                                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                                            } catch {
                                                                                return str;
                                                                            }
                                                                        }}
                                                                    />
                                                                    <YAxis 
                                                                        stroke="#666" 
                                                                        fontSize={10} 
                                                                        domain={['auto', 'auto']}
                                                                        tickFormatter={(v) => `${v}kg`}
                                                                    />
                                                                    <RechartsTooltip
                                                                        contentStyle={{
                                                                            backgroundColor: '#0a0a0a',
                                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                                            borderRadius: '12px'
                                                                        }}
                                                                        labelStyle={{ color: '#888', fontSize: '10px', fontWeight: 'bold' }}
                                                                        itemStyle={{ color: '#ef4444', fontSize: '11px', fontWeight: 'bold' }}
                                                                    />
                                                                    <Area
                                                                        type="monotone"
                                                                        dataKey="weight"
                                                                        stroke="#ef4444"
                                                                        strokeWidth={2}
                                                                        fill="url(#profileWeightGradient)"
                                                                    />
                                                                </AreaChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </div>
                            )}

                            {/* ACTIVITY TAB */}
                            {activeTab === "activity" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* STREAK WIDGET */}
                                    <motion.div variants={itemVariants}>
                                        <Card className="glass border-orange-500/20 overflow-hidden relative group rounded-2xl h-full">
                                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <CardContent className="p-6 flex items-center justify-between relative z-10">
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
                                        <Card className="glass border-red-500/20 p-6 rounded-2xl flex flex-col justify-between h-full">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Neural Level</p>
                                                    <p className="text-xl font-black text-red-500">Level {(profile as any)?.level || 1}</p>
                                                </div>
                                                <div className="p-2 bg-red-500/15 rounded-xl">
                                                    <Zap className="w-5 h-5 text-red-500" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className="text-muted-foreground uppercase">Experience</span>
                                                    <span className="text-white">{(profile as any)?.xp || 0} XP</span>
                                                </div>
                                                <Progress value={((profile as any)?.xp || 0) % 100} className="h-1.5 bg-red-500/10" />
                                            </div>
                                        </Card>
                                    </motion.div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
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
            {/* Share Card Modal (View Only) */}
            <Dialog
                open={!!selectedWorkoutForCard}
                onOpenChange={(open) => !open && setSelectedWorkoutForCard(null)}
            >
                <DialogContent className="bg-gray-950 border border-white/10 text-white rounded-3xl p-6 flex flex-col items-center justify-between max-w-sm">
                    <DialogHeader className="w-full text-center">
                        <DialogTitle className="text-xl font-black">Your Share Card</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Download or share this card to show off your progress.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedWorkoutForCard && (
                        <div className="my-6">
                            <div id="workout-summary-card-capture-view">
                                <WorkoutSummaryCard 
                                    data={selectedWorkoutForCard} 
                                    className="w-[320px]" 
                                    userName={profile?.full_name || profile?.username || "SmartFit Warrior"}
                                    userAvatarInitials={initials}
                                    userSubtitle={profile?.fitness_goal || "SmartFit Elite"}
                                />
                            </div>
                        </div>
                    )}

                    <div className="w-full grid grid-cols-2 gap-3">
                        <Button
                            onClick={async () => {
                                const cardEl = document.getElementById("workout-summary-card-capture-view");
                                if (!cardEl) return;
                                try {
                                    const dataUrl = await toPng(cardEl, {
                                        cacheBust: true,
                                        useCORS: true,
                                        quality: 1.0,
                                        pixelRatio: 2
                                    });
                                    const link = document.createElement("a");
                                    link.download = `smartfit-workout-${Date.now()}.png`;
                                    link.href = dataUrl;
                                    link.click();
                                    toast.success("Card downloaded!");
                                } catch (e) {
                                    toast.error("Failed to export image");
                                }
                            }}
                            variant="outline"
                            className="font-bold border-white/10 hover:bg-white/5"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </Button>
                        <Button
                            onClick={async () => {
                                const cardEl = document.getElementById("workout-summary-card-capture-view");
                                if (!cardEl) return;
                                try {
                                    const dataUrl = await toPng(cardEl, {
                                        cacheBust: true,
                                        useCORS: true,
                                        quality: 0.95,
                                        pixelRatio: 2
                                    });
                                    const res = await fetch(dataUrl);
                                    const blob = await res.blob();
                                    const file = new File([blob], `workout-summary.png`, { type: "image/png" });
                                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                        await navigator.share({
                                            files: [file],
                                            title: "My SmartFit Workout Card"
                                        });
                                    } else {
                                        const link = document.createElement("a");
                                        link.download = `smartfit-workout-${Date.now()}.png`;
                                        link.href = dataUrl;
                                        link.click();
                                    }
                                } catch (e) {
                                    toast.error("Failed to share");
                                }
                            }}
                            variant="outline"
                            className="font-bold border-white/10 hover:bg-white/5"
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
