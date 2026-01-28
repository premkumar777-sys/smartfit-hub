import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PremiumLock } from "@/components/PremiumLock";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Utensils } from "lucide-react";

type Activity = "sedentary" | "light" | "moderate" | "active" | "athlete";
type Goal = "cut" | "recomp" | "bulk";

const activityMap: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

const goalMap: Record<Goal, { label: string; calories: number; protein: number; carbs: number; fats: number }> = {
  cut: { label: "Fat Loss", calories: -400, protein: 2.2, carbs: 3, fats: 0.8 },
  recomp: { label: "Recomp", calories: 0, protein: 2.0, carbs: 3.5, fats: 0.9 },
  bulk: { label: "Lean Bulk", calories: 250, protein: 1.8, carbs: 4.5, fats: 1.0 },
};

const storageKey = "smartfit_nutrition_v1";

export default function Nutrition() {
  const navigate = useNavigate();
  const [age, setAge] = useState("28");
  const [weight, setWeight] = useState("70"); // kg
  const [height, setHeight] = useState("175"); // cm
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("recomp");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  // Quick Log State
  const [logCalories, setLogCalories] = useState("");

  useEffect(() => {
    const loadProfileSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('daily_calories_target, fitness_goal')
          .eq('id', session.user.id)
          .single();

        // If we have data in DB, we could use it, but the local inputs are and calcs are better for UI
      }
    };

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAge(parsed.age || "28");
        setWeight(parsed.weight || "70");
        setHeight(parsed.height || "175");
        setActivity(parsed.activity || "moderate");
        setGoal(parsed.goal || "recomp");
      } catch {
        // ignore
      }
    }
  }, []);

  const result = useMemo(() => {
    const w = parseFloat(weight || "0");
    const h = parseFloat(height || "0");
    const a = parseFloat(age || "0");
    if (!w || !h || !a) return null;

    // Mifflin-St Jeor (male-ish default)
    const bmr = 10 * w + 6.25 * h - 5 * a + 5;
    const tdee = Math.round(bmr * activityMap[activity]);
    const goalAdjust = goalMap[goal];
    const calories = tdee + goalAdjust.calories;

    // macros per kg
    const protein = Math.round(goalAdjust.protein * w);
    const fats = Math.round(goalAdjust.fats * w);
    const carbs = Math.max(0, Math.round((calories - protein * 4 - fats * 9) / 4));

    return { bmr: Math.round(bmr), tdee: Math.round(tdee), calories, protein, fats, carbs };
  }, [age, weight, height, activity, goal]);

  const handleUpdatePlan = async () => {
    if (!result) return;
    setIsUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to save your targets");
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          daily_calories_target: result.calories,
          protein_target: result.protein,
          carbs_target: result.carbs,
          fats_target: result.fats,
          fitness_goal: goalMap[goal].label
        })
        .eq('id', session.user.id);

      if (error) throw error;

      localStorage.setItem(storageKey, JSON.stringify({ age, weight, height, activity, goal }));
      toast.success("Nutrition targets updated and synced! 🚀");
    } catch (err) {
      console.error("Update plan error:", err);
      toast.error("Failed to sync targets to cloud.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogMeal = async () => {
    const cals = parseInt(logCalories);
    if (!cals || cals <= 0) {
      toast.error("Please enter valid calories");
      return;
    }

    setIsLogging(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from('nutrition_logs').insert({
        user_id: session.user.id,
        calories: cals,
        // For now we just log calories, could expand to macros
      });

      if (error) throw error;

      toast.success(`Logged ${cals} calories! 🍏`);
      setLogCalories("");
    } catch (err) {
      console.error("Log meal error:", err);
      toast.error("Failed to log nutrition.");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="min-h-screen py-16 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-20" />
      <Container className="relative z-10">
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6" aria-label="Go back">
          ← Back
        </button>

        <div className="flex flex-col gap-8">
          <div className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Nutrition</p>
            <h1 className="text-4xl md:text-5xl font-bold">Macro & Calorie Planner</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {result ? `Targeting ${result.calories} kcal for ${goalMap[goal].label}. Synchronized with your global dashboard.` : 'Calculate TDEE, target calories, and macros instantly.'}
            </p>
          </div>

          <PremiumLock
            title="Unlock AI Nutrition"
            description="Get personalized meal plans and real-time macro tracking with SmartFit Pro."
            features={[
              "Custom Meal Plan Generation",
              "Smart Macro Tracking",
              "Grocery List Automation",
              "Dietary Restriction Support"
            ]}
          >
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 glass border-primary/20">
                <CardHeader>
                  <CardTitle>Inputs</CardTitle>
                  <CardDescription>Setup your profile to calculate targets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input id="age" value={age} onChange={(e) => setAge(e.target.value)} type="number" min={14} max={90} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} type="number" min={30} max={200} step="0.1" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input id="height" value={height} onChange={(e) => setHeight(e.target.value)} type="number" min={120} max={220} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Activity Level</Label>
                      <Select value={activity} onValueChange={(v) => setActivity(v as Activity)}>
                        <SelectTrigger><SelectValue placeholder="Activity level" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedentary">Sedentary</SelectItem>
                          <SelectItem value="light">Light (1–2x/week)</SelectItem>
                          <SelectItem value="moderate">Moderate (3–4x/week)</SelectItem>
                          <SelectItem value="active">Active (5–6x/week)</SelectItem>
                          <SelectItem value="athlete">Athlete (daily)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Primary Goal</Label>
                      <Select value={goal} onValueChange={(v) => setGoal(v as Goal)}>
                        <SelectTrigger><SelectValue placeholder="Goal" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cut">Fat Loss (Cut)</SelectItem>
                          <SelectItem value="recomp">Maintain / Recomp</SelectItem>
                          <SelectItem value="bulk">Lean Bulk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="hero"
                      type="button"
                      onClick={handleUpdatePlan}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                      Update & Sync Plan
                    </Button>
                    <Button variant="outline" type="button" onClick={() => {
                      setAge("28"); setWeight("70"); setHeight("175"); setActivity("moderate"); setGoal("recomp");
                    }}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic Targets Tile */}
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle>Your Targets</CardTitle>
                  <CardDescription>Auto-calculated targets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Tile label="BMR" value={`${result.bmr} kcal`} />
                        <Tile label="TDEE" value={`${result.tdee} kcal`} />
                        <Tile label="Target" value={`${result.calories} kcal`} accent />
                        <Tile label="Protein" value={`${result.protein} g`} />
                        <Tile label="Carbs" value={`${result.carbs} g`} />
                        <Tile label="Fats" value={`${result.fats} g`} />
                      </div>

                      <div className="mt-6 pt-6 border-t border-white/10">
                        <Label htmlFor="log-cals" className="flex items-center gap-2 mb-3">
                          <Utensils className="w-4 h-4 text-orange-500" /> Quick Log Intake
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="log-cals"
                            placeholder="E.g. 500 kcal"
                            value={logCalories}
                            onChange={(e) => setLogCalories(e.target.value)}
                            type="number"
                          />
                          <Button
                            size="icon"
                            className="bg-orange-500 hover:bg-orange-600"
                            onClick={handleLogMeal}
                            disabled={isLogging}
                          >
                            {isLogging ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Enter your details to see targets.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="glass border-primary/20">
                <CardHeader><CardTitle>Quick Macro Splits</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p className="text-foreground font-semibold">
                    {goalMap[goal].label} ({goal})
                  </p>
                  <p>Protein: ~{goalMap[goal].protein} g/kg</p>
                  <p>Fats: ~{goalMap[goal].fats} g/kg</p>
                  <p>Carbs: Remaining calories.</p>
                  {result && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs text-foreground">
                      Target: {result.calories} kcal · P {result.protein}g · C {result.carbs}g · F {result.fats}g
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="glass border-primary/20">
                <CardHeader><CardTitle>Meal Strategy</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {goal === "cut" && <p>Focus on high volume, low calorie foods like leafy greens and lean protein.</p>}
                  {goal === "recomp" && <p>Focus on timing carbs around your workouts for maximum performance.</p>}
                  {goal === "bulk" && <p>Eat calorie dense foods like nuts, avocados, and whole grains.</p>}
                  <p className="mt-2">Try to hit within +/- 100 calories of your target daily for best results.</p>
                </CardContent>
              </Card>
              <Card className="glass border-primary/20">
                <CardHeader><CardTitle>Hydration & Data</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Aim for 3-4 liters of water daily.</p>
                  <p>Logging your intake help the AI refine your plans and gives you accurate dashboard metrics.</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-primary">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Live Dashboard Sync Active
                  </div>
                </CardContent>
              </Card>
            </div>
          </PremiumLock>
        </div>
      </Container>
    </div>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-3 rounded-lg border ${accent ? "border-primary/50 bg-primary/20 text-white font-bold" : "border-gray-800 bg-gray-900/60"}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-lg">{value}</p>
    </div>
  );
}