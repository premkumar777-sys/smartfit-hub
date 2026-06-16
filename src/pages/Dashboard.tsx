import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Activity, Apple, Dumbbell, Target, TrendingUp, FileText, Trash2, ArrowLeft, Loader2, Bot, Video, LineChart, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { useGamification } from "@/hooks/useGamification";
import { WorkoutSummaryData } from "@/components/WorkoutSummaryCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type ProfileBase = Tables<"profiles">;
type Profile = ProfileBase & {
  preferences?: Record<string, unknown>;
  daily_calories_target?: number;
  protein_target?: number;
  carbs_target?: number;
  fats_target?: number;
};

interface Workout {
  id: string;
  title: string;
  content: string;
  goal: string | null;
  bmi: number | null;
  created_at: string;
}

interface ActivityLog {
  id: string;
  activity_type: string;
  value: number;
  created_at: string;
}

// Helper to parse duration string (e.g., "1H 16M", "45M", "1M 15S", "20S") to minutes
const parseDurationToMinutes = (durStr: string): number => {
  if (!durStr) return 0;
  let minutes = 0;
  
  const hourMatch = durStr.match(/(\d+)\s*[hH]/);
  const minMatch = durStr.match(/(\d+)\s*[mM]/);
  const secMatch = durStr.match(/(\d+)\s*[sS]/);
  
  if (hourMatch) {
    minutes += parseInt(hourMatch[1]) * 60;
  }
  if (minMatch) {
    minutes += parseInt(minMatch[1]);
  }
  if (!hourMatch && !minMatch && secMatch) {
    minutes += Math.max(1, Math.round(parseInt(secMatch[1]) / 60));
  }
  
  if (!hourMatch && !minMatch && !secMatch) {
    const num = parseInt(durStr);
    if (!isNaN(num)) return num;
  }
  
  return minutes;
};

// Helper to parse date string or created_at to a valid Date object
const parseWorkoutDateToObj = (dateStr: string, createdAt?: string): Date => {
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  
  if (!dateStr) return new Date();
  
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;
  
  const currentYear = new Date().getFullYear();
  const parsedWithYear = new Date(`${dateStr}, ${currentYear}`);
  if (!isNaN(parsedWithYear.getTime())) return parsedWithYear;
  
  return new Date();
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const gamification = useGamification();
  const { user, isLoading: authLoading } = useAuth();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<ActivityLog[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityLog[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<WorkoutSummaryData[]>(() => {
    const saved = localStorage.getItem("smartfit_completed_workouts_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });
  const [nutritionToday, setNutritionToday] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [showCheckInReminder, setShowCheckInReminder] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const loadDashboardData = async (userId: string) => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        profileRes,
        workoutsRes,
        logsRes,
        nutritionRes,
        feedRes
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('workouts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('activity_logs').select('*').eq('user_id', userId).gte('created_at', sevenDaysAgo.toISOString()).order('created_at', { ascending: true }),
        supabase.from('nutrition_logs').select('*').eq('user_id', userId).gte('logged_at', todayStart.toISOString()),
        supabase.from('activity_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)
      ]);

      if (profileRes.error && profileRes.error.code !== 'PGRST116') {
        console.error("Profile error:", profileRes.error);
      }
      if (profileRes.data) setProfile(profileRes.data);

      if (workoutsRes.error) {
        console.error("Workouts error:", workoutsRes.error);
      } else if (workoutsRes.data) {
        setSavedWorkouts(workoutsRes.data);
      }

      if (logsRes.data) setWeeklyLogs(logsRes.data);

      if (nutritionRes.data) {
        const totals = nutritionRes.data.reduce((acc, curr) => ({
          calories: acc.calories + (curr.calories || 0),
          protein: acc.protein + (curr.protein || 0),
          carbs: acc.carbs + (curr.carbs || 0),
          fats: acc.fats + (curr.fats || 0)
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
        setNutritionToday(totals);
      }

      if (feedRes.data) setActivityFeed(feedRes.data);

      // Load completed workouts from Supabase
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
            photoUrl: row.photo_url,
            created_at: row.created_at
          }));
          setCompletedWorkouts(mapped);
          localStorage.setItem("smartfit_completed_workouts_v1", JSON.stringify(mapped));
        }
      } catch (err) {
        console.error("Failed to load completed workouts in dashboard:", err);
      }

      // Check if user checked in today
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: todayCheckIns, error: checkInError } = await supabase
          .from('workouts')
          .select('id')
          .eq('user_id', userId)
          .eq('title', 'Gym Check-In')
          .gte('created_at', todayStart.toISOString())
          .limit(1);

        const hasCheckedIn = !checkInError && todayCheckIns && todayCheckIns.length > 0;
        const alreadyPrompted = sessionStorage.getItem("smartfit_checkin_prompted") === "true";

        if (!hasCheckedIn && !alreadyPrompted) {
          setShowCheckInReminder(true);
          sessionStorage.setItem("smartfit_checkin_prompted", "true");
        }
      } catch (err) {
        console.error("Failed to check daily check-in:", err);
      }

    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);

      if (error) throw error;

      setSavedWorkouts(prev => prev.filter(w => w.id !== workoutId));
      toast({
        title: "Workout deleted",
        description: "The workout plan has been removed.",
      });
    } catch (err) {
      console.error("Error deleting workout:", err);
      toast({
        title: "Error",
        description: "Failed to delete workout.",
        variant: "destructive",
      });
    }
  };

  const handleGymCheckIn = async () => {
    if (!user) return;
    setIsCheckingIn(true);
    try {
      const checkInWorkout = {
        user_id: user.id,
        title: "Gym Check-In",
        content: `Checked in to gym session at ${new Date().toLocaleTimeString()}`,
        goal: "Attendance",
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('workouts')
        .insert([checkInWorkout])
        .select()
        .single();
        
      if (error) {
        console.error("Error logging check-in:", error);
        toast({
          title: "Check-in failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Award XP
      gamification.recordWorkout(30); // 30 minutes check-in session
      
      toast({
        title: "Checked In! 💪",
        description: "Gym check-in logged! Streak updated & 30 XP awarded.",
      });
      setShowCheckInReminder(false);
    } catch (err) {
      console.error("Check-in error:", err);
      toast({
        title: "Check-in failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else {
        loadDashboardData(user.id);
      }
    }
  }, [user, authLoading, navigate]);

  // Process weekly data for chart combining activity_logs and completed_workouts
  const weeklyChartData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const chartData = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dayName = days[date.getDay()];
      const dateString = date.toDateString();

      // Hours from activity_logs
      const logsForDay = weeklyLogs.filter(log => new Date(log.created_at).toDateString() === dateString);
      const logDuration = logsForDay
        .filter(l => l.activity_type === 'workout')
        .reduce((sum, curr) => sum + curr.value, 0);

      // Hours from completed_workouts
      const workoutsForDay = completedWorkouts.filter(workout => {
        const wDate = parseWorkoutDateToObj(workout.date, (workout as any).created_at);
        return wDate.toDateString() === dateString;
      });
      const workoutDuration = workoutsForDay.reduce((sum, w) => {
        return sum + parseDurationToMinutes(w.duration);
      }, 0);

      const totalMinutes = logDuration + workoutDuration;

      chartData.push({
        day: dayName,
        hours: totalMinutes / 60, // convert minutes to hours for chart scaling
        completed: totalMinutes > 0,
        fullDate: dateString
      });
    }
    return chartData;
  }, [weeklyLogs, completedWorkouts]);

  // Workouts this week (count of unique days with workouts in the last 7 days)
  const workoutsThisWeek = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const workoutDays = new Set<string>();

    completedWorkouts.forEach(w => {
      const wDate = parseWorkoutDateToObj(w.date, (w as any).created_at);
      if (wDate >= sevenDaysAgo) {
        workoutDays.add(wDate.toDateString());
      }
    });

    weeklyLogs
      .filter(l => l.activity_type === 'workout')
      .forEach(l => {
        const lDate = new Date(l.created_at);
        if (lDate >= sevenDaysAgo) {
          workoutDays.add(lDate.toDateString());
        }
      });

    return workoutDays.size;
  }, [weeklyLogs, completedWorkouts]);

  // Combine activity_logs and completed_workouts for a rich activity feed
  const combinedActivityFeed = useMemo(() => {
    const feed: Array<{
      id: string;
      activity_type: string;
      value: number;
      created_at: string;
      displayTitle: string;
      displayDesc: string;
    }> = [];

    // Add activity logs
    activityFeed.forEach(log => {
      let desc = 'Interacted with AI';
      if (log.activity_type === 'workout') {
        desc = `${log.value} mins session`;
      } else if (log.activity_type === 'nutrition') {
        desc = `${log.value} calories`;
      }
      
      feed.push({
        id: log.id,
        activity_type: log.activity_type,
        value: log.value,
        created_at: log.created_at,
        displayTitle: `${log.activity_type.charAt(0).toUpperCase() + log.activity_type.slice(1)} Logged`,
        displayDesc: desc
      });
    });

    // Add completed workouts
    completedWorkouts.forEach(w => {
      const wDate = parseWorkoutDateToObj(w.date, (w as any).created_at);
      feed.push({
        id: w.id || `workout-${wDate.getTime()}`,
        activity_type: 'workout',
        value: parseDurationToMinutes(w.duration),
        created_at: wDate.toISOString(),
        displayTitle: 'Workout Completed',
        displayDesc: `${w.routineName} (${w.duration})`
      });
    });

    // Sort by created_at descending and limit to 10
    return feed
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [activityFeed, completedWorkouts]);

  if (authLoading || isInitialLoading || !gamification.isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Synchronizing your dashboard...</p>
      </div>
    );
  }

  // Fallback targets if profile hasn't set them
  const preferences = profile?.preferences as Record<string, unknown> | null;
  const targets = {
    calories: (preferences?.daily_calories_target as number) || 2000,
    protein: (preferences?.protein_target as number) || 150,
    carbs: (preferences?.carbs_target as number) || 200,
    fats: (preferences?.fats_target as number) || 65
  };

  return (
    <div className="min-h-screen pt-6 pb-28 lg:py-20">
      <Container className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-2">
              Welcome Back{profile?.username ? `, ${profile.username}` : ''}! 💪
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-gray-300">
              {profile ? `Level ${gamification.level} ${gamification.currentStreak > 0 ? `• ${gamification.currentStreak} Day Streak 🔥` : "• Let's crush your goals!"}` : 'Loading...'}
            </p>
            {profile && (
              <p className="text-sm text-muted-foreground mt-2">
                Total XP: {gamification.xp.toLocaleString()} • Members since {new Date(profile.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="hero" size="lg">
              <Link to="/workout-session">
                Start Workout
              </Link>
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-accent">Goal: 5/week</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{workoutsThisWeek}/5</p>
              <p className="text-sm text-muted-foreground">Workouts This Week</p>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-accent">Lvl {gamification.level}</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{Math.round(gamification.xpProgress)}%</p>
              <p className="text-sm text-muted-foreground">Level Progress</p>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Apple className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-orange-500">Goal: {targets.calories}</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{nutritionToday.calories.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Calories Today</p>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-yellow-500">Best: {gamification.longestStreak}</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{gamification.currentStreak} days</p>
              <p className="text-sm text-muted-foreground">Current Streak</p>
            </div>
          </Card>
        </div>

        {/* Quick Access Features */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 leading-relaxed text-gray-300">
            <Target className="text-primary h-6 w-6" />
            Your Fitness Tools
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link to="/ai-workout" className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all text-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium">AI Workout</span>
            </Link>
            
            <Link to="/ai-trainer" className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all text-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium">AI Trainer</span>
            </Link>

            <Link to="/nutrition" className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-orange-500/50 hover:bg-card/80 transition-all text-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Apple className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-sm font-medium">Nutrition</span>
            </Link>

            <Link to="/3d-trainer" className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-accent/50 hover:bg-card/80 transition-all text-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6 text-accent" />
              </div>
              <span className="text-sm font-medium">3D Trainer</span>
            </Link>

            <Link to="/progress" className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all text-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <LineChart className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium">Progress</span>
            </Link>

            <Link to="/gamification" className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-yellow-500/50 hover:bg-card/80 transition-all text-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <span className="text-sm font-medium">Rewards</span>
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent/Today's Workout */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 leading-relaxed text-gray-300">
                <Dumbbell className="text-primary h-6 w-6" />
                {savedWorkouts.length > 0 ? 'Your Latest Plan' : "Today's Workout"}
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link to="/ai-workout">New Plan</Link>
              </Button>
            </div>

            {savedWorkouts.length > 0 ? (
              <div className="space-y-4">
                <div className="p-6 rounded-xl border border-primary/20 bg-primary/5">
                  <h3 className="text-xl font-bold mb-2">{savedWorkouts[0].title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3 leading-relaxed">
                    {savedWorkouts[0].content}
                  </p>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link to="/workout-session">Start This Session</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No active workout plan found.</p>
                <Button asChild variant="outline">
                  <Link to="/ai-workout">Generate AI Workout</Link>
                </Button>
              </div>
            )}
          </Card>

          {/* Nutrition Overview */}
          <Card>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 leading-relaxed text-gray-300">
              <Apple className="text-orange-500 h-6 w-6" />
              Nutrition Today
            </h2>

            <div className="space-y-6">
              {[
                { name: "Protein", current: nutritionToday.protein, target: targets.protein, color: "bg-primary", unit: "g" },
                { name: "Carbs", current: nutritionToday.carbs, target: targets.carbs, color: "bg-accent", unit: "g" },
                { name: "Fats", current: nutritionToday.fats, target: targets.fats, color: "bg-yellow-500", unit: "g" },
              ].map((macro) => (
                <div key={macro.name}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium leading-relaxed text-gray-300">{macro.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {macro.current}/{macro.target}{macro.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${macro.color} transition-all duration-500`}
                      style={{ width: `${Math.min(100, (macro.current / macro.target) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-3xl font-bold mb-1">{nutritionToday.calories.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Calories consumed</p>
                  <p className={`text-xs mt-1 ${targets.calories - nutritionToday.calories < 0 ? 'text-red-500' : 'text-accent'}`}>
                    {targets.calories - nutritionToday.calories < 0
                      ? `${Math.abs(targets.calories - nutritionToday.calories)} over limit`
                      : `${targets.calories - nutritionToday.calories} remaining`}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Saved Workouts history */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 leading-relaxed text-gray-300">
              <FileText className="text-primary h-6 w-6" />
              Saved Workout History
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/ai-workout">Generate More</Link>
            </Button>
          </div>

          {savedWorkouts.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {savedWorkouts.slice(1).map((workout) => (
                <div
                  key={workout.id}
                  className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-all flex justify-between items-start"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{workout.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(workout.created_at).toLocaleDateString()} • {workout.goal?.replace('-', ' ')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWorkout(workout.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground italic">No workout history yet</p>
            </div>
          )}
        </Card>

        {/* Weekly Progress Chart */}
        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 leading-relaxed text-gray-300">
                <Activity className="text-primary h-6 w-6" />
                Weekly Training Time
              </h2>
              <p className="text-sm text-muted-foreground">Daily hours spent training</p>
            </div>

            <div className="flex items-end justify-between h-48 gap-4 pt-4">
              {weeklyChartData.map((day) => (
                <div key={day.fullDate} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-40">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 hover:scale-x-105 ${day.completed ? 'gradient-primary shadow-[0_0_15px_rgba(0,255,156,0.3)]' : 'bg-muted/30'
                        }`}
                      style={{ height: `${Math.min(100, Math.max(5, (day.hours / 3) * 100))}%` }} // Max scale 3 hours
                      title={`${day.day}: ${(day.hours * 60).toFixed(0)} mins`}
                    ></div>
                  </div>
                  <span className="text-sm font-medium leading-relaxed text-gray-300">{day.day}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 leading-relaxed text-gray-300">
                <Activity className="text-accent h-6 w-6" />
                Activity Feed
              </h2>
            </div>

            <div className="space-y-4">
              {combinedActivityFeed.length > 0 ? (
                combinedActivityFeed.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg bg-muted/20 border border-white/5">
                    <div className={`mt-1 p-2 rounded-lg ${log.activity_type === 'workout' ? 'bg-primary/20 text-primary' :
                      log.activity_type === 'nutrition' ? 'bg-orange-500/20 text-orange-500' :
                        log.activity_type === 'chat' ? 'bg-accent/20 text-accent' :
                          'bg-gray-500/20 text-gray-400'
                      }`}>
                      {log.activity_type === 'workout' ? <Dumbbell className="w-4 h-4" /> :
                        log.activity_type === 'nutrition' ? <Apple className="w-4 h-4" /> :
                          log.activity_type === 'chat' ? <Activity className="w-4 h-4" /> :
                            <Activity className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{log.displayTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.displayDesc}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground italic">No activity logs yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </Container>

      {/* Gym Check-in daily reminder modal */}
      <Dialog open={showCheckInReminder} onOpenChange={setShowCheckInReminder}>
        <DialogContent className="bg-gray-950 border border-white/10 text-white rounded-3xl p-6 sm:p-8 w-[calc(100vw-1.5rem)] sm:w-full max-w-md text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-red-500/20">
            <Trophy className="w-8 h-8 text-white animate-bounce" />
          </div>
          <DialogHeader className="w-full text-center">
            <DialogTitle className="text-2xl font-black tracking-tight text-white">Daily Gym Check-In</DialogTitle>
            <DialogDescription className="text-gray-400 mt-2 text-sm leading-relaxed">
              Don't forget to register your gym session today! Check-in to update your consistency heatmap, keep your daily streak alive, and claim <span className="text-orange-400 font-bold">30 XP</span>!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
            <Button
              onClick={handleGymCheckIn}
              disabled={isCheckingIn}
              className="flex-1 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black py-6 rounded-2xl border-0 shadow-lg shadow-red-500/20 transition-all duration-300 hover:scale-[1.02]"
            >
              {isCheckingIn ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Checking In...
                </>
              ) : (
                "Check-In Now 💪"
              )}
            </Button>
            <Button
              onClick={() => setShowCheckInReminder(false)}
              variant="outline"
              className="flex-1 border-white/10 hover:bg-white/5 text-white font-bold py-6 rounded-2xl"
            >
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
