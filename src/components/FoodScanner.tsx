import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X, Info, Sparkles, TrendingUp, Send, CheckCircle2, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface FoodScannerProps {
    onScanComplete: (data: { calories: number; protein: number; carbs: number; fats: number; name: string }) => void;
}

export function FoodScanner({ onScanComplete }: FoodScannerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ name: string; calories: number; protein: number; carbs: number; fats: number } | null>(null);
    const [quotaExceeded, setQuotaExceeded] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
        }
    }, [searchQuery]);

    const handleLogMeal = async () => {
        if (!result) return;
        setIsLogging(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Please login to log meals");
            setIsLogging(false);
            return;
        }

        try {
            const { error: logError } = await (supabase.from('activity_logs' as any).insert({
                user_id: user.id,
                activity_type: 'nutrition',
                value: Math.round(result.calories),
                created_at: new Date().toISOString()
            }));

            const { error: nutError } = await (supabase.from('nutrition_logs' as any).insert({
                user_id: user.id,
                calories: Math.round(result.calories),
                protein: Math.round(result.protein),
                carbs: Math.round(result.carbs),
                fats: Math.round(result.fats),
                meal_name: result.name,
                logged_at: new Date().toISOString()
            }));

            if (logError || nutError) throw logError || nutError;

            toast.success("Meal logged to your history! 📈");
            onScanComplete(result);
            handleDone();
        } catch (err: any) {
            console.error("Logging error:", err);
            toast.error("Failed to log meal", { description: err.message });
        } finally {
            setIsLogging(false);
        }
    };

    const analyzeText = async (query: string) => {
        if (!query.trim()) return;
        setLoading(true);
        setResult(null);

        // We use the most reliable, fast model
        const possibleModels = ["llama-3.1-8b-instant", "llama3-8b-8192"];

        try {
            let groqKey = import.meta.env.VITE_GROQ_API_KEY || "";

            if (!groqKey) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("preferences")
                        .eq("id", user.id) // Fixed user_id to id
                        .single();
                    groqKey = (profile?.preferences as any)?.groq_api_key || "";
                }
            }

            groqKey = groqKey.replace(/^["']|["']$/g, '').trim();

            if (!groqKey) {
                toast.error("AI Assistant Unavailable", { description: "Please add your Groq API key in Settings or .env" });
                setLoading(false);
                return;
            }

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${groqKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: possibleModels[0],
                    messages: [
                        {
                            role: "system",
                            content: `You are a specialized high-performance Nutrition AI. 
Analyze food descriptions (e.g. "6egggs", "150g chicken", "3 bananas") and return ONLY a JSON object with: name, calories, protein, carbs, fats.
Ensure all macro values are NUMBERS, not strings. No extra text.

RULES:
1. Automatically fix typos (e.g., "egggs" -> "eggs", "chiken" -> "chicken", "banan" -> "banana").
2. Accurately detect quantity and scale macros accordingly. For example:
   - "6 eggs" (or "6 egggs"): 6 whole eggs. One large egg = ~70 kcal, 6g protein, 5g fats, 0.5g carbs. 6 eggs = ~420 kcal, 36g protein, 30g fats, 3g carbs.
   - "1 egg": ~70 kcal, 6g protein, 5g fats, 0.5g carbs.
3. Use standard high-accuracy nutritional values for calculation:
   - Chicken Breast (100g cooked): ~165 kcal, 31g protein, 0g carbs, 3.6g fats
   - White Rice (100g cooked): ~130 kcal, 2.7g protein, 28g carbs, 0.3g fats
   - Oats (100g dry): ~389 kcal, 16.9g protein, 66.3g carbs, 6.9g fats
   - Whey Protein (1 scoop / ~30g): ~120 kcal, 24g protein, 3g carbs, 1.5g fats
   - Whole Milk (100ml): ~60 kcal, 3.2g protein, 4.8g carbs, 3.2g fats
   - Peanut Butter (1 tbsp / ~16g): ~95 kcal, 3.5g protein, 3g carbs, 8g fats
4. The output must be EXACTLY in this JSON format:
{
  "name": "6 Whole Eggs",
  "calories": 420,
  "protein": 36,
  "carbs": 3,
  "fats": 30
}`
                        },
                        {
                            role: "user",
                            content: `Analyze: ${query}`
                        }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);

            const data = await response.json();
            const resultData = JSON.parse(data.choices[0].message.content);

            if (resultData.error) {
                toast.error(resultData.error);
            } else {
                setResult({
                    name: resultData.name,
                    calories: Math.round(Number(resultData.calories) || 0),
                    protein: Math.round(Number(resultData.protein) || 0),
                    carbs: Math.round(Number(resultData.carbs) || 0),
                    fats: Math.round(Number(resultData.fats) || 0),
                });
                toast.success("Nutrition facts retrieved! 🍎");
            }
        } catch (error: any) {
            console.error("AI Assistant Error:", error);
            const isQuota = error.message?.toLowerCase().includes("quota") || error.message?.includes("429");
            if (isQuota) setQuotaExceeded(true);
            toast.error("Assistant failed", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDone = () => {
        setResult(null);
        setSearchQuery("");
    };

    return (
        <Card className="glass border-white/10 bg-black/40 overflow-hidden shadow-2xl relative w-full backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_0_30px_rgba(var(--primary),0.1)] hover:border-primary/30 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
            
            <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center gap-3 mb-1">
                    <motion.div 
                        initial={{ rotate: -10 }}
                        animate={{ rotate: 10 }}
                        transition={{ repeat: Infinity, duration: 2, repeatType: "reverse", ease: "easeInOut" }}
                        className="p-2.5 rounded-xl bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                    >
                        <Sparkles className="w-5 h-5 text-primary" />
                    </motion.div>
                    <div>
                        <CardTitle className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                            Food Scanner
                            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] uppercase tracking-[0.2em] font-black border border-primary/30">AI Lens</span>
                        </CardTitle>
                        <CardDescription className="text-white/50 text-xs">
                            Type what you ate and let AI decode the nutrients instantly.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4 relative z-10">
                <AnimatePresence mode="wait">
                    {!result ? (
                        <motion.div 
                            key="input"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            {quotaExceeded && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 overflow-hidden"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-full bg-amber-500/20">
                                            <Info className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-amber-500 mb-1">AI limit reached</p>
                                            <p className="text-xs text-white/50 mb-3 leading-relaxed">
                                                Please add your own Groq API key in the settings, or wait a moment.
                                            </p>
                                        </div>
                                        <button onClick={() => setQuotaExceeded(false)} className="text-white/40 hover:text-white transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            <div className="relative group/input">
                                <textarea
                                    ref={textareaRef}
                                    placeholder="e.g., '150g grilled chicken, half an avocado, and a cup of quinoa'"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            analyzeText(searchQuery);
                                        }
                                    }}
                                    className="w-full min-h-[60px] max-h-[120px] bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/30 resize-none transition-all hover:border-white/20 text-white font-medium"
                                />
                                
                                {loading ? (
                                    <div className="absolute right-3 top-4">
                                        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                            <motion.div 
                                                className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary"
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => analyzeText(searchQuery)}
                                        disabled={!searchQuery.trim()}
                                        className="absolute right-3 top-4 w-8 h-8 rounded-full flex items-center justify-center bg-primary text-black transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                                    >
                                        <Send className="w-3 h-3 ml-0.5" />
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-white/30 font-black pl-1">
                                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500/50" /> Fast</span>
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500/50" /> Accurate</span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="result"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="space-y-4"
                        >
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 relative overflow-hidden backdrop-blur-md">
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/20 blur-2xl rounded-full" />
                                
                                <h4 className="font-black text-xl mb-6 flex items-start justify-between text-white drop-shadow-md">
                                    <span className="truncate pr-4 flex-1 leading-tight">{result.name}</span>
                                    <div className="flex flex-col items-end text-right">
                                        <span className="text-primary tracking-tighter text-3xl leading-none shadow-primary/20 drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]">{result.calories}</span>
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">kcal</span>
                                    </div>
                                </h4>
                                
                                <div className="grid grid-cols-3 gap-3">
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                        <MacroChip label="Protein" value={result.protein} color="blue" />
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                        <MacroChip label="Carbs" value={result.carbs} color="orange" />
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                        <MacroChip label="Fats" value={result.fats} color="yellow" />
                                    </motion.div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleLogMeal}
                                    disabled={isLogging}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-tighter h-12 rounded-xl transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-[1.02] active:scale-95"
                                >
                                    {isLogging ? <Loader2 className="w-5 h-5 animate-spin" /> : <><TrendingUp className="w-5 h-5 mr-2" /> Log to Dashboard</>}
                                </Button>
                                <Button 
                                    onClick={handleDone} 
                                    variant="outline" 
                                    className="w-14 h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-all rounded-xl"
                                >
                                    <X className="w-5 h-5 text-white/50" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

function MacroChip({ label, value, color }: { label: string; value: number; color: "blue" | "orange" | "yellow" }) {
    const colorStyles = {
        blue: "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
        orange: "bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]",
        yellow: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.1)]"
    };

    return (
        <div className={`p-3 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden group ${colorStyles[color]}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            <span className="text-[9px] uppercase tracking-[0.2em] opacity-70 mb-1 z-10 font-black">{label}</span>
            <span className="text-lg font-black tracking-tighter z-10">{value}<span className="text-xs opacity-60 font-medium">g</span></span>
        </div>
    );
}
