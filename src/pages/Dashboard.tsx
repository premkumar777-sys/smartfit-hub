import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Activity, Apple, Dumbbell, Target, TrendingUp, FileText, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { useGamification } from "@/hooks/useGamification";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const gamification = useGamification();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<ActivityLog[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityLog[]>([]);
  const [nutritionToday, setNutritionToday] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

  const loadDashboardData = async (userId: string) => {
    try {
      // 1. Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Profile error:", profileError);
      }

      if (profileData) {
        setProfile(profileData);
      }

      // 2. Load saved workouts
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (workoutsError) {
        console.error("Workouts error:", workoutsError);
      } else if (workoutsData) {
        setSavedWorkouts(workoutsData);
      }

      // 3. Load weekly activity logs for charts
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: logsData } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (logsData) {
        setWeeklyLogs(logsData);
      }

      // 4. Load nutrition logs for today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: nutritionData } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', todayStart.toISOString());

      if (nutritionData) {
        const totals = nutritionData.reduce((acc, curr) => ({
          calories: acc.calories + (curr.calories || 0),
          protein: acc.protein + (curr.protein || 0),
          carbs: acc.carbs + (curr.carbs || 0),
          fats: acc.fats + (curr.fats || 0)
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
        setNutritionToday(totals);
      }

      // 5. Load recent activity feed
      const { data: feedData } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (feedData) {
        setActivityFeed(feedData);
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        loadDashboardData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else if (event === 'SIGNED_IN') {
        loadDashboardData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Process weekly data for chart
  const weeklyChartData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const chartData = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dayName = days[date.getDay()];
      const dateString = date.toDateString();

      const logsForDay = weeklyLogs.filter(log => new Date(log.created_at).toDateString() === dateString);
      const duration = logsForDay
        .filter(l => l.activity_type === 'workout')
        .reduce((sum, curr) => sum + curr.value, 0);

      chartData.push({
        day: dayName,
        hours: duration / 60, // convert minutes to hours for chart scaling
        completed: duration > 0,
        fullDate: dateString
      });
    }
    return chartData;
  }, [weeklyLogs]);

  // Workouts this week (count of unique days with workouts)
  const workoutsThisWeek = useMemo(() => {
    const workoutDays = new Set(
      weeklyLogs
        .filter(l => l.activity_type === 'workout')
        .map(l => new Date(l.created_at).toDateString())
    );
    return workoutDays.size;
  }, [weeklyLogs]);

  if (isInitialLoading || !gamification.isLoaded) {
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
    <div className="min-h-screen py-20">
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
              <Link to="/ai-trainer">
                Start Workout
              </Link>
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigate(-1)}>
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
                      <Link to="/ai-trainer">Start This Session</Link>
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
                      style={{ height: `${Math.max(5, (day.hours / 3) * 100)}%` }} // Max scale 3 hours
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
              {activityFeed.length > 0 ? (
                activityFeed.map((log) => (
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
                      <p className="text-sm font-medium capitalize">{log.activity_type} Logged</p>
                      <p className="text-xs text-muted-foreground">
                        {log.activity_type === 'workout' ? `${log.value} mins session` :
                          log.activity_type === 'nutrition' ? `${log.value} calories` :
                            'Interacted with AI'}
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
    </div>
  );
};

export default Dashboard;
