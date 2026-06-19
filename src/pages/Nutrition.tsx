import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  TrendingUp,
  Info,
  Scale,
  Ruler,
  User,
  Target,
  Zap,
  Waves,
  Sparkles,
  Activity as ActivityIcon,
  TrendingDown,
  History,
  Utensils,
  Calendar,
  Coffee,
  Sun,
  Moon,
  Apple,
  Droplet,
  Award,
  Plus,
  Trash2,
  Brain,
  CheckCircle2,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
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

interface Meal {
  id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  slot: "Breakfast" | "Lunch" | "Dinner" | "Snacks";
  loggedAt: string;
}

export default function Nutrition() {
  const navigate = useNavigate();
  
  // Biological configuration states
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("recomp");
  const [dietaryPreference, setDietaryPreference] = useState<"veg" | "non-veg" | "mixed">("mixed");
  
  // Operation states
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [mealPlan, setMealPlan] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayStep, setOverlayStep] = useState(0);
  const [nutritionHistory, setNutritionHistory] = useState<any[]>([]);
  const [hydrationHistory, setHydrationHistory] = useState<any[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const [protocolActivated, setProtocolActivated] = useState(false);
  
  // Custom slots logging states
  const [showScanner, setShowScanner] = useState(false);
  const [selectedMealSlot, setSelectedMealSlot] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snacks" | null>(null);
  const [showManualLog, setShowManualLog] = useState(false);
  const [manualMealName, setManualMealName] = useState("");
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFats, setManualFats] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Load Profile targets
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

        // Fetch last 30 days of nutrition logs
        const { data: logs } = await supabase
          .from('nutrition_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('logged_at', { ascending: true })
          .limit(100);

        if (logs) {
          setNutritionHistory(logs.map(l => ({
            ...l,
            date: new Date(l.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          })));
        }

        // Fetch hydration activity logs
        const { data: hLogs } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('activity_type', 'hydration')
          .order('created_at', { ascending: true });

        if (hLogs) {
          setHydrationHistory(hLogs);
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

  // Compute baseline metabolic targets dynamically
  const targetMacros = useMemo(() => {
    const w = parseFloat(weight || "75");
    const h = parseFloat(height || "175");
    const a = parseFloat(age || "28");

    const bmr = 10 * w + 6.25 * h - 5 * a + 5;
    const tdee = Math.round(bmr * activityMap[activity]);
    const goalAdjust = goalMap[goal];
    const calories = tdee + goalAdjust.calories;

    const protein = Math.round(goalAdjust.protein * w);
    const fats = Math.round(goalAdjust.fats * w);
    const carbs = Math.max(0, Math.round((calories - protein * 4 - fats * 9) / 4));

    return { bmr: Math.round(bmr), tdee: Math.round(tdee), calories, protein, fats, carbs };
  }, [age, weight, height, activity, goal]);

  // Today's Date String for filtering
  const todayStr = useMemo(() => new Date().toDateString(), []);

  // Filter Today's Meals and Totals
  const todayMeals = useMemo<Meal[]>(() => {
    return nutritionHistory
      .filter(log => new Date(log.logged_at).toDateString() === todayStr)
      .map(log => {
        // Classify meal into slot if meal_name prefixes with "Breakfast:", "Lunch:", "Dinner:", "Snacks:"
        let slot: "Breakfast" | "Lunch" | "Dinner" | "Snacks" = "Snacks";
        let cleanName = log.meal_name || "Uncategorized Meal";
        
        if (cleanName.startsWith("Breakfast:")) {
          slot = "Breakfast";
          cleanName = cleanName.replace("Breakfast:", "").trim();
        } else if (cleanName.startsWith("Lunch:")) {
          slot = "Lunch";
          cleanName = cleanName.replace("Lunch:", "").trim();
        } else if (cleanName.startsWith("Dinner:")) {
          slot = "Dinner";
          cleanName = cleanName.replace("Dinner:", "").trim();
        } else if (cleanName.startsWith("Snacks:")) {
          slot = "Snacks";
          cleanName = cleanName.replace("Snacks:", "").trim();
        } else {
          // Time based classification
          const hour = new Date(log.logged_at).getHours();
          if (hour >= 5 && hour < 11) slot = "Breakfast";
          else if (hour >= 11 && hour < 16) slot = "Lunch";
          else if (hour >= 16 && hour < 19) slot = "Snacks";
          else slot = "Dinner";
        }

        return {
          id: log.id,
          name: cleanName,
          calories: log.calories || 0,
          protein: log.protein || 0,
          carbs: log.carbs || 0,
          fats: log.fats || 0,
          slot,
          loggedAt: log.logged_at
        };
      });
  }, [nutritionHistory, todayStr]);

  const todayNutritionTotals = useMemo(() => {
    return todayMeals.reduce(
      (acc, meal) => {
        acc.calories += meal.calories;
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fats += meal.fats;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [todayMeals]);

  // Today's Hydration Total
  const todayWaterVolume = useMemo(() => {
    return hydrationHistory
      .filter(log => new Date(log.created_at).toDateString() === todayStr)
      .reduce((sum, log) => sum + (log.value || 0), 0);
  }, [hydrationHistory, todayStr]);

  const targetWater = 3000; // 3.0 Liters default target

  // Nutrition Score calculations
  const scores = useMemo(() => {
    const calorieDiff = Math.abs(todayNutritionTotals.calories - targetMacros.calories);
    const calAdherence = Math.max(0, 100 - Math.round((calorieDiff / targetMacros.calories) * 100));
    
    const protTarget = targetMacros.protein;
    const protAdherence = Math.min(100, Math.round((todayNutritionTotals.protein / protTarget) * 100));

    const waterAdherence = Math.min(100, Math.round((todayWaterVolume / targetWater) * 100));

    // Simulated micronutrient score based on meal variety and macro completion
    let microScore = 60;
    if (todayMeals.length >= 2) microScore += 15;
    if (todayMeals.length >= 4) microScore += 15;
    if (waterAdherence > 50) microScore += 10;
    microScore = Math.min(100, microScore);

    const overallScore = Math.round((calAdherence * 0.35) + (protAdherence * 0.35) + (waterAdherence * 0.15) + (microScore * 0.15));

    return {
      overall: todayMeals.length > 0 || todayWaterVolume > 0 ? overallScore : 0,
      calorieAdherence: calAdherence,
      proteinQuality: protAdherence,
      hydrationQuality: waterAdherence,
      micronutrientScore: microScore
    };
  }, [todayNutritionTotals, targetMacros, todayWaterVolume, todayMeals]);

  // AI Coach recommendations
  const aiCoachInsight = useMemo(() => {
    if (todayMeals.length === 0 && todayWaterVolume === 0) {
      return {
        title: "Calibrating Coach Protocol",
        suggestion: "Awaiting logs. Log your breakfast or scan a meal to activate smart diagnostics.",
        status: "pending"
      };
    }
    
    if (todayNutritionTotals.calories === 0) {
      return {
        title: "Metabolic Baseline Pending",
        suggestion: "Your metabolic engine is cold. Add protein and complex carbs to hit your target.",
        status: "warning"
      };
    }

    const protRatio = todayNutritionTotals.protein / targetMacros.protein;
    if (protRatio < 0.5) {
      return {
        title: "Protein Deficit Warning",
        suggestion: `Your protein intake is at ${todayNutritionTotals.protein}g vs the ${targetMacros.protein}g target. Add chicken, tofu, or whey to support muscle recovery.`,
        status: "danger"
      };
    }

    if (todayWaterVolume < 1500) {
      return {
        title: "Hydration Status Critical",
        suggestion: `Water consumption is currently at ${(todayWaterVolume/1000).toFixed(1)}L. Drink another 1.5L to maximize nutrient transportation and cognitive capacity.`,
        status: "warning"
      };
    }

    return {
      title: "Fuel Synchronization Complete",
      suggestion: `Calorie and macro ratios are perfectly aligned for your ${goalMap[goal].label} protocol. Maintain this cadence.`,
      status: "optimal"
    };
  }, [todayMeals, todayWaterVolume, todayNutritionTotals, targetMacros, goal]);

  // Log intake from the Food Scanner completion
  const handleScanComplete = (data: { calories: number; protein: number; carbs: number; fats: number; name: string }) => {
    // Save to history state immediately
    const newLog = {
      id: Math.random().toString(),
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fats: data.fats,
      meal_name: selectedMealSlot ? `${selectedMealSlot}: ${data.name}` : data.name,
      logged_at: new Date().toISOString()
    };
    
    setNutritionHistory(prev => [...prev, newLog]);
    setShowScanner(false);
    setSelectedMealSlot(null);
  };

  // Add water log
  const handleLogWater = async (amountMl: number) => {
    setIsHydrating(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const localLog = {
      id: Math.random().toString(),
      user_id: user?.id || "local",
      activity_type: 'hydration',
      value: amountMl,
      created_at: new Date().toISOString()
    };

    setHydrationHistory(prev => [...prev, localLog]);

    if (user) {
      try {
        await supabase
          .from('activity_logs' as any)
          .insert({
            user_id: user.id,
            activity_type: 'hydration',
            value: amountMl,
            created_at: new Date().toISOString()
          });
        toast.success(`Logged +${amountMl}ml of pure hydration! 💧`);
      } catch (err) {
        console.error("Hydration logging error:", err);
      }
    } else {
      toast.success(`Logged +${amountMl}ml locally! 💧`);
    }
    setIsHydrating(false);
  };

  // Reset Hydration
  const handleResetWater = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Reset locally
    setHydrationHistory(prev => prev.filter(log => new Date(log.created_at).toDateString() !== todayStr));

    if (user) {
      try {
        // For simplicity delete all hydration logs for today or log reset. Let's just reset the state
        toast.success("Hydration reset for today.");
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Log manual meal entry
  const handleManualLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMealName.trim() || !manualCalories) {
      toast.error("Please enter a name and calories.");
      return;
    }

    setIsLogging(true);
    const { data: { user } } = await supabase.auth.getUser();
    const caloriesNum = Math.round(parseFloat(manualCalories));
    const proteinNum = Math.round(parseFloat(manualProtein || "0"));
    const carbsNum = Math.round(parseFloat(manualCarbs || "0"));
    const fatsNum = Math.round(parseFloat(manualFats || "0"));

    const mealLabel = selectedMealSlot ? `${selectedMealSlot}: ${manualMealName}` : manualMealName;

    const localLog = {
      id: Math.random().toString(),
      calories: caloriesNum,
      protein: proteinNum,
      carbs: carbsNum,
      fats: fatsNum,
      meal_name: mealLabel,
      logged_at: new Date().toISOString()
    };

    setNutritionHistory(prev => [...prev, localLog]);

    if (user) {
      try {
        await supabase
          .from('nutrition_logs' as any)
          .insert({
            user_id: user.id,
            calories: caloriesNum,
            protein: proteinNum,
            carbs: carbsNum,
            fats: fatsNum,
            meal_name: mealLabel,
            logged_at: new Date().toISOString()
          });
        
        await supabase
          .from('activity_logs' as any)
          .insert({
            user_id: user.id,
            activity_type: 'nutrition',
            value: caloriesNum,
            created_at: new Date().toISOString()
          });

        toast.success(`Logged "${manualMealName}" successfully!`);
      } catch (err) {
        console.error("Manual log error:", err);
        toast.error("Could not sync log to database.");
      }
    } else {
      toast.success(`Logged "${manualMealName}" locally!`);
    }

    setIsLogging(false);
    setShowManualLog(false);
    setManualMealName("");
    setManualCalories("");
    setManualProtein("");
    setManualCarbs("");
    setManualFats("");
    setSelectedMealSlot(null);
  };

  // Delete a logged meal
  const handleDeleteMeal = async (id?: string) => {
    if (!id) return;
    
    // Remove locally
    setNutritionHistory(prev => prev.filter(log => log.id !== id));

    const { data: { user } } = await supabase.auth.getUser();
    if (user && !id.includes(".")) { // local ids generated with Math.random have a dot
      try {
        await supabase
          .from('nutrition_logs')
          .delete()
          .eq('id', id);
        toast.success("Meal removed.");
      } catch (err) {
        console.error("Error deleting meal:", err);
      }
    } else {
      toast.success("Meal removed.");
    }
  };

  // Sync profile targets
  const handleUpdatePlan = async () => {
    if (!targetMacros) return;
    setIsUpdating(true);

    setShowOverlay(true);
    setOverlayStep(0);

    for (let i = 0; i < 3; i++) {
      setOverlayStep(i);
      await new Promise(r => setTimeout(r, 1200));
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
            daily_calories_target: targetMacros.calories,
            fitness_goal: goalMap[goal].label,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (error) throw error;
      } catch (err: any) {
        console.error("Error syncing nutrition targets:", err);
      }
    }

    localStorage.setItem(storageKey, JSON.stringify({ age, weight, height, activity, goal, dietaryPreference }));
    setProtocolActivated(true);
    setShowOverlay(false);
    setIsUpdating(false);
    toast.success("Biological profile synchronized!");
  };

  // Calorie Ring Calculations
  const radius = 85;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progressRatio = targetMacros.calories > 0 ? Math.min(1, todayNutritionTotals.calories / targetMacros.calories) : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Meal slot check helper
  const getSlotDetails = (slotName: "Breakfast" | "Lunch" | "Dinner" | "Snacks") => {
    const meals = todayMeals.filter(m => m.slot === slotName);
    const cals = meals.reduce((sum, m) => sum + m.calories, 0);
    const prot = meals.reduce((sum, m) => sum + m.protein, 0);
    const completed = meals.length > 0;
    return { meals, cals, prot, completed };
  };

  return (
    <div className="min-h-screen pt-4 pb-28 lg:pt-8 relative overflow-hidden bg-black selection:bg-primary/30">
      
      {/* Immersive Dark Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,136,0.08)_0%,rgba(0,0,0,0)_70%)]" />
        <div className="absolute top-[20%] -left-[10%] w-[350px] h-[350px] bg-[#00FF88]/5 rounded-full blur-[100px] opacity-70" />
        <div className="absolute bottom-[20%] -right-[10%] w-[450px] h-[450px] bg-blue-500/5 rounded-full blur-[130px] opacity-50" />
      </div>

      <Container className="relative z-10 max-w-5xl px-4 sm:px-6">
        
        {/* Navigation Return */}
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 text-xs font-bold text-white/40 hover:text-[#00FF88] mb-6 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Return to Hub
        </button>

        {/* SECTION 1: HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border border-white/5 bg-[#111111]/40 backdrop-blur-xl p-6 rounded-[24px] shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#00FF88] to-emerald-500 opacity-20 blur-md" />
              <div className="relative w-12 h-12 bg-black border border-[#00FF88]/30 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-[#00FF88]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#00FF88] bg-[#00FF88]/10 px-2 py-0.5 rounded border border-[#00FF88]/20">SmartFit AI</span>
                <span className="text-[10px] uppercase font-bold text-white/40">Premium Client</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">Nutrition Dashboard</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex flex-col min-w-[90px]">
              <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Current Directive</span>
              <span className="text-xs font-extrabold text-[#00FF88] mt-0.5 capitalize">{goalMap[goal].label.split(" (")[0]}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex flex-col min-w-[90px]">
              <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Daily Fuel Target</span>
              <span className="text-xs font-extrabold text-white mt-0.5">{targetMacros.calories} kcal</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex flex-col min-w-[90px]">
              <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Daily Adherence</span>
              <span className="text-xs font-extrabold text-white mt-0.5">{Math.round(progressRatio * 100)}%</span>
            </div>
          </div>
        </div>

        {/* MAIN SaaS DASHBOARD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* SECTION 2: CALORIES OVERVIEW & SECTION 3: MACRONUTRIENTS */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-12 gap-6">
            
            {/* CALORIES OVERVIEW CARD */}
            <div className="sm:col-span-5 bg-[#111111]/40 border border-white/10 backdrop-blur-xl rounded-[24px] p-6 shadow-xl flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00FF88]/5 rounded-full blur-2xl pointer-events-none" />
              
              <h3 className="text-xs font-black uppercase tracking-wider text-white/40 mb-4 self-start">Calories Intake</h3>
              
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r={normalizedRadius}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={stroke}
                    fill="none"
                  />
                  <motion.circle
                    cx="88"
                    cy="88"
                    r={normalizedRadius}
                    stroke="#00FF88"
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: strokeDashoffset }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    strokeLinecap="round"
                    style={{
                      filter: "drop-shadow(0 0 8px rgba(0, 255, 136, 0.4))"
                    }}
                  />
                </svg>
                
                {/* Inner Text */}
                <div className="text-center z-10 flex flex-col items-center">
                  <span className="text-3xl font-black text-white tracking-tighter tabular-nums">
                    {Math.max(0, targetMacros.calories - todayNutritionTotals.calories)}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest mt-1">kcal left</span>
                  <span className="text-[9px] text-[#00FF88] font-semibold bg-[#00FF88]/10 px-2 py-0.5 rounded-full mt-2">
                    {todayNutritionTotals.calories} consumed
                  </span>
                </div>
              </div>

              <div className="w-full flex items-center justify-between border-t border-white/5 mt-6 pt-4 text-center">
                <div>
                  <p className="text-xs text-white/40 font-bold">Consumed</p>
                  <p className="text-sm font-extrabold text-white mt-0.5">{todayNutritionTotals.calories} kcal</p>
                </div>
                <div className="h-6 w-px bg-white/5" />
                <div>
                  <p className="text-xs text-white/40 font-bold">Target</p>
                  <p className="text-sm font-extrabold text-white mt-0.5">{targetMacros.calories} kcal</p>
                </div>
              </div>
            </div>

            {/* MACRONUTRIENTS CARD */}
            <div className="sm:col-span-7 bg-[#111111]/40 border border-white/10 backdrop-blur-xl rounded-[24px] p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white/40 mb-5">Macronutrients</h3>
                
                <div className="space-y-5">
                  {/* Protein */}
                  <MacroProgressRow
                    label="Protein"
                    color="from-blue-500 to-indigo-500"
                    glowColor="rgba(59, 130, 246, 0.4)"
                    consumed={todayNutritionTotals.protein}
                    target={targetMacros.protein}
                  />
                  {/* Carbs */}
                  <MacroProgressRow
                    label="Carbs"
                    color="from-[#00FF88] to-emerald-500"
                    glowColor="rgba(0, 255, 136, 0.4)"
                    consumed={todayNutritionTotals.carbs}
                    target={targetMacros.carbs}
                  />
                  {/* Fats */}
                  <MacroProgressRow
                    label="Fats"
                    color="from-amber-500 to-orange-500"
                    glowColor="rgba(245, 158, 11, 0.4)"
                    consumed={todayNutritionTotals.fats}
                    target={targetMacros.fats}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-white/5 mt-6 pt-4 text-center">
                <div>
                  <span className="text-[10px] text-white/40 font-bold">Protein</span>
                  <p className="text-xs font-bold text-blue-400 mt-0.5">{targetMacros.protein}g target</p>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 font-bold">Carbs</span>
                  <p className="text-xs font-bold text-[#00FF88] mt-0.5">{targetMacros.carbs}g target</p>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 font-bold">Fats</span>
                  <p className="text-xs font-bold text-amber-500 mt-0.5">{targetMacros.fats}g target</p>
                </div>
              </div>
            </div>

          </div>

          {/* SECTION 7: NUTRITION SCORE */}
          <div className="md:col-span-4 bg-[#111111]/40 border border-white/10 backdrop-blur-xl rounded-[24px] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white/40 mb-4">Mastery Nutrition Score</h3>
              
              <div className="flex items-center gap-5 my-4">
                <div className="relative w-20 h-20 bg-black/40 border border-white/5 rounded-full flex items-center justify-center shadow-inner">
                  <div className="absolute inset-2 bg-gradient-to-tr from-[#00FF88]/10 to-indigo-500/10 rounded-full animate-pulse" />
                  <span className="text-2xl font-black text-white relative z-10">{scores.overall}</span>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-white">Daily BioScore</p>
                  <p className="text-[10px] text-white/40 font-medium leading-relaxed mt-0.5">Aggregated calorie accuracy, protein delivery, and cellular hydration efficiency.</p>
                </div>
              </div>

              <div className="space-y-3.5 mt-5">
                <ScoreBreakdownRow label="Calorie Target Adherence" value={scores.calorieAdherence} color="bg-emerald-500" />
                <ScoreBreakdownRow label="Protein Quality Ratio" value={scores.proteinQuality} color="bg-blue-500" />
                <ScoreBreakdownRow label="Hydration Target Status" value={scores.hydrationQuality} color="bg-cyan-500" />
                <ScoreBreakdownRow label="Micronutrient Completeness" value={scores.micronutrientScore} color="bg-purple-500" />
              </div>
            </div>

            <p className="text-[9px] uppercase tracking-wider text-white/30 font-bold mt-6 border-t border-white/5 pt-3 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#00FF88]" /> Calculated in real-time
            </p>
          </div>

          {/* SECTION 4: TODAY'S MEALS */}
          <div className="md:col-span-12">
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-[#00FF88]" />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Today's Protocol Meals</h3>
              </div>
              <Button
                onClick={() => {
                  setSelectedMealSlot(null);
                  setShowScanner(true);
                }}
                className="bg-[#00FF88] hover:bg-[#00FF88]/90 text-black font-extrabold text-xs h-8 px-3 rounded-xl transition-all shadow-md shadow-[#00FF88]/10 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> AI Food Scanner
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* BREAKFAST */}
              <MealSlotCard
                title="Breakfast"
                icon={<Coffee className="w-4 h-4 text-blue-400" />}
                details={getSlotDetails("Breakfast")}
                onAdd={() => {
                  setSelectedMealSlot("Breakfast");
                  setShowScanner(true);
                }}
                onManual={() => {
                  setSelectedMealSlot("Breakfast");
                  setShowManualLog(true);
                }}
                onDelete={handleDeleteMeal}
              />
              {/* LUNCH */}
              <MealSlotCard
                title="Lunch"
                icon={<Sun className="w-4 h-4 text-yellow-500" />}
                details={getSlotDetails("Lunch")}
                onAdd={() => {
                  setSelectedMealSlot("Lunch");
                  setShowScanner(true);
                }}
                onManual={() => {
                  setSelectedMealSlot("Lunch");
                  setShowManualLog(true);
                }}
                onDelete={handleDeleteMeal}
              />
              {/* SNACKS */}
              <MealSlotCard
                title="Snacks"
                icon={<Apple className="w-4 h-4 text-amber-500" />}
                details={getSlotDetails("Snacks")}
                onAdd={() => {
                  setSelectedMealSlot("Snacks");
                  setShowScanner(true);
                }}
                onManual={() => {
                  setSelectedMealSlot("Snacks");
                  setShowManualLog(true);
                }}
                onDelete={handleDeleteMeal}
              />
              {/* DINNER */}
              <MealSlotCard
                title="Dinner"
                icon={<Moon className="w-4 h-4 text-indigo-400" />}
                details={getSlotDetails("Dinner")}
                onAdd={() => {
                  setSelectedMealSlot("Dinner");
                  setShowScanner(true);
                }}
                onManual={() => {
                  setSelectedMealSlot("Dinner");
                  setShowManualLog(true);
                }}
                onDelete={handleDeleteMeal}
              />
            </div>
          </div>

          {/* SECTION 5: HYDRATION & SECTION 6: AI COACH INSIGHTS */}
          <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6 mt-2">
            
            {/* HYDRATION TRACKER */}
            <div className="md:col-span-6 bg-[#111111]/40 border border-white/10 backdrop-blur-xl rounded-[24px] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-cyan-400" /> Hydration Tracker
                  </h3>
                  <button onClick={handleResetWater} className="text-[10px] font-bold text-white/30 hover:text-white transition-colors">
                    Reset Log
                  </button>
                </div>

                <div className="flex items-center gap-6 my-4">
                  {/* Animated Wave Hydration Glass */}
                  <div className="relative w-16 h-28 bg-[#151515] border border-white/10 rounded-2xl overflow-hidden shadow-inner flex flex-col justify-end">
                    <motion.div
                      className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cyan-600 to-cyan-400"
                      initial={{ height: "0%" }}
                      animate={{ height: `${Math.min(100, (todayWaterVolume / targetWater) * 100)}%` }}
                      transition={{ type: "spring", stiffness: 60, damping: 15 }}
                    >
                      {/* Sub-wave overlay */}
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </motion.div>
                    <div className="relative z-10 w-full text-center pb-2">
                      <span className="text-[10px] font-black text-white/80 drop-shadow">
                        {Math.round((todayWaterVolume / targetWater) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    <p className="text-2xl font-black text-white tracking-tight">
                      {(todayWaterVolume / 1000).toFixed(2)} <span className="text-xs text-white/40">Liters</span>
                    </p>
                    <p className="text-xs text-white/40 font-semibold">
                      Target: {(targetWater / 1000).toFixed(1)}L Daily
                    </p>
                    
                    {/* Add Buttons */}
                    <div className="flex gap-2 pt-3">
                      <Button
                        onClick={() => handleLogWater(250)}
                        disabled={isHydrating}
                        className="bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] uppercase h-8 rounded-xl flex-1 border border-white/5"
                      >
                        +250ml
                      </Button>
                      <Button
                        onClick={() => handleLogWater(500)}
                        disabled={isHydrating}
                        className="bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] uppercase h-8 rounded-xl flex-1 border border-white/5"
                      >
                        +500ml
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-white/40 mt-4 border-t border-white/5 pt-3">
                Liquid intake improves energy conversion and recovery speeds.
              </div>
            </div>

            {/* AI COACH INSIGHTS */}
            <div className="md:col-span-6 bg-[#111111]/40 border border-[#00FF88]/20 backdrop-blur-xl rounded-[24px] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              {/* Glow lines */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00FF88]/40 to-transparent" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF88]/5 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1 rounded-lg bg-[#00FF88]/10 border border-[#00FF88]/20">
                    <Brain className="w-4 h-4 text-[#00FF88] animate-pulse" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#00FF88]">AI Coach Intelligence</h3>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {aiCoachInsight.title}
                    {aiCoachInsight.status === 'optimal' && <CheckCircle2 className="w-4 h-4 text-[#00FF88]" />}
                  </h4>
                  <p className="text-xs text-white/60 leading-relaxed font-medium">
                    "{aiCoachInsight.suggestion}"
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 mt-6 pt-4">
                <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">
                  Adaptive AI Assistant v2.0
                </span>
                <Button
                  onClick={() => navigate("/ai-trainer")}
                  className="bg-white/5 hover:bg-white/10 text-white font-extrabold text-[10px] uppercase h-8 px-4 rounded-xl border border-white/5 flex items-center gap-1 transition-all"
                >
                  Ask AI Coach <ChevronRight className="w-3.5 h-3.5 text-[#00FF88]" />
                </Button>
              </div>
            </div>

          </div>

          {/* HISTORICAL CHARTS */}
          <div className="md:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
            
            {/* Metabolic Analytics */}
            <div className="lg:col-span-8">
              <Card className="bg-[#111111]/40 border border-white/10 backdrop-blur-xl rounded-[24px] overflow-hidden h-full shadow-xl">
                <div className="p-6 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#00FF88]" /> Metabolic History (30 Days)
                  </h3>
                </div>
                <CardContent className="p-6">
                  {nutritionHistory.length > 0 ? (
                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={nutritionHistory}>
                          <defs>
                            <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00FF88" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#00FF88" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#111111',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '16px',
                              fontSize: '11px',
                              color: '#fff'
                            }}
                          />
                          <Area type="monotone" dataKey="calories" stroke="#00FF88" fill="url(#colorCal)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[220px] flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                      <Calendar className="w-8 h-8 text-white/10" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white/50">Awaiting Log Streams</p>
                        <p className="text-[9px] text-white/30 uppercase tracking-widest">Log meals to trace calorie fluctuations</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Scans Tray */}
            <div className="lg:col-span-4">
              <Card className="bg-[#111111]/40 border border-white/10 backdrop-blur-xl rounded-[24px] overflow-hidden h-full flex flex-col shadow-xl">
                <div className="p-6 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-[#00FF88]" /> Recent Intake Logs
                  </h3>
                </div>
                <CardContent className="flex-1 overflow-y-auto max-h-[260px] space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent p-6 pt-2">
                  {todayMeals.length > 0 ? (
                    [...todayMeals].reverse().map((meal, i) => (
                      <div key={meal.id || i} className="p-3.5 rounded-2xl bg-black/30 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group">
                        <div>
                          <p className="text-xs font-bold text-white max-w-[150px] truncate">{meal.name}</p>
                          <div className="flex gap-2.5 mt-1.5">
                            <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">P:{meal.protein}g</span>
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">C:{meal.carbs}g</span>
                            <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">F:{meal.fats}g</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-black text-[#00FF88]">{meal.calories} kcal</p>
                          <button
                            onClick={() => handleDeleteMeal(meal.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-10 text-center text-white/30 text-xs">
                      No meals logged yet today.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>

          {/* SECTION 8: METABOLIC CALIBRATION CONSOLE */}
          <div className="md:col-span-12 mt-4">
            <Card className="bg-[#111111]/30 border border-white/10 rounded-[24px] overflow-hidden relative shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00FF88]/5 via-transparent to-transparent pointer-events-none" />
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <User className="w-5 h-5 text-[#00FF88]" /> Metabolic Calibration Console
                </h3>
                <p className="text-xs text-white/40 font-semibold mt-1">Configure your biological blueprint for dynamic target adjustments.</p>
              </div>
              
              <CardContent className="p-6 grid md:grid-cols-2 gap-8">
                {/* Profile Fields */}
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Age (yrs)</Label>
                      <Input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="bg-white/5 border-white/10 text-white font-bold h-10 rounded-xl focus-visible:ring-[#00FF88]/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Weight (kg)</Label>
                      <Input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="bg-white/5 border-white/10 text-white font-bold h-10 rounded-xl focus-visible:ring-[#00FF88]/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Height (cm)</Label>
                      <Input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="bg-white/5 border-white/10 text-white font-bold h-10 rounded-xl focus-visible:ring-[#00FF88]/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Metabolic Activity Level</Label>
                    <div className="grid grid-cols-5 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
                      {(['sedentary', 'light', 'moderate', 'active', 'athlete'] as Activity[]).map((level, i) => (
                        <button
                          key={level}
                          onClick={() => setActivity(level)}
                          title={`${level.charAt(0).toUpperCase() + level.slice(1)} Activity`}
                          className={`h-10 rounded-lg flex flex-col items-center justify-center transition-all ${
                            activity === level
                              ? "bg-[#00FF88] text-black shadow-md shadow-[#00FF88]/20"
                              : "text-white/40 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className="text-xs font-black">{i + 1}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Goals Selection & Save */}
                <div className="flex flex-col justify-between gap-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Directive Directive</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'cut', label: 'Lipid Burn', sub: 'Cut' },
                        { id: 'recomp', label: 'Recompose', sub: 'Maintain' },
                        { id: 'bulk', label: 'Lean Mass', sub: 'Bulk' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setGoal(item.id as Goal)}
                          className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between h-18 ${
                            goal === item.id
                              ? "bg-[#00FF88]/10 border-[#00FF88] shadow-md shadow-[#00FF88]/5"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <span className={`text-[10px] font-black uppercase tracking-wider ${goal === item.id ? "text-[#00FF88]" : "text-white/40"}`}>
                            {item.label}
                          </span>
                          <span className="text-[9px] text-white/20 mt-1 font-semibold">{item.sub} directive</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleUpdatePlan}
                    disabled={isUpdating}
                    className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-extrabold uppercase tracking-widest rounded-xl text-xs"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Synchronize & Recalibrate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* SECTION 8: BRANDING FOOTER */}
        <div className="mt-16 border-t border-white/5 pt-8 text-center flex flex-col items-center gap-2">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
            Generated with <span className="text-[#00FF88] font-black">SmartFit AI</span>
          </p>
          <a
            href="https://smartfitai.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-semibold text-white/30 hover:text-[#00FF88] transition-colors"
          >
            smartfitai.in
          </a>
        </div>

      </Container>

      {/* POPUP: AI FOOD SCANNER TRAY */}
      <AnimatePresence>
        {showScanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md"
            >
              <div className="absolute -top-12 right-0 flex items-center gap-3">
                <Button
                  onClick={() => setShowManualLog(true)}
                  className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-[10px] uppercase h-8 rounded-lg"
                >
                  Manual Log
                </Button>
                <Button
                  onClick={() => {
                    setShowScanner(false);
                    setSelectedMealSlot(null);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center p-0"
                >
                  ✕
                </Button>
              </div>
              <div className="bg-[#111111] border border-white/10 rounded-3xl p-2 shadow-2xl">
                <div className="p-3 text-center border-b border-white/5">
                  <span className="text-[9px] uppercase font-black text-white/40 tracking-widest">
                    Logging for: <span className="text-[#00FF88]">{selectedMealSlot || "Active Intake"}</span>
                  </span>
                </div>
                <FoodScanner onScanComplete={handleScanComplete} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP: MANUAL LOG ENTRY */}
      <AnimatePresence>
        {showManualLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111111] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setShowManualLog(false);
                  setSelectedMealSlot(null);
                }}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                ✕
              </button>

              <h4 className="text-sm font-black uppercase tracking-wider text-white mb-6">
                Manual Meal Log - <span className="text-[#00FF88]">{selectedMealSlot || "Intake"}</span>
              </h4>

              <form onSubmit={handleManualLogMeal} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Meal Name</Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Scrambled Eggs with Toast"
                    value={manualMealName}
                    onChange={(e) => setManualMealName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white font-bold h-10 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Calories (kcal)</Label>
                    <Input
                      type="number"
                      required
                      placeholder="e.g. 350"
                      value={manualCalories}
                      onChange={(e) => setManualCalories(e.target.value)}
                      className="bg-white/5 border-white/10 text-white font-bold h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Protein (g)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 24"
                      value={manualProtein}
                      onChange={(e) => setManualProtein(e.target.value)}
                      className="bg-white/5 border-white/10 text-white font-bold h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Carbs (g)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 30"
                      value={manualCarbs}
                      onChange={(e) => setManualCarbs(e.target.value)}
                      className="bg-white/5 border-white/10 text-white font-bold h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Fats (g)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 12"
                      value={manualFats}
                      onChange={(e) => setManualFats(e.target.value)}
                      className="bg-white/5 border-white/10 text-white font-bold h-10 rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLogging}
                  className="w-full h-11 bg-[#00FF88] text-black hover:bg-[#00FF88]/90 font-extrabold uppercase tracking-wider rounded-xl text-xs mt-4"
                >
                  {isLogging ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Intake"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SYNC/MASTER OVERLAY MODAL */}
      {showOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-t from-[#00FF88]/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative text-center space-y-8 max-w-2xl px-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-[#00FF88] blur-[60px] opacity-20 animate-pulse" />
              <div className="relative bg-[#00FF88]/10 border border-[#00FF88]/30 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-12 shadow-[0_0_50px_rgba(0,255,136,0.2)]">
                <Zap className="w-12 h-12 text-[#00FF88] animate-pulse" />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                {[
                  "Initiating Metabolic Calibration...",
                  "Syncing Profile Blueprint...",
                  "Operational Directive Updated! 💎"
                ][overlayStep]}
              </h2>
              <p className="text-[#00FF88]/60 font-black uppercase tracking-[0.4em] text-xs md:text-sm">
                {[
                  "Calibrating biological variables",
                  "Aligning target macro outputs",
                  "Metabolic trajectory calibrated successfully"
                ][overlayStep]}
              </p>
            </div>

            <div className="pt-12">
              <div className="w-48 h-1 bg-white/5 mx-auto rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00FF88] transition-all duration-1000 ease-linear shadow-[0_0_15px_#00FF88]"
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

// ------------------- AUXILIARY COMPONENT MODULES -------------------

// Macro Progress row inside macros panel
function MacroProgressRow({
  label,
  color,
  glowColor,
  consumed,
  target
}: {
  label: string;
  color: string;
  glowColor: string;
  consumed: number;
  target: number;
}) {
  const percentage = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end text-xs">
        <span className="font-extrabold text-white/80">{label}</span>
        <span className="font-bold text-white/50">
          <span className="text-white font-extrabold">{consumed}g</span> / {target}g ({percentage}%)
        </span>
      </div>
      <div className="h-2 bg-white/5 border border-white/5 rounded-full overflow-hidden relative">
        <motion.div
          className={`h-full bg-gradient-to-r ${color} rounded-full`}
          initial={{ width: "0%" }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            boxShadow: `0 0 10px ${glowColor}`
          }}
        />
      </div>
    </div>
  );
}

// Score Breakdown Row component
function ScoreBreakdownRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-wider">
        <span>{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: "0%" }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// Meal Slot Card Component
function MealSlotCard({
  title,
  icon,
  details,
  onAdd,
  onManual,
  onDelete
}: {
  title: "Breakfast" | "Lunch" | "Dinner" | "Snacks";
  icon: React.ReactNode;
  details: { meals: Meal[]; cals: number; prot: number; completed: boolean };
  onAdd: () => void;
  onManual: () => void;
  onDelete: (id?: string) => void;
}) {
  return (
    <div className="bg-[#111111]/40 border border-white/10 backdrop-blur-xl rounded-[24px] p-5 shadow-xl flex flex-col justify-between min-h-[190px] relative overflow-hidden group">
      
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.01] rounded-full blur-xl" />
      
      <div>
        {/* Header Slot Title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
              {icon}
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-white">{title}</span>
          </div>
          {details.completed ? (
            <span className="text-[9px] uppercase font-black text-[#00FF88] bg-[#00FF88]/10 px-2 py-0.5 rounded-full border border-[#00FF88]/20 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> Done
            </span>
          ) : (
            <span className="text-[9px] uppercase font-bold text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
              Pending
            </span>
          )}
        </div>

        {/* Meal details list */}
        {details.completed ? (
          <div className="space-y-2 mt-2 max-h-[85px] overflow-y-auto pr-1 scrollbar-thin">
            {details.meals.map((meal) => (
              <div key={meal.id} className="text-[10px] text-white/60 leading-tight border-b border-white/5 pb-1 flex justify-between items-center group/item">
                <span className="truncate max-w-[100px]" title={meal.name}>{meal.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-extrabold text-[#00FF88]">{meal.calories} kcal</span>
                  <button
                    onClick={() => onDelete(meal.id)}
                    className="text-red-400 opacity-0 group-hover/item:opacity-100 hover:text-red-300 transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-white/30 italic mt-3 leading-relaxed">No intake logged. Calibrate your metabolic status.</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
        {details.completed ? (
          <div className="text-[10px] font-bold text-white/40">
            Total: <span className="text-white font-extrabold">{details.cals} kcal</span> • <span className="text-blue-400 font-extrabold">{details.prot}g P</span>
          </div>
        ) : (
          <div className="text-[10px] font-bold text-white/30">
            0 kcal logged
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            onClick={onManual}
            className="text-[9px] uppercase font-black text-white/40 hover:text-white bg-white/5 px-2 py-1 rounded-lg transition-all"
            title="Log calories manually"
          >
            Manual
          </button>
          <button
            onClick={onAdd}
            className="w-7 h-7 rounded-xl bg-white/5 hover:bg-[#00FF88] hover:text-black border border-white/5 text-[#00FF88] flex items-center justify-center transition-all"
            title="AI Scan"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      
    </div>
  );
}