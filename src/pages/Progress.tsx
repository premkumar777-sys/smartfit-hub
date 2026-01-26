import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  Ruler, Trophy, Flame, Calendar, ArrowLeft, Zap, ChevronRight
} from "lucide-react";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";
import { PremiumLock } from "@/components/PremiumLock";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

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

const STORAGE_KEYS = {
  MEASUREMENTS: "smartfit_measurements_v1",
  GOALS: "smartfit_goals_v1",
  PROGRESS: "smartfit_progress_v1",
};

export default function Progress() {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<30 | 60 | 90>(30);

  // Body measurements
  const [measurements, setMeasurements] = useState<BodyMeasurements[]>([]);
  const [newMeasurement, setNewMeasurement] = useState<Partial<BodyMeasurements>>({});

  // Goals
  const [goal, setGoal] = useState<GoalData | null>(null);
  const [newGoal, setNewGoal] = useState({ targetWeight: "", targetDate: "" });

  const gamification = useGamification();

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          const { data, error } = await supabase
            .from('progress_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(90);

          if (error) throw error;
          setLogs(data || []);
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setLogs(parsed);
            } catch { /* ignore */ }
          }
        }

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
      } catch (err) {
        console.error("Error loading data:", err);
        toast.error("Failed to load progress data");
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
      id: typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 11),
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
    gamification.recordProgressLog();
    setWeight("");
    setNotes("");
    toast.success("Progress logged! +25 XP 💪");

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
        const { error } = await supabase.from('progress_logs').delete().eq('id', logId);
        if (error) throw error;
      }
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
    gamification.recordProgressLog();
    toast.success("Measurements saved! +25 XP");
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

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-15" />
      <Container className="relative z-10">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>

        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Dashboard</p>
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="text-gradient">Smart</span> Progress
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Track your fitness journey with comprehensive analytics
          </p>
        </div>

        <PremiumLock
          title="Unlock Progress Tracking"
          description="Get detailed analytics, body measurement tracking, and goal settings with SmartFit Pro."
          features={[
            "Weight Trend Analytics",
            "Body Measurement Logs",
            "Fitness Goal Progress",
            "Historical Data Export"
          ]}
        >
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <StatCard icon={Scale} label="Current" value={stats ? `${stats.latest} kg` : "--"} accent />
            <StatCard
              icon={stats?.change && stats.change < 0 ? TrendingDown : TrendingUp}
              label="Change"
              value={stats ? `${stats.change > 0 ? "+" : ""}${stats.change} kg` : "--"}
            />
            <StatCard icon={Flame} label="Streak" value={stats ? `${stats.streak} days` : "--"} />
            <StatCard icon={Calendar} label="Weekly Avg" value={stats?.weeklyAvg ? `${stats.weeklyAvg} kg` : "--"} />
            <StatCard icon={Trophy} label="XP Earned" value={`${gamification.xp}`} />
            <StatCard icon={Target} label="Level" value={`${gamification.level}`} />
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="weight" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="weight">Weight</TabsTrigger>
              <TabsTrigger value="measurements">Measurements</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

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
                <CardContent>
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
          </Tabs>
        </PremiumLock>
      </Container>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: boolean }) {
  return (
    <Card className={`glass ${accent ? "border-primary/50 bg-primary/5" : "border-gray-800"}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${accent ? "bg-primary/20" : "bg-gray-800"}`}>
            <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Calculate streak helper
function calcStreak(sorted: ProgressLog[]) {
  if (!sorted.length) return 0;
  let streak = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    const curr = new Date(sorted[i].date).getTime();
    const prev = new Date(sorted[i - 1].date).getTime();
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff <= 1.5) streak += 1;
    else break;
  }
  return streak;
}
