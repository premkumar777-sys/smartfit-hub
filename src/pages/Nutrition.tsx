import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [age, setAge] = useState("28");
  const [weight, setWeight] = useState("70"); // kg
  const [height, setHeight] = useState("175"); // cm
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("recomp");

  useEffect(() => {
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

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ age, weight, height, activity, goal })
    );
  }, [age, weight, height, activity, goal]);

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

  return (
    <div className="min-h-screen py-16 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-20" />
      <Container className="relative z-10">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6" aria-label="Back to home page">
          ← Back
        </Link>

        <div className="flex flex-col gap-8">
          <div className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Nutrition</p>
            <h1 className="text-4xl md:text-5xl font-bold">Macro & Calorie Planner</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Modern, fast, and offline-friendly. Calculate TDEE, target calories, and macros instantly.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 glass border-primary/20">
              <CardHeader>
                <CardTitle>Inputs</CardTitle>
                <CardDescription>All local—no data leaves your browser.</CardDescription>
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
                    <Label>Activity</Label>
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
                    <Label>Goal</Label>
                    <Select value={goal} onValueChange={(v) => setGoal(v as Goal)}>
                      <SelectTrigger><SelectValue placeholder="Goal" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cut">Cut</SelectItem>
                        <SelectItem value="recomp">Recomp</SelectItem>
                        <SelectItem value="bulk">Lean Bulk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="hero" type="button" onClick={() => { /* values auto-calc via memo */ }}>
                    Update Plan
                  </Button>
                  <Button variant="outline" type="button" onClick={() => {
                    setAge("28"); setWeight("70"); setHeight("175"); setActivity("moderate"); setGoal("recomp");
                  }}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle>Your Targets</CardTitle>
                <CardDescription>Auto-updates as you tweak inputs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {result ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Tile label="BMR" value={`${result.bmr} kcal`} />
                      <Tile label="TDEE" value={`${result.tdee} kcal`} />
                      <Tile label="Target Calories" value={`${result.calories} kcal`} accent />
                      <Tile label="Protein" value={`${result.protein} g`} />
                      <Tile label="Carbs" value={`${result.carbs} g`} />
                      <Tile label="Fats" value={`${result.fats} g`} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Protein/Fats scaled per kg. Carbs fill the remaining calories.
                    </p>
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
                <p>Cut: High protein, moderate fats, controlled carbs.</p>
                <p>Recomp: Balanced protein/carbs, moderate fats.</p>
                <p>Lean Bulk: High carbs to support training volume.</p>
              </CardContent>
            </Card>
            <Card className="glass border-primary/20">
              <CardHeader><CardTitle>Meal Ideas</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Breakfast: Greek yogurt, berries, oats, whey.</p>
                <p>Lunch: Chicken, rice, veggies, olive oil.</p>
                <p>Dinner: Salmon, potatoes, greens.</p>
                <p>Snacks: Cottage cheese, fruit, nuts.</p>
              </CardContent>
            </Card>
            <Card className="glass border-primary/20">
              <CardHeader><CardTitle>Hydration & Recovery</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Hydrate: 30–40 ml/kg daily.</p>
                <p>Electrolytes on high-sweat days.</p>
                <p>Sleep: 7–9 hours; light mobility on rest days.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-3 rounded-lg border ${accent ? "border-primary/50 bg-primary/5 text-primary-foreground" : "border-gray-800 bg-gray-900/60"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
import { Container } from "@/components/Container";

export default function Nutrition() {
  return (
    <div className="min-h-screen py-20">
      <Container>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            Nutrition <span className="text-yellow-600">Beta</span>
          </h1>
          <p className="text-lg md:text-xl leading-relaxed text-gray-300 max-w-2xl mx-auto mb-8">
            Calorie & macro calculator - Coming soon! Track your nutrition, plan meals, and optimize your diet for better fitness results.
          </p>
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
            <p className="text-gray-400">
              This feature is currently in development. Stay tuned for our advanced nutrition tracking and meal planning tools!
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
