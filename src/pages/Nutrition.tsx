import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusinessPremiumLock } from "@/components/BusinessPremiumLock";
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
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const loadProfileSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('daily_calories_target, fitness_goal')
          .eq('id', session.user.id)
          .single();

        if (data?.fitness_goal) {
          // Find key from label
          const goalKey = Object.keys(goalMap).find(key => goalMap[key as Goal].label === data.fitness_goal) as Goal;
          if (goalKey) setGoal(goalKey);
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
      toast.success("Intelligence data synced to profile! 🚀", {
        description: `New target: ${result.calories} kcal`
      });
    } catch (err) {
      console.error("Update plan error:", err);
      toast.error("Failed to sync targets to cloud.");
    } finally {
      setIsUpdating(false);
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

          <BusinessPremiumLock
            lockType="business"
            title="Unlock Metabolic Mastery"
            description="Access deep physiological analytics and personalized nutrition routing."
            features={["Metabolic Adaptation Tracking", "Macro Cycling Protocol", "AI Meal Planning"]}
          >
            <div className="grid lg:grid-cols-12 gap-8 mt-12">
              {/* Inputs Column */}
              {/* Inputs Column - Biological Signature UI */}
              <div className="lg:col-span-12">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">Biological Signature</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">Configure physiological baseline</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="group relative bg-white/5 border border-white/10 rounded-3xl p-6 transition-all hover:bg-white/10 hover:border-primary/30">
                      <div className="absolute top-4 right-4 text-primary/20 group-hover:text-primary transition-colors">
                        <User className="w-5 h-5" />
                      </div>
                      <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-2 block">Years / Age</Label>
                      <Input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="bg-transparent border-none text-4xl font-black p-0 h-auto focus-visible:ring-0 text-white tabular-nums"
                      />
                    </div>

                    <div className="group relative bg-white/5 border border-white/10 rounded-3xl p-6 transition-all hover:bg-white/10 hover:border-primary/30">
                      <div className="absolute top-4 right-4 text-primary/20 group-hover:text-primary transition-colors">
                        <Scale className="w-5 h-5" />
                      </div>
                      <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-2 block">Mass / Weight (kg)</Label>
                      <Input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="bg-transparent border-none text-4xl font-black p-0 h-auto focus-visible:ring-0 text-white tabular-nums"
                      />
                    </div>

                    <div className="group relative bg-white/5 border border-white/10 rounded-3xl p-6 transition-all hover:bg-white/10 hover:border-primary/30">
                      <div className="absolute top-4 right-4 text-primary/20 group-hover:text-primary transition-colors">
                        <Ruler className="w-5 h-5" />
                      </div>
                      <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-2 block">Stature / Height (cm)</Label>
                      <Input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="bg-transparent border-none text-4xl font-black p-0 h-auto focus-visible:ring-0 text-white tabular-nums"
                      />
                    </div>

                    <button
                      onClick={handleUpdatePlan}
                      disabled={isUpdating}
                      className="group relative h-full min-h-[100px] flex flex-col items-center justify-center bg-primary rounded-3xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 overflow-hidden shadow-[0_0_30px_rgba(var(--primary),0.2)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        {isUpdating ? (
                          <Loader2 className="animate-spin w-8 h-8 text-black" />
                        ) : (
                          <>
                            <Zap className="w-6 h-6 text-black group-hover:animate-pulse" />
                            <span className="text-sm font-black text-black uppercase tracking-tighter">Sync & Recalculate</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Config - Operational Directives & Metabolic Flux */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="bg-black/40 border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden rounded-[2.5rem] border-none ring-1 ring-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black text-white/40 uppercase tracking-[0.3em] flex items-center justify-between">
                      Operational Directives
                      <Target className="w-4 h-4 text-primary" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'cut', label: 'Caloric Deficit', sub: 'Protocol: Lipid Oxidation', icon: <TrendingDown className="w-4 h-4" /> },
                        { id: 'recomp', label: 'Maintenance', sub: 'Protocol: Metabolic Stasis', icon: <ActivityIcon className="w-4 h-4" /> },
                        { id: 'bulk', label: 'Lean Bulk', sub: 'Protocol: Tissue Synthesis', icon: <TrendingUp className="w-4 h-4" /> }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setGoal(item.id as Goal)}
                          className={`group relative p-4 rounded-2xl border transition-all duration-300 text-left overflow-hidden ${goal === item.id
                            ? "bg-primary/20 border-primary text-white shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                            : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/20"
                            }`}
                        >
                          <div className={`absolute top-0 left-0 w-1 h-full transition-all ${goal === item.id ? "bg-primary" : "bg-transparent"}`} />
                          <div className="flex items-center justify-between relative z-10">
                            <div className="space-y-1">
                              <p className={`text-xs font-black uppercase tracking-widest ${goal === item.id ? "text-primary" : "text-white/40"}`}>{item.label}</p>
                              <p className="text-[10px] opacity-60 font-medium">{item.sub}</p>
                            </div>
                            <div className={`p-2 rounded-xl transition-all ${goal === item.id ? "bg-primary text-black" : "bg-white/5 text-white/20"}`}>
                              {item.icon}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="pt-6 mt-4 border-t border-white/5">
                      <Label className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-4 block font-black">Metabolic Flux Level</Label>
                      <div className="grid grid-cols-5 gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/5">
                        {(['sedentary', 'light', 'moderate', 'active', 'athlete'] as Activity[]).map((level, i) => (
                          <button
                            key={level}
                            onClick={() => setActivity(level)}
                            className={`h-10 rounded-xl flex flex-col items-center justify-center transition-all ${activity === level
                              ? "bg-primary text-black shadow-lg"
                              : "text-white/40 hover:bg-white/10 hover:text-white"
                              }`}
                          >
                            <span className="text-[10px] font-black">{i + 1}</span>
                            <div className={`w-1 h-1 rounded-full mt-0.5 ${activity === level ? "bg-black" : "bg-white/20"}`} />
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2 px-1">
                        <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Base</span>
                        <span className="text-[9px] uppercase tracking-widest text-primary font-black">{activity.toUpperCase()}</span>
                        <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Peak</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Visual Results Dashboard */}
              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  {/* Calories Highlight */}
                  <Card className="bg-primary/5 border-primary/20 backdrop-blur-md rounded-[2.5rem] relative overflow-hidden md:col-span-2 p-8 flex flex-col items-center justify-center text-center">
                    <Waves className="absolute bottom-0 left-0 w-full h-32 text-primary/10 -mb-8 pointer-events-none" />
                    <div className="relative z-10 space-y-2">
                      <p className="text-xs font-black uppercase tracking-[0.4em] text-primary">Daily Energy Target</p>
                      <h2 className="text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                        {result?.calories || 0}
                      </h2>
                      <p className="text-sm font-medium text-white/40 uppercase tracking-widest">Kilocalories / Protocol Day</p>
                    </div>
                  </Card>

                  {/* Macro Breakdown */}
                  <div className="md:grid md:grid-cols-3 gap-4 md:col-span-2">
                    <MetricBox label="Basal (BMR)" value={result?.bmr || 0} unit="kcal" sub="Absolute minimum" icon={<Zap className="w-4 h-4" />} />
                    <MetricBox label="Maintenance" value={result?.tdee || 0} unit="kcal" sub="Energy balance" icon={<Waves className="w-4 h-4" />} />
                    <MetricBox label="Protein" value={result?.protein || 0} unit="g" sub="Structure & Growth" icon={<Scale className="w-4 h-4" />} color="text-blue-400" />
                    <MetricBox label="Carbohydrates" value={result?.carbs || 0} unit="g" sub="Energy Output" icon={<Zap className="w-4 h-4" />} color="text-orange-400" />
                    <MetricBox label="Lipids (Fats)" value={result?.fats || 0} unit="g" sub="Cellular Integrity" icon={<Waves className="w-4 h-4" />} color="text-yellow-400" />
                    <MetricBox label="Fiber" value={Math.round((result?.calories || 2000) / 100 * 1.5)} unit="g" sub="System Optimization" icon={<Info className="w-4 h-4" />} />
                  </div>
                </div>
              </div>

              {/* Bottom Tip */}
              <div className="lg:col-span-12 p-8 rounded-[2rem] bg-gradient-to-r from-neutral-900 to-black border border-white/5 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-white tracking-tight">AI Synergy Insight</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                    Your Calculated Intelligence Targets are now ready. Use the <strong>AI Core Analyzer</strong> at the top of this terminal to scan meals. The assistant will help you match these protocols by providing instant macro data for any input.
                  </p>
                </div>
              </div>
            </div>
          </BusinessPremiumLock>
        </div>
      </Container>
    </div>
  );
}

function MetricBox({ label, value, unit, sub, icon, color }: { label: string; value: number | string; unit: string, sub: string, icon: React.ReactNode, color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-xl bg-white/5 ${color || 'text-primary'} border border-white/10`}>
          {icon}
        </div>
        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-40">{unit}</p>
      </div>
      <p className="text-xs font-bold text-muted-foreground mb-1 group-hover:text-white transition-colors uppercase tracking-wider">{label}</p>
      <h4 className={`text-3xl font-black ${color || 'text-white'} tracking-tighter tabular-nums mb-1`}>{value}</h4>
      <p className="text-[10px] text-muted-foreground/60 font-medium">{sub}</p>
    </div>
  )
}