import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, TrendingUp, Info, Scale, Ruler, User, Target, Zap, Waves, Sparkles, Activity as ActivityIcon, TrendingDown, History, Utensils, Calendar } from "lucide-react";
import { FoodScanner } from "@/components/FoodScanner";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion } from "framer-motion";

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
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("recomp");
  const [dietaryPreference, setDietaryPreference] = useState<"veg" | "non-veg" | "mixed">("mixed");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [mealPlan, setMealPlan] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayStep, setOverlayStep] = useState(0);
  const [nutritionHistory, setNutritionHistory] = useState<any[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [protocolActivated, setProtocolActivated] = useState(false);

  useEffect(() => {
    const loadData = async () => {
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
          if (data.daily_calories_target) setProtocolActivated(true);
        }

        const { data: logs } = await supabase
          .from('nutrition_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('logged_at', { ascending: true })
          .limit(30);

        if (logs) {
          setNutritionHistory(logs.map(l => ({
            ...l,
            date: new Date(l.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          })));
        }
      }
    };

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAge(parsed.age || "");
        setWeight(parsed.weight || "");
        setHeight(parsed.height || "");
        setActivity(parsed.activity || "moderate");
        setGoal(parsed.goal || "recomp");
        setDietaryPreference(parsed.dietaryPreference || "mixed");
        if (parsed.age && parsed.weight) setProtocolActivated(true);
      } catch (err) {
        console.error("Local storage parse error:", err);
      }
    }
    loadData();
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

  const handleLogIntake = async () => {
    if (!result) return;
    setIsLogging(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login to save progress");
      setIsLogging(false);
      return;
    }

    try {
      await supabase
        .from('activity_logs' as any)
        .insert({
          user_id: user.id,
          activity_type: 'nutrition',
          value: result.calories,
          created_at: new Date().toISOString()
        });

      await supabase
        .from('nutrition_logs' as any)
        .insert({
          user_id: user.id,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fats: result.fats,
          logged_at: new Date().toISOString()
        });

      toast.success("Progress logged effectively! 💪");

      const { data: logs } = await supabase
        .from('nutrition_logs' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: true })
        .limit(30);

      if (logs) {
        setNutritionHistory(logs.map(l => ({
          ...l,
          date: new Date(l.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })));
      }
    } catch (err) {
      console.error("Logging error:", err);
      toast.error("Failed to log progress");
    } finally {
      setIsLogging(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!result) return;
    setIsUpdating(true);

    setShowOverlay(true);
    setOverlayStep(0);

    for (let i = 0; i < 3; i++) {
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

        if (error) throw error;
      } catch (err: any) {
        console.error("Error syncing nutrition:", err);
      }
    }

    localStorage.setItem(storageKey, JSON.stringify({ age, weight, height, activity, goal, dietaryPreference }));
    setProtocolActivated(true);
    setShowOverlay(false);
    setIsUpdating(false);
    toast.success("Nutritional protocol updated and synced!");
  };

  const handleGenerateMealPlan = async () => {
    if (!result) return;
    setIsGeneratingPlan(true);

    try {
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
          model: "llama-3.1-8b-instant",
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
    <div className="min-h-screen pt-6 pb-28 lg:py-16 relative overflow-hidden bg-black selection:bg-primary/30">
      {/* Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-primary/10 via-black to-black opacity-60" />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }} 
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.1, 0.05] }} 
          transition={{ repeat: Infinity, duration: 15, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[10%] -right-[10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[150px]" 
        />
      </div>

      <Container className="relative z-10 max-w-6xl">
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center text-sm text-white/50 hover:text-primary mb-8 transition-all"
        >
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
          Return to Hub
        </button>

        {/* Hero */}
        <div className="mb-12 space-y-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase font-black tracking-[0.3em] text-primary mb-2">
            <Sparkles className="w-3 h-3" /> Intelligence Protocol v2.0
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-black tracking-tighter text-white">
            Precision <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300 italic">Fueling</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-white/50 text-base max-w-2xl font-medium">
            Your nutritional architecture, decoded. Log meals via AI and calibrate your metabolic baseline.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Top Row: FoodScanner & Daily Target */}
          <div className="lg:col-span-12 grid lg:grid-cols-12 gap-8">
            
            {/* Macro AI - Left Side */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-5 flex flex-col h-full">
               <FoodScanner onScanComplete={() => { 
                   // Refresh local history logic could go here, or we wait for state sync
               }} />
            </motion.div>

            {/* Daily Target Dashboard - Right Side */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-7">
              <Card className="h-full bg-white/5 border-white/10 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                <CardHeader className="border-b border-white/5 pb-4 relative z-10">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-white/60">Energy Dashboard</CardTitle>
                      <CardDescription className="text-white/40">Your daily protocol target</CardDescription>
                    </div>
                    {protocolActivated && (
                      <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <ActivityIcon className="w-3 h-3" /> Active
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-6 relative z-10 flex flex-col justify-center space-y-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left flex-1">
                      <p className="text-7xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        {result?.calories || 0}
                      </p>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary mt-2">Kcal Daily Target</p>
                    </div>
                    
                    <div className="flex gap-4 md:gap-6 flex-wrap justify-center w-full md:w-auto">
                      <TargetRing label="Protein" value={result?.protein} color="#3b82f6" />
                      <TargetRing label="Carbs" value={result?.carbs} color="#f97316" />
                      <TargetRing label="Fats" value={result?.fats} color="#eab308" />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricMini label="BMR Baseline" value={result?.bmr} unit="kcal" />
                    <MetricMini label="Maintenance" value={result?.tdee} unit="kcal" />
                    <MetricMini label="Fiber Min." value={Math.round((result?.calories || 2000)/100*1.5)} unit="g" />
                    <Button 
                      onClick={handleLogIntake}
                      disabled={isLogging || !result}
                      className="w-full h-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black uppercase tracking-widest text-[10px]"
                    >
                      {isLogging ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Target Int."}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Analytics & History Row */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-12 grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden h-full">
                <CardHeader>
                  <CardTitle className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" /> Metabolic Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {nutritionHistory.length > 0 ? (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={nutritionHistory}>
                          <defs>
                            <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00FF9C" stopOpacity={0.5} />
                              <stop offset="95%" stopColor="#00FF9C" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}k`} />
                          <Tooltip contentStyle={{ backgroundColor: '#000000', border: '1px solid #ffffff20', borderRadius: '12px', fontSize: '12px' }} />
                          <Area type="monotone" dataKey="calories" stroke="#00FF9C" fill="url(#colorCal)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-white/10 rounded-2xl bg-white/5">
                      <Calendar className="w-8 h-8 text-white/20" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white/60">Awaiting Data Streams</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Log meals to visualize trends</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden h-full flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-primary" /> Recent Scans
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto max-h-[300px] space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {nutritionHistory.length > 0 ? (
                    [...nutritionHistory].reverse().map((log, i) => (
                      <div key={log.id || i} className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:bg-white/5 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-black text-white truncate max-w-[150px]">{log.meal_name || "Manual Entry"}</p>
                          <p className="text-[10px] font-black text-primary">{log.calories} kcal</p>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-[10px] font-bold text-blue-400">P:{log.protein}</span>
                          <span className="text-[10px] font-bold text-orange-400">C:{log.carbs}</span>
                          <span className="text-[10px] font-bold text-yellow-400">F:{log.fats}</span>
                        </div>
                        <p className="text-[9px] text-white/30 uppercase tracking-widest mt-2">{log.date} • {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-white/30 text-xs">No recent scans.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Calibration Console */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="lg:col-span-12 mt-8">
            <Card className="bg-black border-white/10 ring-1 ring-white/10 rounded-[2.5rem] overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
              <CardHeader className="border-b border-white/5 bg-white/5">
                <CardTitle className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                  <User className="w-6 h-6 text-primary" /> Metabolic Calibration Console
                </CardTitle>
                <CardDescription className="text-white/50">Update your biological signature to recalculate energy targets.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 grid lg:grid-cols-2 gap-12">
                
                {/* Inputs */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-xs uppercase tracking-[0.2em] text-white/60 font-black">Biological Signature</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] text-white/40 uppercase">Age</Label>
                        <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="bg-white/5 border-white/10 text-white font-bold h-12 rounded-xl focus-visible:ring-primary/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] text-white/40 uppercase">Weight (kg)</Label>
                        <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-white/5 border-white/10 text-white font-bold h-12 rounded-xl focus-visible:ring-primary/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] text-white/40 uppercase">Height (cm)</Label>
                        <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="bg-white/5 border-white/10 text-white font-bold h-12 rounded-xl focus-visible:ring-primary/50" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs uppercase tracking-[0.2em] text-white/60 font-black">Metabolic Flux (Activity)</Label>
                    <div className="grid grid-cols-5 gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                      {(['sedentary', 'light', 'moderate', 'active', 'athlete'] as Activity[]).map((level, i) => (
                        <button key={level} onClick={() => setActivity(level)} className={`h-12 rounded-lg flex flex-col items-center justify-center transition-all ${activity === level ? "bg-primary text-black shadow-lg" : "text-white/40 hover:bg-white/10 hover:text-white"}`}>
                          <span className="text-[10px] font-black">{i + 1}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Goals & Sync */}
                <div className="space-y-8 flex flex-col justify-between">
                  <div className="space-y-4">
                    <Label className="text-xs uppercase tracking-[0.2em] text-white/60 font-black">Operational Directive (Goal)</Label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'cut', label: 'Caloric Deficit', sub: 'Protocol: Lipid Oxidation', icon: <TrendingDown className="w-4 h-4" /> },
                        { id: 'recomp', label: 'Maintenance', sub: 'Protocol: Metabolic Stasis', icon: <ActivityIcon className="w-4 h-4" /> },
                        { id: 'bulk', label: 'Lean Bulk', sub: 'Protocol: Tissue Synthesis', icon: <TrendingUp className="w-4 h-4" /> }
                      ].map((item) => (
                        <button key={item.id} onClick={() => setGoal(item.id as Goal)} className={`group relative p-4 rounded-xl border transition-all duration-300 text-left overflow-hidden ${goal === item.id ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
                          <div className="flex items-center justify-between relative z-10">
                            <div>
                              <p className={`text-sm font-black uppercase tracking-widest ${goal === item.id ? "text-primary" : "text-white/40"}`}>{item.label}</p>
                              <p className="text-[10px] text-white/30 font-medium mt-1">{item.sub}</p>
                            </div>
                            <div className={`p-2 rounded-lg transition-all ${goal === item.id ? "bg-primary text-black" : "bg-white/5 text-white/20"}`}>
                              {item.icon}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleUpdatePlan} disabled={isUpdating} className="w-full h-14 bg-white text-black hover:bg-gray-200 font-black uppercase tracking-widest rounded-xl text-xs">
                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Calibrate & Sync Protocol"}
                  </Button>
                </div>

              </CardContent>
            </Card>
          </motion.div>

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

function TargetRing({ label, value, color }: { label: string; value?: number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-black/40 border border-white/5 shadow-inner mb-2" style={{ boxShadow: `inset 0 0 10px ${color}20, 0 0 15px ${color}10` }}>
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="32" cy="32" r="30" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />
          <motion.circle 
            cx="32" cy="32" r="30" 
            stroke={color} strokeWidth="4" fill="none" 
            strokeDasharray="188.5" 
            initial={{ strokeDashoffset: 188.5 }}
            animate={{ strokeDashoffset: value ? 188.5 - (188.5 * 0.7) : 188.5 }} 
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-sm font-black text-white relative z-10">{value || 0}<span className="text-[8px] opacity-50 ml-0.5">g</span></span>
      </div>
      <span className="text-[9px] uppercase font-black text-white/50 tracking-widest">{label}</span>
    </div>
  )
}

function MetricMini({ label, value, unit }: { label: string; value?: number | string; unit: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col justify-center">
      <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1 font-bold">{label}</p>
      <p className="text-lg font-black text-white">{value || 0} <span className="text-[10px] text-white/40">{unit}</span></p>
    </div>
  )
}