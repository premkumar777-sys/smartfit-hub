import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X, Info, Sparkles, TrendingUp, Send, CheckCircle2, Zap, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface FoodScannerProps {
    onScanComplete: (data: { calories: number; protein: number; carbs: number; fats: number; name: string }) => void;
}

export function FoodScanner({ onScanComplete }: FoodScannerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ name: string; calories: number; protein: number; carbs: number; fats: number } | null>(null);
    const [quotaExceeded, setQuotaExceeded] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
        }
    }, [searchQuery]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error("Please select a valid image file");
            return;
        }
        
        if (file.size > 4 * 1024 * 1024) {
            toast.error("Image too large. Please select an image under 4MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

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
        if (!query.trim() && !selectedImage) return;
        setLoading(true);
        setResult(null);

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
                setLoading(false);
                return;
            }

            // Determine model and payload based on whether an image is present
            const isVision = !!selectedImage;
            const model = isVision ? "llama-3.2-11b-vision-preview" : "llama-3.1-8b-instant";
            
            let messages;
            let responseFormat;

            if (isVision) {
                messages = [
                    {
                        role: "user",
                        content: [
                            { 
                                type: "text", 
                                text: `You are a Nutrition AI. Look at this food image and make your best reasonable estimate of its macros based on the visual portion size. ${query ? `Additional context from user: "${query}". ` : ''}Return ONLY a JSON object with: "name" (string), "calories" (number), "protein" (number), "carbs" (number), "fats" (number). Ensure all macro values are NUMBERS. Do not include any markdown, explanation, or extra text outside the JSON block.` 
                            },
                            { 
                                type: "image_url", 
                                image_url: { url: selectedImage } 
                            }
                        ]
                    }
                ];
                // Vision models on Groq currently do not always support strict JSON response_format
                responseFormat = undefined;
            } else {
                messages = [
                    {
                        role: "system",
                        content: "You are a specialized Nutrition AI. Analyze food descriptions and return ONLY a JSON object with: name, calories, protein, carbs, fats. Ensure all macro values are NUMBERS. No extra text."
                    },
                    {
                        role: "user",
                        content: `Analyze: ${query}`
                    }
                ];
                responseFormat = { type: "json_object" };
            }

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${groqKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    ...(responseFormat ? { response_format: responseFormat } : {})
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Groq API Error: ${response.status} - ${errText}`);
            }

            const data = await response.json();
            const rawContent = data.choices[0].message.content;
            
            // Robust parsing to handle potential markdown wrappers (especially from vision model)
            let resultData;
            try {
                // Try direct parse first
                resultData = JSON.parse(rawContent);
            } catch (e) {
                // Fallback: extract JSON from markdown code block
                const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    resultData = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("Could not parse AI response into JSON");
                }
            }

            if (resultData.error) {
                toast.error(resultData.error);
            } else {
                setResult({
                    name: resultData.name || "Unknown Food",
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
        setSelectedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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
                            Snap a picture or type what you ate to decode nutrients.
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

                            <div className="relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:border-white/20 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                                {/* Image Preview Area */}
                                {selectedImage && (
                                    <div className="p-4 pb-0">
                                        <div className="relative inline-block group/img">
                                            <img src={selectedImage} alt="Food to analyze" className="h-24 w-24 object-cover rounded-xl border border-white/20 shadow-lg" />
                                            <button 
                                                onClick={() => {
                                                    setSelectedImage(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition-opacity shadow-md"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="relative">
                                    <textarea
                                        ref={textareaRef}
                                        placeholder="e.g., '150g grilled chicken' or attach an image..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                analyzeText(searchQuery);
                                            }
                                        }}
                                        className="w-full min-h-[60px] max-h-[120px] bg-transparent border-none p-4 pr-[88px] text-sm focus:outline-none focus:ring-0 placeholder:text-white/30 resize-none text-white font-medium"
                                    />
                                    
                                    <div className="absolute right-2 bottom-3 flex items-center gap-1">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            capture="environment"
                                            className="hidden" 
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={loading}
                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95 disabled:opacity-30"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                        
                                        {loading ? (
                                            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                                <motion.div 
                                                    className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary"
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => analyzeText(searchQuery)}
                                                disabled={(!searchQuery.trim() && !selectedImage)}
                                                className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-black transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                                            >
                                                <Send className="w-3 h-3 ml-0.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-white/30 font-black pl-1">
                                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500/50" /> Fast</span>
                                <span className="flex items-center gap-1"><Camera className="w-3 h-3 text-blue-500/50" /> Vision</span>
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
