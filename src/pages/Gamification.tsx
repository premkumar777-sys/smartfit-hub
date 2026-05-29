import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Trophy, Flame, Star, Target, Zap, Crown, Medal,
    Award, Dumbbell, Heart, Timer, TrendingUp, Users, Sparkles,
    CheckCircle2, Lock, Calendar, MessageCircle, BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamification, ACHIEVEMENTS, getLevelFromXP, getXPForNextLevel, AchievementId } from "@/hooks/useGamification";

// Icon mapping for achievements
const achievementIcons: Record<string, React.ElementType> = {
    "first-workout": Dumbbell,
    "streak-3": Flame,
    "streak-7": Calendar,
    "streak-30": Crown,
    "workout-10": Target,
    "workout-50": Medal,
    "workout-100": Trophy,
    "chat-starter": MessageCircle,
    "progress-logger": BarChart3,
};


// Helper functions for UI
const getRarityColor = (rarity: string) => {
    switch (rarity) {
        case "common": return "from-gray-400 to-gray-500";
        case "rare": return "from-blue-400 to-blue-600";
        case "epic": return "from-purple-400 to-purple-600";
        case "legendary": return "from-yellow-400 to-orange-500";
        default: return "from-gray-400 to-gray-500";
    }
};

const getRarityBorder = (rarity: string) => {
    switch (rarity) {
        case "common": return "border-gray-500/50";
        case "rare": return "border-blue-500/50";
        case "epic": return "border-purple-500/50";
        case "legendary": return "border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]";
        default: return "border-gray-500/50";
    }
};

export default function Gamification() {
    const gamification = useGamification();
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [animateXP, setAnimateXP] = useState(false);

    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);

    const fetchLeaderboard = useCallback(async () => {
        setIsLoadingLeaderboard(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data, error } = await supabase
                .from("leaderboard" as any)
                .select("id, username, xp, level, streak, avatar_emoji")
                .order("xp", { ascending: false })
                .limit(10);

            if (error) throw error;

            if (data) {
                const formattedData = data.map((profile: any, index: number) => ({
                    rank: index + 1,
                    name: profile.username || "Anonymous Hero",
                    xp: profile.xp || 0,
                    level: profile.level || 1,
                    streak: profile.streak || 0,
                    avatar: profile.avatar_emoji || "👤",
                    isCurrentUser: session?.user?.id === profile.id
                }));
                setLeaderboard(formattedData);
            }
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setIsLoadingLeaderboard(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    // Build achievements with unlock status from hook
    const achievements = ACHIEVEMENTS.map(a => ({
        ...a,
        icon: achievementIcons[a.id] || Award,
        unlocked: gamification.unlockedAchievements.includes(a.id as AchievementId),
    }));

    const filteredAchievements = selectedCategory === "all"
        ? achievements
        : achievements.filter(a => a.category === selectedCategory);

    const unlockedCount = gamification.unlockedAchievements.length;

    useEffect(() => {
        setAnimateXP(true);
        const timer = setTimeout(() => setAnimateXP(false), 1000);
        return () => clearTimeout(timer);
    }, [gamification.xp]);

    if (!gamification.isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-16 relative overflow-hidden">
            <div className="absolute inset-0 gradient-hero opacity-15" />
            <Container className="relative z-10">
                <Link
                    to="/"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Link>

                {/* Header */}
                <div className="text-center space-y-4 mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-2">
                        <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold">
                        <span className="text-gradient">Gamified</span> Training
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Level up your fitness journey! Earn XP, unlock achievements, and compete with others.
                    </p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Level & XP Card */}
                    <Card className="glass border-primary/20 col-span-2">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <motion.div
                                    className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-green-400 flex items-center justify-center text-2xl font-bold text-black"
                                    animate={animateXP ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ duration: 0.5 }}
                                >
                                    {gamification.level}
                                </motion.div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">Level {gamification.level}</span>
                                        <span className="text-sm text-primary font-medium">{gamification.xpToNextLevel} XP to next</span>
                                    </div>
                                    <Progress value={gamification.xpProgress} className="h-3" />
                                    <div className="flex justify-between mt-1">
                                        <span className="text-xs text-muted-foreground">{gamification.xp.toLocaleString()} XP</span>
                                        <span className="text-xs text-muted-foreground">{getXPForNextLevel(gamification.level).toLocaleString()} XP</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="text-sm text-muted-foreground">
                                    {gamification.totalWorkouts > 0
                                        ? `${gamification.totalWorkouts} workouts completed!`
                                        : "Start training to earn XP!"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Streak Card */}
                    <Card className="glass border-orange-500/30">
                        <CardContent className="p-6 text-center">
                            <motion.div
                                animate={gamification.currentStreak > 0 ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ duration: 1, repeat: Infinity }}
                                className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${gamification.currentStreak > 0
                                    ? "bg-gradient-to-br from-orange-500 to-red-500"
                                    : "bg-gray-700"
                                    }`}
                            >
                                <Flame className={`w-6 h-6 ${gamification.currentStreak > 0 ? "text-white" : "text-gray-500"}`} />
                            </motion.div>
                            <div className={`text-3xl font-bold ${gamification.currentStreak > 0 ? "text-orange-500" : "text-gray-500"}`}>
                                {gamification.currentStreak}
                            </div>
                            <div className="text-sm text-muted-foreground">Day Streak</div>
                            <div className="mt-2 text-xs text-orange-400">
                                {gamification.currentStreak >= 7 ? "🔥 You're on fire!" :
                                    gamification.currentStreak >= 3 ? "🌟 Keep it up!" :
                                        gamification.currentStreak > 0 ? "💪 Good start!" : "Start your streak!"}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Achievements Card */}
                    <Card className="glass border-purple-500/30">
                        <CardContent className="p-6 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-3">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-3xl font-bold text-purple-500">{unlockedCount}/{ACHIEVEMENTS.length}</div>
                            <div className="text-sm text-muted-foreground">Achievements</div>
                            <div className="mt-2 text-xs text-purple-400">
                                {unlockedCount === ACHIEVEMENTS.length ? "🏆 All unlocked!" : "Keep going!"}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Achievements Section */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card className="glass border-primary/20">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Trophy className="w-5 h-5 text-primary" />
                                            Achievements
                                        </CardTitle>
                                        <CardDescription>Unlock badges by completing challenges</CardDescription>
                                    </div>
                                </div>
                                {/* Category Filter */}
                                <div className="flex flex-wrap gap-2 pt-4">
                                    {["all", "workout", "streak", "milestone", "social"].map((cat) => (
                                        <Button
                                            key={cat}
                                            variant={selectedCategory === cat ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSelectedCategory(cat)}
                                            className="capitalize"
                                        >
                                            {cat}
                                        </Button>
                                    ))}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <AnimatePresence>
                                        {filteredAchievements.map((achievement, index) => (
                                            <motion.div
                                                key={achievement.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`relative p-4 rounded-xl border-2 ${getRarityBorder(achievement.rarity)} ${achievement.unlocked
                                                    ? "bg-gray-800/50"
                                                    : "bg-gray-900/30 opacity-60"
                                                    }`}
                                            >
                                                {/* Rarity indicator */}
                                                <Badge
                                                    className={`absolute -top-2 -right-2 text-[10px] bg-gradient-to-r ${getRarityColor(achievement.rarity)} border-0`}
                                                >
                                                    {achievement.rarity}
                                                </Badge>

                                                <div className="text-center">
                                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${achievement.unlocked
                                                        ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)}`
                                                        : "bg-gray-700"
                                                        }`}>
                                                        {achievement.unlocked ? (
                                                            <achievement.icon className="w-6 h-6 text-white" />
                                                        ) : (
                                                            <Lock className="w-5 h-5 text-gray-500" />
                                                        )}
                                                    </div>
                                                    <h4 className="font-semibold text-sm mb-1">{achievement.name}</h4>
                                                    <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                                                    <div className="flex items-center justify-center gap-1 text-xs">
                                                        <Zap className="w-3 h-3 text-yellow-500" />
                                                        <span className="text-yellow-500">+{achievement.xpReward} XP</span>
                                                    </div>
                                                    {achievement.unlocked && (
                                                        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-500">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Unlocked
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Leaderboard Section */}
                    <div className="space-y-4">
                        <Card className="glass border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    Leaderboard
                                </CardTitle>
                                <CardDescription>Weekly rankings</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-800">
                                    {leaderboard.map((entry, index) => (
                                        <motion.div
                                            key={`${entry.name}-${entry.rank}`}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`flex items-center gap-3 p-4 ${entry.isCurrentUser ? "bg-primary/10" : ""
                                                }`}
                                        >
                                            {/* Rank */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${entry.rank === 1 ? "bg-yellow-500 text-black" :
                                                entry.rank === 2 ? "bg-gray-300 text-black" :
                                                    entry.rank === 3 ? "bg-amber-600 text-white" :
                                                        "bg-gray-700 text-gray-300"
                                                }`}>
                                                {entry.rank <= 3 ? (
                                                    entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"
                                                ) : entry.rank}
                                            </div>

                                            {/* Avatar & Name */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{entry.avatar}</span>
                                                    <span className={`font-medium truncate ${entry.isCurrentUser ? "text-primary" : ""}`}>
                                                        {entry.name}
                                                    </span>
                                                    {entry.isCurrentUser && (
                                                        <Badge variant="outline" className="text-xs">You</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span>Lvl {entry.level}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Flame className="w-3 h-3 text-orange-500" />
                                                        {entry.streak}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* XP */}
                                            <div className="text-right">
                                                <div className="font-bold text-primary">{entry.xp.toLocaleString()}</div>
                                                <div className="text-xs text-muted-foreground">XP</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="glass border-primary/20">
                            <CardContent className="p-6 space-y-3">
                                <h3 className="font-semibold text-center mb-4">Earn More XP</h3>
                                <Button asChild variant="hero" className="w-full">
                                    <Link to="/ai-workout">
                                        <Dumbbell className="w-4 h-4 mr-2" />
                                        Generate Workout (+75 XP)
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full">
                                    <Link to="/ai-trainer">
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        Chat with AI (+15 XP)
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full">
                                    <Link to="/progress">
                                        <BarChart3 className="w-4 h-4 mr-2" />
                                        Log Progress (+25 XP)
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </Container>
        </div>
    );
}
