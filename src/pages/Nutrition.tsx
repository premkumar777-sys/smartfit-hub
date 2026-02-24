import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, TrendingUp, Info, Scale, Ruler, User, Target, Zap, Waves, Sparkles, Flame, Activity as ActivityIcon, TrendingDown, Utensils, Bot, ChefHat, Dumbbell, BarChart3, Settings2, LogOut, Home } from "lucide-react";
import { FoodScanner } from "@/components/FoodScanner";

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
  cut: { label: "Fat Loss (Cut)", calories: -400, protein: 2.2, carbs: 3, fats: 0.8 },
  recomp: { label: "Maintenance (Recomp)", calories: 0, protein: 2.0, carbs: 3.5, fats: 0.9 },
  bulk: { label: "Lean Bulk", calories: 250, protein: 1.8, carbs: 4.5, fats: 1.0 },
};

const storageKey = "smartfit_nutrition_v1";

export default function Nutrition() {
  const navigate = useNavigate();
  const [age, setAge] = useState("28");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("175");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("recomp");
  const [dietaryPreference, setDietaryPreference] = useState<"veg" | "non-veg" | "mixed">("mixed");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [mealPlan, setMealPlan] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayStep, setOverlayStep] = useState(0);

  useEffect(() => {
    const loadProfileSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('daily_calories_target, fitness_goal, age, weight, height, activity_level')
          .eq('id', session.user.id)
          .single();

        if (data) {
          if (data.fitness_goal) {
            const goalKey = Object.keys(goalMap).find(key => goalMap[key as Goal].label === data.fitness_goal) as Goal;
            if (goalKey) setGoal(goalKey);
          }
          if (data.age) setAge(data.age.toString());
          if (data.weight) setWeight(data.weight.toString());
          if (data.height) setHeight(data.height.toString());
          if (data.activity_level) setActivity(data.activity_level as Activity);
        }
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
        setDietaryPreference(parsed.dietaryPreference || "mixed");
      } catch (err) {
        console.error("Local storage parse error:", err);
      }
    }
    loadProfileSettings();
  }, []);

  const result = useMemo(() => {
    const w = parseFloat(weight || "0");
    const h = parseFloat(height || "0");
    const a = parseFloat(age || "0");
    if (!w || !h || !a) return null;

    const bmr = 10 * w + 6.25 * h - 5 * a + 5;
    const tdee = Math.round(bmr * activityMap[activity]);
    const goalAdjust = goalMap[goal];
    const calories = tdee + goalAdjust.calories;

    const protein = Math.round(goalAdjust.protein * w);
    const fats = Math.round(goalAdjust.fats * w);
    const carbs = Math.max(0, Math.round((calories - protein * 4 - fats * 9) / 4));

    return { bmr: Math.round(bmr), tdee: Math.round(tdee), calories, protein, fats, carbs };
  }, [age, weight, height, activity, goal]);

  const handleUpdatePlan = async () => {
    if (!result) return;
    setIsUpdating(true);

    // Immersive Overlay Sequence
    setShowOverlay(true);
    setOverlayStep(0);

    // 3 steps, 2 seconds each
    const stepsCount = 3;
    for (let i = 0; i < stepsCount; i++) {
      setOverlayStep(i);
      await new Promise(r => setTimeout(r, 2000));
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            age: parseInt(age),
            weight: parseFloat(weight),
            height: parseFloat(height),
            activity_level: activity,
            daily_calories_target: result.calories,
            fitness_goal: goalMap[goal].label,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (error) {
          console.error("Supabase error syncing nutrition:", error);
          toast.error(`Sync failed: ${error.message}`);
          throw error;
        }
      } catch (err: any) {
        console.error("Error syncing nutrition to DB:", err);
        if (!err.message?.includes("Sync failed")) {
          toast.error("Failed to sync targets to cloud");
        }
      }
    }

    localStorage.setItem(storageKey, JSON.stringify({ age, weight, height, activity, goal, dietaryPreference }));
    setShowOverlay(false);
    setIsUpdating(false);
    toast.success("Nutritional protocol updated and synced!");
  };

  const handleGenerateMealPlan = async () => {
    if (!result) return;
    setIsGeneratingPlan(true);

    try {
      // Get Groq Key (same logic as FoodScanner)
      let groqKey = import.meta.env.VITE_GROQ_API_KEY || "";
      if (!groqKey) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("preferences")
            .eq("id", user.id)
            .single();
          groqKey = (profile?.preferences as any)?.groq_api_key || "";
        }
      }

      groqKey = groqKey.replace(/^["']|["']$/g, '').trim();

      if (!groqKey) {
        toast.error("AI Assistant Unavailable", { description: "Please add your Groq API key in Settings or .env" });
        setIsGeneratingPlan(false);
        return;
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a high-performance Nutrition AI. Create a detailed 1-day meal plan for a user with the following targets:
              Calories: ${result.calories} kcal
              Protein: ${result.protein}g
              Carbs: ${result.carbs}g
              Fats: ${result.fats}g
              Dietary Preference: ${dietaryPreference.toUpperCase()}
              
              FORMAT:
              - Breakfast (Time, Name, Macros, Ingredients)
              - Lunch (Time, Name, Macros, Ingredients)
              - Snack (Time, Name, Macros, Ingredients)
              - Dinner (Time, Name, Macros, Ingredients)
              
              Keep it highly professional, science-based, and appetizing.`
            },
            {
              role: "user",
              content: `Generate a ${dietaryPreference} meal plan for today.`
            }
          ]
        })
      });

      if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);

      const data = await response.json();
      setMealPlan(data.choices[0].message.content);
      toast.success("Precision Meal Plan generated!");
    } catch (error: any) {
      console.error("Meal Plan Error:", error);
      toast.error("Failed to generate plan", { description: error.message });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col md:flex-row font-sans selection:bg-green-100 selection:text-green-900">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 z-20">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">SmartFit <span className="text-green-500">AI</span></span>
          </div>

          <nav className="space-y-1">
            {[
              { icon: ActivityIcon, label: 'Dashboard', path: '/dashboard' },
              { icon: Utensils, label: 'Log Meal', path: '#' },
              { icon: Target, label: 'Nutrition', path: '/nutrition', active: true },
              { icon: Zap, label: 'Workout', path: '/ai-workout' },
              { icon: TrendingUp, label: 'Progress', path: '/progress' },
              { icon: Bot, label: 'AI Coach', path: '/ai-trainer' },
              { icon: User, label: 'Settings', path: '/settings' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => item.path !== '#' && navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${item.active
                  ? "bg-green-50 text-green-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
              P
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">Prem</p>
              <p className="text-xs text-gray-500 truncate">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-900">Good Evening, Prem 👋</h1>
            <p className="text-xs text-gray-500 font-medium">Goal: {goalMap[goal].label} • {result?.calories || 2400} kcal/day</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="rounded-full bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
              Weekly Report
            </Button>
            <Button size="sm" className="rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold">
              <Sparkles className="w-4 h-4 mr-2" /> Upgrade to Elite
            </Button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Stats */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Card 1 – Calories Today */}
                <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-2 rounded-lg bg-green-50 text-green-600">
                        <Flame className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-wider">
                        Active
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Calories Today</p>
                        <div className="flex items-baseline gap-2">
                          <h2 className="text-3xl font-bold text-gray-900">2,093</h2>
                          <span className="text-sm font-medium text-gray-400">/ {result?.calories || 2400} kcal</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                          <span>Progress</span>
                          <span className="text-green-600">307 kcal remaining</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '87%' }}
                            className="h-full bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                          />
                        </div>
                      </div>

                      <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl h-11 transition-all">
                        + Log Meal
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 2 – Macronutrients */}
                <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Macronutrients</h3>

                    <div className="space-y-6">
                      {[
                        { label: 'Protein', icon: <div className="w-2 h-2 rounded-full bg-blue-500" />, value: result?.protein || 160, current: 148, unit: 'g', color: 'bg-blue-500' },
                        { label: 'Carbs', icon: <div className="w-2 h-2 rounded-full bg-orange-500" />, value: result?.carbs || 250, current: 225, unit: 'g', color: 'bg-orange-500' },
                        { label: 'Fats', icon: <div className="w-2 h-2 rounded-full bg-purple-500" />, value: result?.fats || 70, current: 67, unit: 'g', color: 'bg-purple-500' }
                      ].map((macro) => (
                        <div key={macro.label} className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {macro.icon}
                              <span className="font-bold text-gray-500 uppercase">{macro.label}</span>
                            </div>
                            <span className="font-bold text-gray-900">{macro.current}{macro.unit} <span className="text-gray-300">/ {macro.value}{macro.unit}</span></span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(macro.current / macro.value) * 100}%` }}
                              className={`h-full ${macro.color} rounded-full`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly Progress Chart */}
              <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="p-6 pb-0 flex flex-row items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Weekly Progress</h3>
                  <Select defaultValue="weight">
                    <SelectTrigger className="w-32 h-8 rounded-lg text-xs font-bold border-gray-200">
                      <SelectValue placeholder="Metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight">Weight (kg)</SelectItem>
                      <SelectItem value="calories">Calories</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="p-6 pt-8">
                  <div className="h-[200px] w-full flex items-end justify-between gap-2">
                    {[68.5, 68.2, 68.4, 68.1, 67.9, 67.8, 67.6].map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                        <div className="w-full relative h-[150px] flex items-end">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(v / 70) * 100}%` }}
                            className="w-full bg-green-500/10 hover:bg-green-500/20 rounded-t-lg transition-colors border-t-2 border-green-500"
                          />
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <span className="text-[10px] font-bold bg-gray-900 text-white px-2 py-1 rounded">
                              {v} kg
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Bio & Config Section (Integrated) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <CardHeader className="p-6 pb-0">
                    <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-widest">Biological Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Age', value: age, setter: setAge, unit: 'Yrs' },
                        { label: 'Weight', value: weight, setter: setWeight, unit: 'kg' },
                        { label: 'Height', value: height, setter: setHeight, unit: 'cm' }
                      ].map((item) => (
                        <div key={item.label} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <Label className="text-[9px] font-black text-gray-400 uppercase block mb-1">{item.label}</Label>
                          <Input
                            type="number"
                            value={item.value}
                            onChange={(e) => item.setter(e.target.value)}
                            className="h-7 p-0 bg-transparent border-none text-base font-bold text-gray-900 focus-visible:ring-0"
                          />
                          <span className="text-[10px] text-gray-300 font-bold uppercase">{item.unit}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-gray-400 uppercase">Dietary Type</Label>
                      <div className="flex gap-1">
                        {['veg', 'non-veg', 'mixed'].map((diet) => (
                          <button
                            key={diet}
                            onClick={() => setDietaryPreference(diet as any)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${dietaryPreference === diet
                              ? "bg-green-500 text-white"
                              : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                              }`}
                          >
                            {diet}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleUpdatePlan}
                      disabled={isUpdating}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl h-10 mt-2"
                    >
                      {isUpdating ? <Loader2 className="animate-spin w-4 h-4" /> : "Sync Base Protocol"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <CardHeader className="p-6 pb-0">
                    <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-widest">Protocol Config</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-gray-400 uppercase">Performance Goal</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {['cut', 'recomp', 'bulk'].map((g) => (
                          <button
                            key={g}
                            onClick={() => setGoal(g as Goal)}
                            className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${goal === g
                              ? "bg-blue-500 text-white"
                              : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                              }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-gray-400 uppercase">Activity Level (1-5)</Label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level, i) => {
                          const types: Activity[] = ['sedentary', 'light', 'moderate', 'active', 'athlete'];
                          return (
                            <button
                              key={level}
                              onClick={() => setActivity(types[i])}
                              className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all ${activity === types[i]
                                ? "bg-orange-500 text-white"
                                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                }`}
                            >
                              {level}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={handleGenerateMealPlan}
                        disabled={isGeneratingPlan}
                        className="w-full bg-green-50 text-green-700 hover:bg-green-100 text-xs font-bold rounded-xl h-10"
                      >
                        {isGeneratingPlan ? <Loader2 className="animate-spin w-4 h-4" /> : "Request AI Meal Plan"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column: Meals & Tools */}
            <div className="space-y-8">
              {/* Today's Meals Card */}
              <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="p-6">
                  <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider">Today's Meals</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  {[
                    { name: 'Oatmeal with Berries', calories: 450, time: '08:00 AM', icon: '🥣' },
                    { name: 'Chicken Breast & Rice', calories: 820, time: '01:30 PM', icon: '🍗' },
                    { name: 'Paneer Curry & Roti', calories: 600, time: '08:30 PM', icon: '🥘' }
                  ].map((meal, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        {meal.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{meal.name}</p>
                        <p className="text-xs text-gray-400 font-medium">{meal.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{meal.calories}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">kcal</p>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-gray-100">
                    <FoodScanner onScanComplete={() => { }} />
                  </div>
                </CardContent>
              </Card>

              {/* Meal Plan Content (if exists) */}
              {mealPlan && (
                <Card className="bg-green-50 border-green-100 rounded-2xl shadow-sm border">
                  <CardHeader className="p-6 flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-[10px] font-black text-green-700 uppercase tracking-[0.2em]">AI Intelligence Report</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setMealPlan(null)} className="h-6 w-6 text-green-700 hover:bg-green-200/50">✕</Button>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="text-xs text-green-800 leading-relaxed font-medium whitespace-pre-wrap">
                      {mealPlan}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Wisdom Widget */}
              <Card className="bg-gray-900 text-white rounded-2xl shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Bot className="w-20 h-20" />
                </div>
                <CardContent className="p-6 relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">AI Nutritionist</h4>
                      <p className="text-xs text-gray-400">Online now • Ask anything</p>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-gray-300 italic">
                    "Prem, you are 307 kcal away from your target. A high-protein snack like Greek yogurt would be perfect now."
                  </div>
                  <div className="relative">
                    <Input
                      placeholder="Ask about your diet..."
                      className="h-10 bg-white/10 border-white/5 text-white placeholder:text-gray-500 rounded-xl pr-10 focus-visible:ring-green-500 transition-all"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 hover:text-green-400">
                      <Zap className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Legacy Overlay Support */}
      {showOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-md transition-all duration-500 animate-in fade-in">
          <div className="relative text-center space-y-6 max-w-md px-6">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-8 animate-bounce">
              <Zap className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {[
                "Updating Baseline...",
                "Protocol Calibrated! ✅",
                "Ready for Performance 🔥"
              ][overlayStep]}
            </h2>
            <div className="w-32 h-1 bg-gray-100 mx-auto rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-1000 ease-linear"
                style={{ width: `${((overlayStep + 1) / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}