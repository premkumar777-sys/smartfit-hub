import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Types
export type AchievementId =
    | "first-workout"
    | "streak-3"
    | "streak-7"
    | "streak-30"
    | "workout-10"
    | "workout-50"
    | "workout-100"
    | "early-bird"
    | "night-owl"
    | "social-share"
    | "cardio-king"
    | "perfect-form"
    | "chat-starter"
    | "progress-logger";

export type GamificationData = {
    xp: number;
    totalWorkouts: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
    unlockedAchievements: AchievementId[];
    chatSessions: number;
    progressLogs: number;
    lastProgressLogDate: string | null;
};

const STORAGE_KEY = "smartfit-gamification";

const defaultData: GamificationData = {
    xp: 0,
    totalWorkouts: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    unlockedAchievements: [],
    chatSessions: 0,
    progressLogs: 0,
    lastProgressLogDate: null,
};

// XP rewards for different actions
export const XP_REWARDS = {
    WORKOUT_GENERATED: 75,
    WORKOUT_COMPLETED: 100,
    CHAT_SESSION: 15,
    PROGRESS_LOG: 25,
    DAILY_LOGIN: 10,
    STREAK_BONUS: 5, // per day of streak
} as const;

// Achievement definitions
export const ACHIEVEMENTS = [
    { id: "first-workout" as AchievementId, name: "First Steps", description: "Complete your first workout", xpReward: 50, category: "workout", rarity: "common" },
    { id: "streak-3" as AchievementId, name: "On Fire", description: "Maintain a 3-day streak", xpReward: 100, category: "streak", rarity: "common" },
    { id: "streak-7" as AchievementId, name: "Week Warrior", description: "Maintain a 7-day streak", xpReward: 250, category: "streak", rarity: "rare" },
    { id: "streak-30" as AchievementId, name: "Monthly Master", description: "Maintain a 30-day streak", xpReward: 1000, category: "streak", rarity: "legendary" },
    { id: "workout-10" as AchievementId, name: "Getting Serious", description: "Complete 10 workouts", xpReward: 200, category: "milestone", rarity: "common" },
    { id: "workout-50" as AchievementId, name: "Dedicated", description: "Complete 50 workouts", xpReward: 500, category: "milestone", rarity: "rare" },
    { id: "workout-100" as AchievementId, name: "Century Club", description: "Complete 100 workouts", xpReward: 1000, category: "milestone", rarity: "epic" },
    { id: "chat-starter" as AchievementId, name: "Chat Starter", description: "Have 5 AI trainer sessions", xpReward: 75, category: "social", rarity: "common" },
    { id: "progress-logger" as AchievementId, name: "Progress Logger", description: "Log your progress 5 times", xpReward: 100, category: "milestone", rarity: "common" },
] as const;

// Helper functions
export const getLevelFromXP = (xp: number): number => Math.floor(xp / 300) + 1;
export const getXPForNextLevel = (level: number): number => level * 300;
export const getXPProgress = (xp: number): number => {
    const currentLevel = getLevelFromXP(xp);
    const xpForCurrentLevel = (currentLevel - 1) * 300;
    const xpForNextLevel = currentLevel * 300;
    return ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
};

export function useGamification() {
    const [data, setData] = useState<GamificationData>(defaultData);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load data from Supabase and localStorage on mount
    useEffect(() => {
        const loadData = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            // Try loading from localStorage first for immediate UI
            const stored = localStorage.getItem(STORAGE_KEY);
            let initialData = defaultData;
            if (stored) {
                try {
                    initialData = { ...defaultData, ...JSON.parse(stored) };
                } catch (e) {
                    console.error("Error parsing stored gamification data", e);
                }
            }

            if (session) {
                // Fetch from Supabase
                const { data: profile, error } = await supabase
                    .from("profiles")
                    .select("xp, level, streak, avatar_emoji, total_workouts, chat_sessions, progress_logs")
                    .eq("id", session.user.id)
                    .single();

                if (!error && profile) {
                    initialData = {
                        ...initialData,
                        xp: profile.xp || initialData.xp,
                        currentStreak: profile.streak || initialData.currentStreak,
                        totalWorkouts: profile.total_workouts || initialData.totalWorkouts,
                        chatSessions: profile.chat_sessions || initialData.chatSessions,
                        progressLogs: profile.progress_logs || initialData.progressLogs,
                    };
                }
            }

            setData(initialData);
            setIsLoaded(true);
        };

        loadData();
    }, []);

    // Save data to Supabase and localStorage
    useEffect(() => {
        if (!isLoaded) return;

        const saveData = async () => {
            // Always save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

            // Save basic stats to profiles table if authenticated
            // This is a subset for quick dashboard access
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const level = getLevelFromXP(data.xp);
                await supabase
                    .from("profiles")
                    .update({
                        xp: data.xp,
                        level: level,
                        streak: data.currentStreak,
                        total_workouts: data.totalWorkouts,
                        chat_sessions: data.chatSessions,
                        progress_logs: data.progressLogs
                    })
                    .eq("id", session.user.id);
            }
        };

        saveData();
    }, [data, isLoaded]);

    /**
     * Helper to log activity to activity_logs table for charts/history
     */
    const logActivity = useCallback(async (type: 'workout' | 'nutrition' | 'chat' | 'progress', value: number = 0, metadata: any = {}) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase.from('activity_logs').insert({
            user_id: session.user.id,
            activity_type: type,
            value: value,
            metadata: metadata
        });
    }, []);

    // Check and update streak
    const updateStreak = useCallback(() => {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        setData(prev => {
            if (prev.lastActivityDate === today) {
                // Already logged activity today
                return prev;
            }

            let newStreak = prev.currentStreak;

            if (prev.lastActivityDate === yesterday) {
                // Consecutive day - increase streak
                newStreak = prev.currentStreak + 1;
            } else if (prev.lastActivityDate !== today) {
                // Streak broken - reset to 1
                newStreak = 1;
            }

            return {
                ...prev,
                currentStreak: newStreak,
                longestStreak: Math.max(newStreak, prev.longestStreak),
                lastActivityDate: today,
            };
        });
    }, []);

    // Check for new achievements to unlock
    const checkAchievements = useCallback((updatedData: GamificationData): AchievementId[] => {
        const newlyUnlocked: AchievementId[] = [];

        // Check workout milestones
        if (updatedData.totalWorkouts >= 1 && !updatedData.unlockedAchievements.includes("first-workout")) {
            newlyUnlocked.push("first-workout");
        }
        if (updatedData.totalWorkouts >= 10 && !updatedData.unlockedAchievements.includes("workout-10")) {
            newlyUnlocked.push("workout-10");
        }
        if (updatedData.totalWorkouts >= 50 && !updatedData.unlockedAchievements.includes("workout-50")) {
            newlyUnlocked.push("workout-50");
        }
        if (updatedData.totalWorkouts >= 100 && !updatedData.unlockedAchievements.includes("workout-100")) {
            newlyUnlocked.push("workout-100");
        }

        // Check streak milestones
        if (updatedData.currentStreak >= 3 && !updatedData.unlockedAchievements.includes("streak-3")) {
            newlyUnlocked.push("streak-3");
        }
        if (updatedData.currentStreak >= 7 && !updatedData.unlockedAchievements.includes("streak-7")) {
            newlyUnlocked.push("streak-7");
        }
        if (updatedData.currentStreak >= 30 && !updatedData.unlockedAchievements.includes("streak-30")) {
            newlyUnlocked.push("streak-30");
        }

        // Check chat sessions
        if (updatedData.chatSessions >= 5 && !updatedData.unlockedAchievements.includes("chat-starter")) {
            newlyUnlocked.push("chat-starter");
        }

        // Check progress logs
        if (updatedData.progressLogs >= 5 && !updatedData.unlockedAchievements.includes("progress-logger")) {
            newlyUnlocked.push("progress-logger");
        }

        return newlyUnlocked;
    }, []);

    // Award XP for an action
    const awardXP = useCallback((amount: number, reason: string) => {
        setData(prev => {
            const newXP = prev.xp + amount;
            console.log(`[Gamification] Awarded ${amount} XP for: ${reason}. Total: ${newXP}`);
            return { ...prev, xp: newXP };
        });
    }, []);

    // Record a workout completion
    const recordWorkout = useCallback((durationMinutes: number = 45) => {
        updateStreak();
        logActivity('workout', durationMinutes);

        setData(prev => {
            const newWorkouts = prev.totalWorkouts + 1;
            const streakBonus = prev.currentStreak * XP_REWARDS.STREAK_BONUS;
            const totalXP = XP_REWARDS.WORKOUT_GENERATED + streakBonus;

            const updatedData = {
                ...prev,
                totalWorkouts: newWorkouts,
                xp: prev.xp + totalXP,
            };

            // Check for new achievements
            const newAchievements = checkAchievements(updatedData);
            if (newAchievements.length > 0) {
                const achievementXP = newAchievements.reduce((sum, id) => {
                    const achievement = ACHIEVEMENTS.find(a => a.id === id);
                    return sum + (achievement?.xpReward || 0);
                }, 0);

                updatedData.xp += achievementXP;
                updatedData.unlockedAchievements = [...prev.unlockedAchievements, ...newAchievements];
            }

            console.log(`[Gamification] Workout recorded. Total: ${newWorkouts}, XP: ${updatedData.xp}`);
            return updatedData;
        });
    }, [updateStreak, checkAchievements, logActivity]);

    // Record a chat session
    const recordChatSession = useCallback(() => {
        logActivity('chat');
        setData(prev => {
            const newSessions = prev.chatSessions + 1;

            const updatedData = {
                ...prev,
                chatSessions: newSessions,
                xp: prev.xp + XP_REWARDS.CHAT_SESSION,
            };

            // Check for chat achievement
            const newAchievements = checkAchievements(updatedData);
            if (newAchievements.length > 0) {
                const achievementXP = newAchievements.reduce((sum, id) => {
                    const achievement = ACHIEVEMENTS.find(a => a.id === id);
                    return sum + (achievement?.xpReward || 0);
                }, 0);

                updatedData.xp += achievementXP;
                updatedData.unlockedAchievements = [...prev.unlockedAchievements, ...newAchievements];
            }

            console.log(`[Gamification] Chat session recorded. Total: ${newSessions}`);
            return updatedData;
        });
    }, [checkAchievements, logActivity]);

    // Record a progress log
    const recordProgressLog = useCallback(() => {
        updateStreak();
        logActivity('progress');

        const today = new Date().toDateString();

        setData(prev => {
            const isAlreadyLoggedToday = prev.lastProgressLogDate === today;
            const newLogs = prev.progressLogs + 1;

            // Only award XP if not already logged today
            const xpToAdd = isAlreadyLoggedToday ? 0 : XP_REWARDS.PROGRESS_LOG;

            const updatedData = {
                ...prev,
                progressLogs: newLogs,
                xp: prev.xp + xpToAdd,
                lastProgressLogDate: today,
            };

            // Check for progress achievement
            const newAchievements = checkAchievements(updatedData);
            if (newAchievements.length > 0) {
                const achievementXP = newAchievements.reduce((sum, id) => {
                    const achievement = ACHIEVEMENTS.find(a => a.id === id);
                    return sum + (achievement?.xpReward || 0);
                }, 0);

                updatedData.xp += achievementXP;
                updatedData.unlockedAchievements = [...prev.unlockedAchievements, ...newAchievements];
            }

            if (xpToAdd > 0) {
                console.log(`[Gamification] Progress log recorded. XP awarded: ${xpToAdd}. Total XP: ${updatedData.xp}`);
            } else {
                console.log(`[Gamification] Progress log recorded. Daily XP limit reached.`);
            }
            return updatedData;
        });

        // Return the XP that WILL be awarded (approximate since state is async, but logic holds)
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.lastProgressLogDate === today) return 0;
        }
        return XP_REWARDS.PROGRESS_LOG;
    }, [updateStreak, checkAchievements, logActivity]);

    // Record daily login
    const recordDailyLogin = useCallback(() => {
        const today = new Date().toDateString();

        setData(prev => {
            if (prev.lastActivityDate === today) return prev;

            const updatedData = {
                ...prev,
                xp: prev.xp + XP_REWARDS.DAILY_LOGIN,
                lastActivityDate: today,
            };

            console.log(`[Gamification] Daily login recorded. XP awarded: ${XP_REWARDS.DAILY_LOGIN}`);
            return updatedData;
        });
    }, []);

    // Handle daily login XP award
    useEffect(() => {
        if (isLoaded) {
            recordDailyLogin();
        }
    }, [isLoaded, recordDailyLogin]);

    /**
     * Helper to fetch activity logs for the last 7 days
     */
    const getWeeklyActivity = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', session.user.id)
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: true });

        return data || [];
    }, []);

    // Reset all data
    const resetData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();

        // Reset state
        setData(defaultData);

        // Clear localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));

        if (session) {
            // Update Supabase profiles table
            await supabase
                .from("profiles")
                .update({
                    xp: 0,
                    level: 1,
                    streak: 0,
                    total_workouts: 0,
                    chat_sessions: 0,
                    progress_logs: 0,
                    lastActivityDate: null
                })
                .eq("id", session.user.id);
        }
    }, []);

    // Get current level
    const level = getLevelFromXP(data.xp);
    const xpProgress = getXPProgress(data.xp);
    const xpToNextLevel = getXPForNextLevel(level) - data.xp;

    return {
        // Data
        xp: data.xp,
        level,
        xpProgress,
        xpToNextLevel,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        totalWorkouts: data.totalWorkouts,
        chatSessions: data.chatSessions,
        progressLogs: data.progressLogs,
        unlockedAchievements: data.unlockedAchievements,
        isLoaded,

        // Actions
        awardXP,
        recordWorkout,
        recordChatSession,
        recordProgressLog,
        updateStreak,
        resetData,
        recordDailyLogin,
        getWeeklyActivity,
        logActivity
    };
}
