import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, Trash2, TrendingUp, TrendingDown, Target, Scale,
  Ruler, Trophy, Flame, Calendar, ArrowLeft, Zap, ChevronRight, AlertTriangle, RefreshCcw,
  Plus, Sparkles, Download, Share2, Activity, LockKeyhole, Award
} from "lucide-react";
import { ACHIEVEMENTS, useGamification, XP_REWARDS } from "@/hooks/useGamification";
import { Bar, BarChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WorkoutSummaryCard, WorkoutSummaryData } from "@/components/WorkoutSummaryCard";
import { WorkoutSummaryLogModal } from "@/components/WorkoutSummaryLogModal";
import { toPng } from "html-to-image";

// Types
interface ProgressLog {
  id: string;
  user_id: string;
  date: string;
  weight: number | null;
  notes?: string | null;
  created_at: string;
}

interface BodyMeasurements {
  date: string;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
}

interface GoalData {
  targetWeight: number;
  targetDate: string;
  startWeight: number;
  startDate: string;
}

type DashboardPeriod = "week" | "month" | "quarter";

const STORAGE_KEYS = {
  MEASUREMENTS: "smartfit_measurements_v1",
  GOALS: "smartfit_goals_v1",
  PROGRESS: "smartfit_progress_v1",
};

export default function Progress() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<30 | 60 | 90>(30);
  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod>("month");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedExercise, setSelectedExercise] = useState("");

  // Body measurements
  const [measurements, setMeasurements] = useState<BodyMeasurements[]>([]);
  const [newMeasurement, setNewMeasurement] = useState<Partial<BodyMeasurements>>({});

  // Goals
  const [goal, setGoal] = useState<GoalData | null>(null);
  const [newGoal, setNewGoal] = useState({ targetWeight: "", targetDate: "" });

  const [completedWorkouts, setCompletedWorkouts] = useState<WorkoutSummaryData[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedWorkoutForCard, setSelectedWorkoutForCard] = useState<WorkoutSummaryData | null>(null);

  const gamification = useGamification();

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        let loadedLogs: ProgressLog[] = [];

        if (user) {
          setUserId(user.id);
          const { data, error } = await supabase
            .from('progress_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(90);

          if (!error && data) {
            loadedLogs = data;
          } else {
            console.warn("Supabase fetch failed, falling back to localStorage:", error?.message);
            // Fallback to localStorage if DB fails
            const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
            if (saved) loadedLogs = JSON.parse(saved);
          }
        } else {
          // Fallback to localStorage for guests
          const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
          if (saved) {
            try {
              loadedLogs = JSON.parse(saved);
            } catch { /* ignore */ }
          }
        }

        setLogs(loadedLogs);

        // Load measurements from localStorage
        const savedMeasurements = localStorage.getItem(STORAGE_KEYS.MEASUREMENTS);
        if (savedMeasurements) {
          setMeasurements(JSON.parse(savedMeasurements));
        }

        // Load goals from localStorage
        const savedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
        if (savedGoals) {
          setGoal(JSON.parse(savedGoals));
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

        if (user) {
          try {
            const { data, error } = await supabase
              .from('completed_workouts')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(500);
            if (!error && data) {
              const mapped: WorkoutSummaryData[] = data.map((row: any) => ({
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
            } else if (error) {
              console.error("Could not load completed workouts from Supabase:", error.message);
            }
          } catch (error) {
            console.error("Could not load completed workouts from Supabase:", error);
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
        // Don't toast error if we have a valid fallback or it's just a missing table
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    if (!logs.length) return null;
    const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const weights = sorted.filter(l => l.weight).map(l => l.weight!);

    const start = weights[0] || 0;
    const latest = weights[weights.length - 1] || 0;
    const change = +(latest - start).toFixed(1);
    const streak = calcStreak(sorted);
    const weeklyAvg = weights.length >= 7
      ? +(weights.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, weights.length)).toFixed(1)
      : null;
    const lowest = Math.min(...weights);
    const highest = Math.max(...weights);

    // Calculate BMI (assuming average height of 170cm if not provided)
    const height = 170; // Could be made configurable
    const bmi = +(latest / ((height / 100) ** 2)).toFixed(1);

    return { latest, change, streak, weeklyAvg, lowest, highest, bmi, totalEntries: logs.length };
  }, [logs]);

  // Chart data
  const chartData = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - chartPeriod);

    return [...logs]
      .filter(l => new Date(l.date) >= cutoffDate && l.weight)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(l => ({
        date: new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: l.weight,
        fullDate: l.date,
      }));
  }, [logs, chartPeriod]);

  const dashboardData = useMemo(
    () => getDashboardData(completedWorkouts, logs, dashboardPeriod, calendarMonth, selectedExercise, gamification.unlockedAchievements),
    [completedWorkouts, logs, dashboardPeriod, calendarMonth, selectedExercise, gamification.unlockedAchievements]
  );

  const exportReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Allow pop-ups to export your report");
      return;
    }

    const weightSummary = dashboardData.reportMonthWeightChange === null
      ? "Not enough weight entries for a period comparison"
      : `${dashboardData.reportMonthWeightChange > 0 ? "+" : ""}${dashboardData.reportMonthWeightChange} kg`;
    const reportMonthWeight = dashboardData.reportMonthWeightTrend[dashboardData.reportMonthWeightTrend.length - 1]?.weight;
    const weightHistory = dashboardData.reportMonthWeightTrend
      .map((entry) => `${entry.date}: ${entry.weight} kg`)
      .join(" · ");
    const strengthHistory = dashboardData.reportMonthStrengthProgression
      .map((entry) => `${entry.date}: ${entry.weight} kg`)
      .join(" · ");
    printWindow.document.write(`<!doctype html><html><head><title>SmartFit AI Progress Report</title>
      <style>body{font:16px/1.5 Arial,sans-serif;color:#15372a;max-width:760px;margin:40px auto;padding:0 24px}
      h1{margin-bottom:4px}small{color:#547064}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      section{border:1px solid #d5e8dc;border-radius:12px;padding:16px;margin:16px 0}
      @media print{body{margin:0 auto}}</style></head><body>
      <h1>SmartFit AI · Progress Report</h1><small>${dashboardData.reportMonthLabel} · Generated ${new Date().toLocaleDateString()}</small>
      <section><h2>Workout activity</h2><div class="grid">
      <p><b>${dashboardData.reportMonthWorkouts}</b><br>Completed workouts</p>
      <p><b>${dashboardData.activeDays}</b><br>Active days</p>
      <p><b>${dashboardData.workoutStreak} days</b><br>Current workout streak</p>
      <p><b>${(dashboardData.reportMonthWorkouts / (dashboardData.monthDays / 7)).toFixed(1)}</b><br>Average workouts per week</p></div></section>
      <section><h2>Body weight</h2><p>Latest this month: ${reportMonthWeight === undefined ? "Not recorded" : `${reportMonthWeight} kg`}</p>
      <p>Change in report month: ${weightSummary}</p><p>Entries: ${weightHistory || "None"}</p></section>
      <section><h2>Strength progression</h2><p>${dashboardData.reportMonthStrengthProgression.length
        ? `${escapeHtml(dashboardData.selectedExercise)} · ${strengthHistory}`
        : "Unavailable: no structured exercise load data for the report month."}</p>
      <small>Recorded loads only. No one-rep max is estimated because the legacy workout records do not reliably include repetitions.</small></section>
      <section><h2>Milestones</h2><p>${dashboardData.earnedMilestones.length
        ? dashboardData.earnedMilestones.map((milestone) => escapeHtml(milestone.name)).join(", ")
        : "No unlocked milestones are recorded yet."}</p>
      <small>Achievement unlock dates are not stored, so these cannot be attributed to a specific month.</small></section>
      <p><small>Private report for your personal use. This document contains data from your SmartFit AI account.</small></p>
      <script>window.onload=()=>window.print()</script></body></html>`);
    printWindow.document.close();
  };

  // Goal progress
  const goalProgress = useMemo(() => {
    if (!goal || !stats) return null;
    const totalChange = Math.abs(goal.targetWeight - goal.startWeight);
    const currentChange = Math.abs(stats.latest - goal.startWeight);
    const progress = totalChange > 0 ? Math.min(100, (currentChange / totalChange) * 100) : 0;
    const remaining = Math.abs(goal.targetWeight - stats.latest);
    const daysLeft = Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    return { progress, remaining, daysLeft };
  }, [goal, stats]);

  const addLog = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w) return;

    const dateStr = new Date().toISOString().slice(0, 10);
    const currentNotes = notes; // Capture before clearing

    const entry: ProgressLog = {
      id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        }),
      user_id: userId || '',
      date: dateStr,
      weight: w,
      notes: currentNotes || null,
      created_at: new Date().toISOString(),
    };

    // Update UI immediately (using functional update to avoid stale state)
    setLogs(prev => {
      const newLogs = [entry, ...prev].slice(0, 90);
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(newLogs));
      return newLogs;
    });

    // Award XP and clear form instantly
    const xpGained = gamification.recordProgressLog();
    setWeight("");
    setNotes("");

    if (xpGained > 0) {
      toast.success(`Progress logged! +${xpGained} XP 💪`);
    } else {
      toast.success("Progress logged!");
    }

    // Sync to Supabase in background (fire and forget)
    if (userId) {
      supabase
        .from('progress_logs')
        .insert({ id: entry.id, user_id: userId, date: dateStr, weight: w, notes: currentNotes || null })
        .then(({ error }) => {
          if (error) {
            console.warn("Supabase sync failed:", error.message);
          }
        });
    }
  };

  const deleteLog = async (logId: string) => {
    try {
      if (userId) {
        // Attempt Supabase delete - use eq if it's a valid UUID, otherwise skip remote delete
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(logId);

        if (isUUID) {
          const { error } = await supabase.from('progress_logs').delete().eq('id', logId);
          // If error is not "Not Found", log it but proceed with local deletion
          if (error && error.code !== 'PGRST116') {
            console.warn("Supabase delete failed:", error.message);
          }
        }
      }

      // Always remove from local state and storage
      setLogs(prev => {
        const newLogs = prev.filter((l) => l.id !== logId);
        localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(newLogs));
        return newLogs;
      });
      toast.success("Entry deleted");
    } catch (err) {
      console.error("Error deleting log:", err);
      toast.error("Failed to delete entry");
    }
  };

  const saveMeasurement = () => {
    if (!newMeasurement.chest && !newMeasurement.waist && !newMeasurement.hips && !newMeasurement.arms && !newMeasurement.thighs) {
      toast.error("Please enter at least one measurement");
      return;
    }

    const entry: BodyMeasurements = {
      date: new Date().toISOString().slice(0, 10),
      ...newMeasurement,
    };

    const updated = [entry, ...measurements].slice(0, 50);
    setMeasurements(updated);
    localStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(updated));
    setNewMeasurement({});
    const xpGained = gamification.recordProgressLog();

    if (xpGained > 0) {
      toast.success(`Measurements saved! +${xpGained} XP`);
    } else {
      toast.success("Measurements saved!");
    }
  };

  const saveGoal = () => {
    const target = parseFloat(newGoal.targetWeight);
    if (!target || !newGoal.targetDate || !stats) {
      toast.error("Please enter target weight and date");
      return;
    }

    const goalData: GoalData = {
      targetWeight: target,
      targetDate: newGoal.targetDate,
      startWeight: stats.latest,
      startDate: new Date().toISOString().slice(0, 10),
    };

    setGoal(goalData);
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goalData));
    setNewGoal({ targetWeight: "", targetDate: "" });
    toast.success("Goal set!");
  };

  const saveWorkout = async (workout: WorkoutSummaryData) => {
    const id = (workout as any).id || (typeof crypto !== 'undefined' && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2));
    const newWorkout = { ...workout, id };

    setCompletedWorkouts((prev) => {
      const updated = [newWorkout, ...prev];
      localStorage.setItem("smartfit_completed_workouts_v1", JSON.stringify(updated));
      return updated;
    });

    toast.success("Workout logged successfully!");


    if (userId) {
      try {
        const { error } = await supabase.from("completed_workouts").insert({
          id,
          user_id: userId,
          routine_name: workout.routineName,
          date: workout.date,
          duration: workout.duration,
          sets: workout.sets,
          volume: workout.volume,
          kcal: workout.kcal,
          muscle_groups: workout.muscleGroups,
          exercises: workout.exercises,
          personal_records_count: workout.personalRecordsCount,
          photo_url: workout.photoUrl
        });
        if (error) {
          console.error("Could not sync completed workout to Supabase:", error.message);
          toast.error("Workout is saved on this device but could not sync to your account");
        }
      } catch (error) {
        console.error("Could not sync completed workout to Supabase:", error);
        toast.error("Workout is saved on this device but could not sync to your account");
      }
    }
  };

  const deleteWorkout = async (id: string) => {
    setCompletedWorkouts((prev) => {
      const updated = prev.filter((w: any) => w.id !== id);
      localStorage.setItem("smartfit_completed_workouts_v1", JSON.stringify(updated));
      return updated;
    });

    toast.success("Workout log deleted");

    if (userId) {
      try {
        await supabase.from("completed_workouts").delete().eq("id", id);
      } catch (err) {
        // ignore
      }
    }
  };

  const resetAllData = async () => {
    if (!window.confirm("ARE YOU SURE? This will permanently delete all your weight logs, measurements, goals, XP, and streaks. This cannot be undone.")) {
      return;
    }

    try {
      setIsLoading(true);

      // 1. Reset Gamification (XP, Streak, Levels)
      await gamification.resetData();

      // 2. Clear Supabase progress logs
      if (userId) {
        const { error } = await supabase.from('progress_logs').delete().eq('user_id', userId);
        if (error) console.error("Error clearing logs from Supabase:", error);
      }

      // 3. Clear all LocalStorage items
      localStorage.removeItem(STORAGE_KEYS.PROGRESS);
      localStorage.removeItem(STORAGE_KEYS.MEASUREMENTS);
      localStorage.removeItem(STORAGE_KEYS.GOALS);

      // 4. Update local state
      setLogs([]);
      setMeasurements([]);
      setGoal(null);

      toast.success("All data has been reset to zero.");
    } catch (err) {
      console.error("Error during reset:", err);
      toast.error("Failed to reset data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080A0C] pt-20 pb-32 text-white lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#00FF9C]/5 via-transparent to-transparent pointer-events-none" />
      <Container className="relative z-10">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 -ml-3 text-gray-400 hover:bg-white/5 hover:text-white"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00FF9C]">SmartFit AI</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Smart Progress</h1>
            <p className="mt-1 text-sm text-[#8E9BAE]">Your fitness journey, measured over time.</p>
          </div>
        </div>

        <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard icon={Scale} label="Current weight" value={dashboardData.latestWeight !== null ? `${dashboardData.latestWeight} kg` : "Log your first weight"} accent />
          <StatCard
            icon={dashboardData.weightChange !== null && dashboardData.weightChange < 0 ? TrendingDown : TrendingUp}
            label="Weight change"
            value={dashboardData.weightChange !== null ? `${dashboardData.weightChange > 0 ? "+" : ""}${dashboardData.weightChange} kg` : "Add another entry"}
          />
          <StatCard icon={Flame} label="Workout streak" value={`${dashboardData.workoutStreak} days`} />
          <StatCard icon={Calendar} label="Weekly average" value={`${dashboardData.weeklyWorkoutAverage} workouts`} />
          <StatCard icon={Trophy} label="XP Earned" value={`${gamification.xp}`} />
          <StatCard icon={Target} label="Level" value={`${gamification.level}`} />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto bg-[#111418] border border-white/10 p-1 shadow-sm sm:w-fit rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#00FF9C] data-[state=active]:text-[#060809] data-[state=active]:font-bold text-[#8E9BAE]">Overview</TabsTrigger>
            <TabsTrigger value="weight" className="data-[state=active]:bg-[#00FF9C] data-[state=active]:text-[#060809] data-[state=active]:font-bold text-[#8E9BAE]">Weight</TabsTrigger>
            <TabsTrigger value="measurements" className="data-[state=active]:bg-[#00FF9C] data-[state=active]:text-[#060809] data-[state=active]:font-bold text-[#8E9BAE]">Measurements</TabsTrigger>
            <TabsTrigger value="goals" className="data-[state=active]:bg-[#00FF9C] data-[state=active]:text-[#060809] data-[state=active]:font-bold text-[#8E9BAE]">Goals</TabsTrigger>
            <TabsTrigger value="workouts" className="data-[state=active]:bg-[#00FF9C] data-[state=active]:text-[#060809] data-[state=active]:font-bold text-[#8E9BAE]">Workouts</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-[#00FF9C] data-[state=active]:text-[#060809] data-[state=active]:font-bold text-[#8E9BAE]">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ProgressOverview
              data={dashboardData}
              period={dashboardPeriod}
              onPeriodChange={setDashboardPeriod}
              calendarMonth={calendarMonth}
              onCalendarMonthChange={setCalendarMonth}
              onExerciseChange={setSelectedExercise}
              onExport={exportReport}
            />
          </TabsContent>

          {/* Weight Tab */}
          <TabsContent value="weight" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Log Weight Form */}
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-primary" />
                    Log Weight
                  </CardTitle>
                  <CardDescription>
                    Earn +{XP_REWARDS.PROGRESS_LOG} XP per entry
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={addLog} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        type="number"
                        step="0.1"
                        min="30"
                        max="250"
                        placeholder="e.g., 75.5"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Input
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="How are you feeling?"
                      />
                    </div>
                    <Button type="submit" variant="hero" className="w-full">
                      <Zap className="mr-2 h-4 w-4" />
                      Log Weight
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Weight Chart */}
              <Card className="glass border-primary/20 lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Weight Trend</CardTitle>
                      <CardDescription>Your progress over time</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {[30, 60, 90].map((days) => (
                        <Button
                          key={days}
                          variant={chartPeriod === days ? "default" : "outline"}
                          size="sm"
                          onClick={() => setChartPeriod(days as 30 | 60 | 90)}
                        >
                          {days}d
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {chartData.length > 1 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="date" stroke="#888" fontSize={12} />
                          <YAxis
                            stroke="#888"
                            fontSize={12}
                            domain={['auto', 'auto']}
                            tickFormatter={(v) => `${v}kg`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1a1a1a',
                              border: '1px solid #333',
                              borderRadius: '8px'
                            }}
                            labelStyle={{ color: '#888' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="weight"
                            stroke="#22c55e"
                            strokeWidth={2}
                            fill="url(#weightGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      Add at least 2 weight entries to see your trend chart
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Measurements Tab */}
          <TabsContent value="measurements" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-primary" />
                    Body Measurements
                  </CardTitle>
                  <CardDescription>Track your body composition (cm)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Chest</Label>
                      <Input
                        type="number"
                        placeholder="cm"
                        value={newMeasurement.chest || ""}
                        onChange={(e) => setNewMeasurement(p => ({ ...p, chest: parseFloat(e.target.value) || undefined }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Waist</Label>
                      <Input
                        type="number"
                        placeholder="cm"
                        value={newMeasurement.waist || ""}
                        onChange={(e) => setNewMeasurement(p => ({ ...p, waist: parseFloat(e.target.value) || undefined }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hips</Label>
                      <Input
                        type="number"
                        placeholder="cm"
                        value={newMeasurement.hips || ""}
                        onChange={(e) => setNewMeasurement(p => ({ ...p, hips: parseFloat(e.target.value) || undefined }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Arms</Label>
                      <Input
                        type="number"
                        placeholder="cm"
                        value={newMeasurement.arms || ""}
                        onChange={(e) => setNewMeasurement(p => ({ ...p, arms: parseFloat(e.target.value) || undefined }))}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Thighs</Label>
                      <Input
                        type="number"
                        placeholder="cm"
                        value={newMeasurement.thighs || ""}
                        onChange={(e) => setNewMeasurement(p => ({ ...p, thighs: parseFloat(e.target.value) || undefined }))}
                      />
                    </div>
                  </div>
                  <Button onClick={saveMeasurement} variant="hero" className="w-full">
                    <Zap className="mr-2 h-4 w-4" />
                    Save Measurements
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle>Measurement History</CardTitle>
                  <CardDescription>Recent recordings</CardDescription>
                </CardHeader>
                <CardContent>
                  {measurements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No measurements recorded yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {measurements.slice(0, 10).map((m, i) => (
                        <div key={i} className="p-3 rounded-lg border border-gray-800 bg-gray-900/60">
                          <p className="text-xs text-muted-foreground mb-2">{m.date}</p>
                          <div className="grid grid-cols-5 gap-2 text-sm">
                            {m.chest && <div><span className="text-muted-foreground">Chest:</span> {m.chest}</div>}
                            {m.waist && <div><span className="text-muted-foreground">Waist:</span> {m.waist}</div>}
                            {m.hips && <div><span className="text-muted-foreground">Hips:</span> {m.hips}</div>}
                            {m.arms && <div><span className="text-muted-foreground">Arms:</span> {m.arms}</div>}
                            {m.thighs && <div><span className="text-muted-foreground">Thighs:</span> {m.thighs}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Set Your Goal
                  </CardTitle>
                  <CardDescription>Define your target weight</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Target Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 70"
                      value={newGoal.targetWeight}
                      onChange={(e) => setNewGoal(p => ({ ...p, targetWeight: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Date</Label>
                    <Input
                      type="date"
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal(p => ({ ...p, targetDate: e.target.value }))}
                      min={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                  <Button onClick={saveGoal} variant="hero" className="w-full">
                    Set Goal
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle>Goal Progress</CardTitle>
                  <CardDescription>Track your journey to the target</CardDescription>
                </CardHeader>
                <CardContent>
                  {goal && goalProgress ? (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-primary mb-2">
                          {goalProgress.progress.toFixed(0)}%
                        </div>
                        <p className="text-muted-foreground">toward your goal</p>
                      </div>

                      <ProgressBar value={goalProgress.progress} className="h-4" />

                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 rounded-lg border border-gray-800 bg-gray-900/60">
                          <p className="text-2xl font-bold">{goalProgress.remaining.toFixed(1)} kg</p>
                          <p className="text-xs text-muted-foreground">Remaining</p>
                        </div>
                        <div className="p-3 rounded-lg border border-gray-800 bg-gray-900/60">
                          <p className="text-2xl font-bold">{goalProgress.daysLeft}</p>
                          <p className="text-xs text-muted-foreground">Days Left</p>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Start: {goal.startWeight} kg</span>
                        <ChevronRight className="w-4 h-4" />
                        <span>Target: {goal.targetWeight} kg</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No goal set yet.</p>
                      <p className="text-sm">Set a goal to track your progress!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle>Weight History</CardTitle>
                <CardDescription>All your weight entries (newest first)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-end pb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-500/30 hover:bg-red-500/10 gap-2"
                    onClick={resetAllData}
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Reset All My Stats
                  </Button>
                </div>
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No entries yet.</p>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {logs.map((log) => (
                      <div key={log.id} className="p-3 rounded-lg border border-gray-800 bg-gray-900/60 relative group">
                        <button
                          onClick={() => deleteLog(log.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                          aria-label="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-muted-foreground">{log.date}</p>
                        <p className="text-lg font-semibold">{log.weight} kg</p>
                        {log.notes && <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workouts Tab */}
          <TabsContent value="workouts" className="space-y-6">
            <Card className="glass border-primary/20">
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Completed Workouts
                  </CardTitle>
                  <CardDescription>
                    Review your completed sessions, download cards, and track your achievements.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsLogModalOpen(true)}
                  variant="hero"
                  size="sm"
                  className="font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Log Completed Workout
                </Button>
              </CardHeader>
              <CardContent>
                {completedWorkouts.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-800 rounded-2xl bg-gray-900/25">
                    <Flame className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-60 animate-pulse" />
                    <p className="font-semibold text-gray-300">No completed workouts logged yet</p>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Start pose-detection training or log a manual session!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedWorkouts.map((workout: any) => (
                      <Card
                        key={workout.id}
                        className="bg-gray-950/80 border-gray-800 hover:border-primary/45 transition-all flex flex-col justify-between"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] text-primary uppercase font-black tracking-widest">
                                {workout.date}
                              </span>
                              <CardTitle className="text-xl font-black uppercase tracking-tight mt-1">
                                {workout.routineName}
                              </CardTitle>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteWorkout(workout.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Quick Stats Grid */}
                          <div className="grid grid-cols-2 gap-2 bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                            <div>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Time</p>
                              <p className="text-xs font-black text-gray-200 mt-0.5">{workout.duration}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Sets</p>
                              <p className="text-xs font-black text-gray-200 mt-0.5">{workout.sets}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Volume</p>
                              <p className="text-xs font-black text-gray-200 mt-0.5">{workout.volume}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Calories</p>
                              <p className="text-xs font-black text-gray-200 mt-0.5">~{workout.kcal} kcal</p>
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button
                            onClick={() => setSelectedWorkoutForCard(workout)}
                            className="w-full font-bold flex items-center justify-center gap-1.5 border-white/10 hover:bg-white/5 text-xs"
                            variant="outline"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            View Share Card
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>

      {/* Log Modal */}
      <WorkoutSummaryLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSave={saveWorkout}
      />

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
                <WorkoutSummaryCard data={selectedWorkoutForCard} className="w-[320px]" />
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
                    useCORS: true,
                    quality: 1.0,
                    pixelRatio: 2
                  });
                  const link = document.createElement("a");
                  link.download = `smartfitai-workout-${Date.now()}.png`;
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
                    link.download = `smartfitai-workout-${Date.now()}.png`;
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

interface DashboardData {
  latestWeight: number | null;
  weightChange: number | null;
  reportMonthLabel: string;
  reportMonthWorkouts: number;
  reportMonthWeightChange: number | null;
  reportMonthWeightTrend: Array<{ date: string; weight: number; fullDate: string }>;
  reportMonthStrengthProgression: Array<{ date: string; weight: number; fullDate: string }>;
  workoutStreak: number;
  weeklyWorkoutAverage: string;
  periodWorkouts: number;
  previousWorkouts: number;
  workoutChange: number;
  activityChart: Array<{ label: string; workouts: number }>;
  weightTrend: Array<{ date: string; weight: number; fullDate: string }>;
  activeDays: number;
  monthDays: number;
  calendarDays: Array<{ day: number | null; workouts: number; today: boolean }>;
  strengthExercises: string[];
  selectedExercise: string;
  strengthProgression: Array<{ date: string; weight: number; fullDate: string }>;
  earnedMilestones: Array<{ id: string; name: string; description: string }>;
}

function ProgressOverview({
  data,
  period,
  onPeriodChange,
  calendarMonth,
  onCalendarMonthChange,
  onExerciseChange,
  onExport,
}: {
  data: DashboardData;
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  calendarMonth: Date;
  onCalendarMonthChange: (month: Date) => void;
  onExerciseChange: (exercise: string) => void;
  onExport: () => void;
}) {
  const periodLabels: Record<DashboardPeriod, string> = {
    week: "Week",
    month: "Month",
    quarter: "3 months",
  };
  const workoutDeltaLabel = data.periodWorkouts > 0 || data.previousWorkouts > 0
    ? `${data.workoutChange > 0 ? "+" : ""}${data.workoutChange} vs previous period`
    : "Your first workout will appear here";
  const monthLabel = calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Your activity</h2>
          <p className="text-sm text-[#8E9BAE]">A clear view of your recent training and progress.</p>
        </div>
        <div className="inline-flex rounded-xl border border-white/10 bg-[#111418] p-1 shadow-sm" role="group" aria-label="Dashboard time range">
          {(Object.keys(periodLabels) as DashboardPeriod[]).map((range) => (
            <button
              type="button"
              key={range}
              onClick={() => onPeriodChange(range)}
              aria-pressed={period === range}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${period === range ? "bg-[#00FF9C] text-[#060809] font-bold shadow-sm" : "text-[#8E9BAE] hover:bg-white/5 hover:text-white"}`}
            >
              {periodLabels[range]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-white/10 bg-[#111418] text-white shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg text-white">Workout activity</CardTitle>
                <CardDescription className="text-[#8E9BAE]">{data.periodWorkouts} {data.periodWorkouts === 1 ? "workout" : "workouts"} in this period</CardDescription>
              </div>
              <span className="rounded-full bg-[#00FF9C]/15 border border-[#00FF9C]/30 px-3 py-1 text-xs font-semibold text-[#00FF9C]">{workoutDeltaLabel}</span>
            </div>
          </CardHeader>
          <CardContent>
            {data.periodWorkouts === 0 ? (
              <div className="flex h-52 flex-col items-center justify-center text-center text-[#8E9BAE]">
                <Activity className="mb-2 h-8 w-8 text-[#00FF9C]/60" />
                <p className="font-medium text-white">No workouts in this period yet</p>
                <p className="mt-1 text-sm">Completed sessions will build your activity chart.</p>
              </div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.activityChart} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#8E9BAE", fontSize: 11 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#8E9BAE", fontSize: 11 }} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ backgroundColor: "#111418", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#fff" }} />
                    <Bar dataKey="workouts" name="Workouts" fill="#00FF9C" radius={[6, 6, 0, 0]} maxBarSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-white/10 bg-[#111418] text-white shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg text-white">Body weight</CardTitle>
                <CardDescription className="flex items-center gap-1 text-[#8E9BAE]"><LockKeyhole className="h-3 w-3" /> Only you can see this data</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-white">{data.latestWeight === null ? "—" : `${data.latestWeight} kg`}</p>
                <p className="text-xs text-[#8E9BAE]">{data.weightChange === null ? "Log another entry to compare" : `${data.weightChange > 0 ? "+" : ""}${data.weightChange} kg in period`}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.weightTrend.length < 2 ? (
              <div className="flex h-52 flex-col items-center justify-center text-center text-[#8E9BAE]">
                <Scale className="mb-2 h-8 w-8 text-[#00FF9C]/60" />
                <p className="font-medium text-white">{data.weightTrend.length ? "One weight entry recorded" : "Start tracking your weight"}</p>
                <p className="mt-1 text-sm">Your history stays private to your account.</p>
              </div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.weightTrend} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8E9BAE", fontSize: 11 }} />
                    <YAxis domain={["auto", "auto"]} axisLine={false} tickLine={false} tick={{ fill: "#8E9BAE", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#111418", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#fff" }} formatter={(value: number) => [`${value} kg`, "Weight"]} />
                    <Line type="monotone" dataKey="weight" stroke="#00FF9C" strokeWidth={2.5} dot={{ r: 3, fill: "#00FF9C" }} activeDot={{ r: 5, fill: "#FFFFFF" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-2xl border-white/10 bg-[#111418] text-white shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg text-white">Consistency</CardTitle>
                <CardDescription className="text-[#8E9BAE]">{data.activeDays} active days in {monthLabel}</CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="Previous month" className="text-gray-400 hover:text-white hover:bg-white/10" onClick={() => onCalendarMonthChange(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Next month" className="text-gray-400 hover:text-white hover:bg-white/10" disabled={calendarMonth.getFullYear() === new Date().getFullYear() && calendarMonth.getMonth() >= new Date().getMonth()} onClick={() => onCalendarMonthChange(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-[#8E9BAE]">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {data.calendarDays.map((cell, index) => (
                <div
                  key={`${calendarMonth.toISOString()}-${index}`}
                  title={cell.day ? `${monthLabel} ${cell.day}: ${cell.workouts} completed workout(s)` : undefined}
                  className={`flex aspect-square items-center justify-center rounded-lg border text-xs ${!cell.day
                    ? "border-transparent"
                    : cell.workouts === 0
                      ? "border-white/5 bg-white/[0.03] text-[#8E9BAE]"
                      : cell.workouts === 1
                        ? "border-[#00FF9C]/30 bg-[#00FF9C]/15 text-[#00FF9C]"
                        : cell.workouts === 2
                          ? "border-[#00FF9C]/60 bg-[#00FF9C]/30 text-white font-semibold"
                          : "border-[#00FF9C] bg-[#00FF9C] font-bold text-[#060809]"} ${cell.today ? "ring-2 ring-[#00FF9C] ring-offset-1 ring-offset-[#111418]" : ""}`}
                >
                  {cell.day}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#8E9BAE]">
              <span>{data.workoutStreak}-day current streak</span>
              <span>Active-day frequency: {data.monthDays ? Math.round((data.activeDays / data.monthDays) * 100) : 0}% of calendar days</span>
            </div>
            <p className="mt-2 text-xs text-[#8E9BAE]/70">Frequency uses calendar days, not planned training days; no schedule is stored for this account.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-white/10 bg-[#111418] text-white shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg text-white">Strength progression</CardTitle>
                <CardDescription className="text-[#8E9BAE]">Recorded loads only · kg</CardDescription>
              </div>
              <select
                aria-label="Select exercise"
                value={data.selectedExercise}
                onChange={(event) => onExerciseChange(event.target.value)}
                className="max-w-[150px] rounded-lg border border-white/10 bg-[#181D24] px-2 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00FF9C]"
              >
                {data.strengthExercises.map((exercise) => <option key={exercise} value={exercise}>{exercise}</option>)}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {data.strengthProgression.length < 2 ? (
              <div className="flex h-52 flex-col items-center justify-center text-center text-[#8E9BAE]">
                <TrendingUp className="mb-2 h-8 w-8 text-[#00FF9C]/60" />
                <p className="font-medium text-white">{data.strengthExercises.length ? "More recorded sessions needed" : "No structured strength data yet"}</p>
                <p className="mt-1 max-w-xs text-sm">Add numeric loads with kg units to exercise records. Reps are not stored consistently, so estimated 1RM is unavailable.</p>
              </div>
            ) : (
              <>
                <p className="mb-1 text-sm text-[#8E9BAE]">
                  Latest <strong className="text-white">{data.strengthProgression[data.strengthProgression.length - 1].weight} kg</strong>
                  {" · "}change {formatChange(data.strengthProgression[0].weight, data.strengthProgression[data.strengthProgression.length - 1].weight)} kg
                </p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.strengthProgression} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8E9BAE", fontSize: 10 }} />
                      <YAxis domain={["auto", "auto"]} axisLine={false} tickLine={false} tick={{ fill: "#8E9BAE", fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: "#111418", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#fff" }} formatter={(value: number) => [`${value} kg`, "Recorded load"]} />
                      <Line type="monotone" dataKey="weight" stroke="#00FF9C" strokeWidth={2.5} dot={{ r: 3, fill: "#00FF9C" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-white/10 bg-[#111418] text-white shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-white"><Award className="h-5 w-5 text-[#00FF9C]" />Milestones</CardTitle>
          <CardDescription className="text-[#8E9BAE]">Achievements already unlocked in your SmartFit account.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.earnedMilestones.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.earnedMilestones.map((milestone) => (
                <div key={milestone.id} className="flex gap-3 rounded-xl border border-white/10 bg-[#161A20] p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00FF9C]/15 text-[#00FF9C]"><Trophy className="h-5 w-5" /></span>
                  <div><p className="font-semibold text-white">{milestone.name}</p><p className="mt-1 text-sm text-[#8E9BAE]">{milestone.description}</p></div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-white/[0.03] border border-white/5 p-5 text-sm text-[#8E9BAE]">No unlocked milestones are recorded yet. Keep logging completed workouts to earn achievements.</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-[#00FF9C]/25 bg-gradient-to-br from-[#0B2317] to-[#111418] text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h3 className="font-semibold text-white">Monthly fitness review</h3>
            <p className="mt-1 text-sm text-[#8E9BAE]">{data.reportMonthLabel}: {data.reportMonthWorkouts} workouts · {data.activeDays} active days · {data.earnedMilestones.length} unlocked overall</p>
            <p className="mt-1 text-sm text-[#8E9BAE]/70">Export a private report for this month using activity recorded in your account.</p>
          </div>
          <Button onClick={onExport} className="shrink-0 bg-[#00FF9C] text-[#060809] font-bold hover:bg-[#00E08A] transition-colors">
            <Download className="mr-2 h-4 w-4" />Export summary report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function getDashboardData(
  workouts: WorkoutSummaryData[],
  logs: ProgressLog[],
  period: DashboardPeriod,
  calendarMonth: Date,
  requestedExercise: string,
  unlockedAchievementIds: string[]
): DashboardData {
  const periodDays = period === "week" ? 7 : period === "month" ? 30 : 90;
  const today = localMidnight(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - periodDays + 1);
  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - periodDays);
  const currentWorkouts = workouts
    .map((workout) => ({ workout, date: parseWorkoutDate(workout.date) }))
    .filter((entry): entry is { workout: WorkoutSummaryData; date: Date } => entry.date !== null);
  const inRangeWorkouts = currentWorkouts.filter(({ date }) => date >= start && date <= today);
  const previousWorkouts = currentWorkouts.filter(({ date }) => date >= previousStart && date < start).length;
  const workoutChange = inRangeWorkouts.length - previousWorkouts;
  const activityChart: DashboardData["activityChart"] = [];
  const intervalCount = period === "week" ? 7 : Math.ceil(periodDays / 7);
  for (let index = 0; index < intervalCount; index += 1) {
    const bucketStart = new Date(start);
    bucketStart.setDate(bucketStart.getDate() + (period === "week" ? index : index * 7));
    const bucketEnd = new Date(bucketStart);
    bucketEnd.setDate(bucketEnd.getDate() + (period === "week" ? 1 : 7));
    const count = inRangeWorkouts.filter(({ date }) => date >= bucketStart && date < bucketEnd).length;
    activityChart.push({
      label: period === "week" ? bucketStart.toLocaleDateString(undefined, { weekday: "short" }) : `Week ${index + 1}`,
      workouts: count,
    });
  }

  const sortedLogs = logs
    .filter((entry) => entry.weight !== null && Number.isFinite(Number(entry.weight)))
    .map((entry) => ({ ...entry, parsedDate: parseWorkoutDate(entry.date) }))
    .filter((entry): entry is ProgressLog & { parsedDate: Date } => entry.parsedDate !== null)
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
  const latestWeight = sortedLogs.length ? Number(sortedLogs[sortedLogs.length - 1].weight) : null;
  const periodLogs = sortedLogs.filter((entry) => entry.parsedDate >= start && entry.parsedDate <= today);
  const weightChange = periodLogs.length > 1
    ? Number((Number(periodLogs[periodLogs.length - 1].weight) - Number(periodLogs[0].weight)).toFixed(1))
    : null;
  const weightTrend = periodLogs.map((entry) => ({
    date: entry.parsedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    weight: Number(entry.weight),
    fullDate: entry.date,
  }));
  const workoutDates = currentWorkouts.map(({ date }) => dateKey(date));
  const uniqueWorkoutDates = [...new Set(workoutDates)].sort().reverse();
  const workoutStreak = calculateDateStreak(uniqueWorkoutDates);
  const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const monthDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const nextMonthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
  const reportMonthLabel = calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const reportMonthWorkouts = currentWorkouts.filter(({ date }) => date >= firstDay && date < nextMonthStart).length;
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const workoutsByDate = new Map<string, number>();
  currentWorkouts.forEach(({ date }) => {
    const key = dateKey(date);
    workoutsByDate.set(key, (workoutsByDate.get(key) || 0) + 1);
  });
  const calendarDays: DashboardData["calendarDays"] = [
    ...Array.from({ length: leadingDays }, () => ({ day: null, workouts: 0, today: false })),
    ...Array.from({ length: monthDays }, (_, index) => {
      const day = index + 1;
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      return {
        day,
        workouts: workoutsByDate.get(dateKey(date)) || 0,
        today: dateKey(date) === dateKey(today),
      };
    }),
  ];

  const strengthRecords = currentWorkouts.flatMap(({ workout, date }) =>
    (workout.exercises || []).flatMap((exercise) => {
      const weight = parseKilogramLoad(exercise.weight);
      return weight === null || !exercise.name?.trim()
        ? []
        : [{ name: exercise.name.trim(), date, weight }];
    })
  );
  const strengthExercises = [...new Set(strengthRecords.map((record) => record.name))].sort((a, b) => a.localeCompare(b));
  const selectedExercise = strengthExercises.includes(requestedExercise) ? requestedExercise : strengthExercises[0] || "";
  const strengthProgression = strengthRecords
    .filter((record) => record.name === selectedExercise && record.date >= start && record.date <= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((record) => ({
      date: record.date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      weight: record.weight,
      fullDate: dateKey(record.date),
    }));
  const reportMonthStrengthProgression = strengthRecords
    .filter((record) => record.name === selectedExercise && record.date >= firstDay && record.date < nextMonthStart)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((record) => ({
      date: record.date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      weight: record.weight,
      fullDate: dateKey(record.date),
    }));
  const reportMonthWeightTrend = sortedLogs
    .filter((entry) => entry.parsedDate >= firstDay && entry.parsedDate < nextMonthStart)
    .map((entry) => ({
      date: entry.parsedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      weight: Number(entry.weight),
      fullDate: entry.date,
    }));
  const reportMonthWeightChange = reportMonthWeightTrend.length > 1
    ? Number((reportMonthWeightTrend[reportMonthWeightTrend.length - 1].weight - reportMonthWeightTrend[0].weight).toFixed(1))
    : null;

  const unlocked = new Set(unlockedAchievementIds);
  const earnedMilestones = ACHIEVEMENTS
    .filter((achievement) => unlocked.has(achievement.id))
    .map(({ id, name, description }) => ({ id, name, description }));

  return {
    latestWeight,
    weightChange,
    reportMonthLabel,
    reportMonthWorkouts,
    reportMonthWeightChange,
    reportMonthWeightTrend,
    reportMonthStrengthProgression,
    workoutStreak,
    weeklyWorkoutAverage: (inRangeWorkouts.length / (periodDays / 7)).toFixed(1),
    periodWorkouts: inRangeWorkouts.length,
    previousWorkouts,
    workoutChange,
    activityChart,
    weightTrend,
    activeDays: calendarDays.filter((day) => day.day !== null && day.workouts > 0).length,
    monthDays,
    calendarDays,
    strengthExercises,
    selectedExercise,
    strengthProgression,
    earnedMilestones,
  };
}

function parseWorkoutDate(value: string): Date | null {
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    return new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
  }
  const explicitYear = /\b(?:19|20)\d{2}\b/.test(value);
  let date = new Date(value);
  if (!explicitYear && !Number.isNaN(date.getTime()) && date.getFullYear() < 2010) {
    date.setFullYear(new Date().getFullYear());
  }
  if (Number.isNaN(date.getTime())) {
    const partialDate = value.match(/(?:\w+,\s*)?(\d{1,2}\s+[A-Za-z]{3,})/);
    if (partialDate) date = new Date(`${partialDate[1]} ${new Date().getFullYear()}`);
  }
  return Number.isNaN(date.getTime()) ? null : localMidnight(date);
}

function localMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function calculateDateStreak(datesNewestFirst: string[]): number {
  if (!datesNewestFirst.length) return 0;
  const today = dateKey(localMidnight(new Date()));
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = dateKey(localMidnight(yesterdayDate));
  if (datesNewestFirst[0] !== today && datesNewestFirst[0] !== yesterday) return 0;
  let streak = 1;
  for (let index = 0; index < datesNewestFirst.length - 1; index += 1) {
    const current = new Date(`${datesNewestFirst[index]}T00:00:00`);
    const previous = new Date(`${datesNewestFirst[index + 1]}T00:00:00`);
    const diff = (current.getTime() - previous.getTime()) / 86400000;
    if (diff !== 1) break;
    streak += 1;
  }
  return streak;
}

function parseKilogramLoad(value: string): number | null {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*kg$/i);
  if (!match) return null;
  const load = Number(match[1]);
  return Number.isFinite(load) && load > 0 ? load : null;
}

function formatChange(start: number, end: number): string {
  const change = Number((end - start).toFixed(1));
  return `${change > 0 ? "+" : ""}${change}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: boolean }) {
  return (
    <Card className={`rounded-2xl shadow-md ${accent ? "border-[#00FF9C]/30 bg-[#111418]" : "border-white/10 bg-[#111418]"}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${accent ? "bg-[#00FF9C]/15" : "bg-white/5"}`}>
            <Icon className={`h-4 w-4 ${accent ? "text-[#00FF9C]" : "text-[#8E9BAE]"}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#8E9BAE]">{label}</p>
            <p className="truncate text-base font-semibold text-white sm:text-lg">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Calculate streak helper
function calcStreak(sorted: ProgressLog[]) {
  if (!sorted.length) return 0;

  // Get unique dates in YYYY-MM-DD format, sorted newest first
  const uniqueDates = Array.from(new Set(sorted.map(l => l.date)))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (!uniqueDates.length) return 0;

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // If the last entry isn't today or yesterday, the streak is broken
  const latestDate = uniqueDates[0];
  if (latestDate !== today && latestDate !== yesterday) {
    return 0;
  }

  streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const curr = new Date(uniqueDates[i]).getTime();
    const prev = new Date(uniqueDates[i + 1]).getTime();
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);

    // Allow up to 1.5 days difference to account for small timing variations
    if (diff <= 1.5) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}
