import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, TrendingUp, Info, Scale, Ruler, User, Target, Zap, Waves, Sparkles, Flame, Activity as ActivityIcon, TrendingDown } from "lucide-react";
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
    <div className="min-h-screen py-16 relative overflow-hidden bg-[#0A0A0A]">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-30 pointer-events-none" />

      <Container className="relative z-10 max-w-5xl">
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-12 transition-all"
        >
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
          Return to Hub
        </button>

        <div className="flex flex-col gap-12">
          {/* Hero Branding */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase font-bold tracking-[0.3em] text-primary/80 animate-in fade-in slide-in-from-top-4 duration-700">
              Intelligence Protocol v2.0
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Precision <span className="text-primary italic">Fueling</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto leading-relaxed opacity-80">
              Your nutritional architecture, decoded. Use the AI Core to analyze fuel or calculate your metabolic baseline below.
            </p>
          </div>

          {/* AI Core Section */}
          <div className="max-w-xl mx-auto w-full relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <FoodScanner onScanComplete={() => { }} />
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-[0.2em] opacity-40">
              Conversational Food Intelligence System
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 mt-12">
            {/* Inputs Column */}
            {/* Inputs Column - Biological Signature UI */}
            <div className="lg:col-span-12">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border-none ring-1 ring-white/10">
                <CardContent className="p-8 space-y-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-1 text-center md:text-left">
                      <h3 className="text-lg font-black uppercase tracking-[0.3em] text-white">Biological Identity</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">Physiological baseline configuration</p>
                    </div>
                    <Button
                      onClick={handleUpdatePlan}
                      disabled={isUpdating}
                      className="bg-primary text-black font-black uppercase tracking-tighter rounded-full px-8 py-6 hover:scale-105 transition-all shadow-[0_0_30px_rgba(var(--primary),0.2)]"
                    >
                      {isUpdating ? <Loader2 className="animate-spin w-5 h-5" /> : <><Zap className="w-4 h-4 mr-2" /> Sync Protocol</>}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Age', value: age, setter: setAge, unit: 'Years', icon: <User className="w-4 h-4" /> },
                      { label: 'Weight', value: weight, setter: setWeight, unit: 'kg', icon: <Scale className="w-4 h-4" /> },
                      { label: 'Height', value: height, setter: setHeight, unit: 'cm', icon: <Ruler className="w-4 h-4" /> }
                    ].map((item) => (
                      <div key={item.label} className="bg-white/5 border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{item.label}</Label>
                          <div className="text-primary/40">{item.icon}</div>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <Input
                            type="number"
                            value={item.value}
                            onChange={(e) => item.setter(e.target.value)}
                            className="bg-transparent border-none text-3xl font-black p-0 h-auto focus-visible:ring-0 text-white w-20"
                          />
                          <span className="text-[10px] font-bold text-white/20 uppercase">{item.unit}</span>
                        </div>
                      </div>
                    ))}

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/10">
                      <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3 block">Dietary Type</Label>
                      <div className="flex gap-1">
                        {['veg', 'non-veg', 'mixed'].map((diet) => (
                          <button
                            key={diet}
                            onClick={() => setDietaryPreference(diet as any)}
                            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${dietaryPreference === diet
                              ? "bg-primary text-black"
                              : "bg-white/5 text-white/40 hover:bg-white/10"
                              }`}
                          >
                            {diet === 'non-veg' ? 'Non-Veg' : diet.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configuration Column */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-[2rem] overflow-hidden border-none ring-1 ring-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Goal Selective */}
                  <div className="space-y-3">
                    <Label className="text-[9px] uppercase tracking-widest text-primary/60 font-black">Performance Goal</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'cut', label: 'Fat Loss', sub: 'Caloric Deficit' },
                        { id: 'recomp', label: 'Maintenance', sub: 'Recomposition' },
                        { id: 'bulk', label: 'Lean Bulk', sub: 'Muscle Gain' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setGoal(item.id as Goal)}
                          className={`group p-3 rounded-xl border transition-all text-left ${goal === item.id
                            ? "bg-primary/10 border-primary text-white"
                            : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                            }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-tight">{item.label}</p>
                              <p className="text-[8px] opacity-40 uppercase tracking-tighter">{item.sub}</p>
                            </div>
                            {goal === item.id && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Activity Flow */}
                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <Label className="text-[9px] uppercase tracking-widest text-primary/60 font-black">Metabolic Flow</Label>
                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map((level, i) => {
                        const types: Activity[] = ['sedentary', 'light', 'moderate', 'active', 'athlete'];
                        const isActive = activity === types[i];
                        return (
                          <button
                            key={level}
                            onClick={() => setActivity(types[i])}
                            className={`h-8 rounded-lg text-[10px] font-black transition-all ${isActive
                              ? "bg-primary text-black"
                              : "bg-white/5 text-white/20 hover:text-white"
                              }`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[8px] text-center text-white/20 uppercase tracking-[0.2em]">{activity}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Intelligence Report Section */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Energy Protocol Card */}
                <Card className="bg-primary border-none rounded-[2.5rem] p-8 text-black relative overflow-hidden shadow-[0_0_50px_rgba(var(--primary),0.2)]">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="text-center md:text-left">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Energy Balance Protocol</p>
                      <div className="flex items-baseline gap-2 justify-center md:justify-start">
                        <h2 className="text-7xl font-black tracking-tighter tabular-nums leading-none">{result?.calories || 0}</h2>
                        <span className="text-sm font-black uppercase tracking-widest">kcal/day</span>
                      </div>
                    </div>

                    <div className="h-px w-full md:w-px md:h-20 bg-black/10 shrink-0" />

                    <div className="grid grid-cols-3 gap-8 text-center md:text-left">
                      {[
                        { label: 'Prot.', value: result?.protein, c: 'text-black' },
                        { label: 'Carbs', value: result?.carbs, c: 'text-black' },
                        { label: 'Fats', value: result?.fats, c: 'text-black/60' }
                      ].map(m => (
                        <div key={m.label}>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{m.label}</p>
                          <p className={`text-xl font-black ${m.c}`}>{m.value || 0}g</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-center md:justify-start">
                    <Button
                      onClick={handleGenerateMealPlan}
                      disabled={isGeneratingPlan || !result}
                      className="bg-black text-white hover:bg-neutral-900 font-black uppercase tracking-[0.2em] text-[10px] rounded-full px-10 py-5 h-auto transition-transform active:scale-95"
                    >
                      {isGeneratingPlan ? <Loader2 className="animate-spin w-3 h-3" /> : <><Sparkles className="w-3 h-3 mr-2" /> AI Meal Protocol</>}
                    </Button>
                  </div>
                </Card>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { l: 'BMR', v: result?.bmr, u: 'kcal' },
                    { l: 'TDEE', v: result?.tdee, u: 'kcal' },
                    { l: 'TEF', v: Math.round((result?.calories || 0) * 0.1), u: 'kcal' },
                    { l: 'Fiber', v: Math.round((result?.calories || 2000) / 100 * 1.5), u: 'g' }
                  ].map(s => (
                    <div key={s.l} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">{s.l}</p>
                      <p className="text-lg font-black text-white">{s.v || 0}<span className="text-[9px] text-white/20 ml-1">{s.u}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Meal Plan Display */}
            {mealPlan && (
              <div className="lg:col-span-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-white/5 border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-black text-white uppercase tracking-tighter">Daily Protocol</CardTitle>
                        <CardDescription className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">
                          {dietaryPreference.toUpperCase()} • {result?.calories} KCAL BASELINE
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setMealPlan(null)} className="rounded-full text-white/20 hover:text-white">✕</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm text-white/70 font-medium leading-relaxed border-t border-white/5 pt-6">
                      {mealPlan}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Immersive Mastery Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl transition-all duration-500 animate-in fade-in">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative text-center space-y-8 max-w-2xl px-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary blur-[60px] opacity-20 animate-pulse" />
              <div className="relative bg-primary/10 border border-primary/30 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-12 shadow-[0_0_50px_rgba(var(--primary),0.2)]">
                <Zap className="w-12 h-12 text-primary animate-pulse" />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter animate-in slide-in-from-bottom-4 duration-700">
                {[
                  "Initiating Metabolic Synchronization...",
                  "Mastery Protocol Activated! 💎",
                  "You are now in God Mode! 🔥"
                ][overlayStep]}
              </h2>
              <p className="text-primary/60 font-black uppercase tracking-[0.4em] text-sm md:text-base animate-in fade-in slide-in-from-bottom-2 delay-300 duration-700">
                {[
                  "Calibrating physiological baseline",
                  "Energy flux stabilized at peak performance",
                  "Nutritional trajectory: OPTIMIZED"
                ][overlayStep]}
              </p>
            </div>

            <div className="pt-12">
              <div className="w-48 h-1 bg-white/5 mx-auto rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-1000 ease-linear shadow-[0_0_15px_#00FF9C]"
                  style={{ width: `${((overlayStep + 1) / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}