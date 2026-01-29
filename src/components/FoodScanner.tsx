import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Camera, Upload, Check, X, Info, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FoodScannerProps {
    onScanComplete: (data: { calories: number; protein: number; carbs: number; fats: number; name: string }) => void;
}

export function FoodScanner({ onScanComplete }: FoodScannerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ name: string; calories: number; protein: number; carbs: number; fats: number } | null>(null);
    const [quotaExceeded, setQuotaExceeded] = useState(false);

    // Simplified AI key retrieval
    const getApiKey = async () => {
        const envKey = import.meta.env.VITE_GEMINI_API_KEY;
        let cleanKey = envKey || "";

        if (!cleanKey) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from("profiles").select("preferences").eq("user_id", user.id).single();
                cleanKey = (profile?.preferences as any)?.gemini_api_key || "";
            }
        }
        return cleanKey.replace(/^["']|["']$/g, '').trim();
    };

    const analyzeText = async (query: string) => {
        if (!query.trim()) return;
        setLoading(true);
        setResult(null);

        const possibleModels = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "llama3-8b-8192"];

        try {
            // Get Groq Key
            let groqKey = import.meta.env.VITE_GROQ_API_KEY || "";

            // If not in env, check profile
            if (!groqKey) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("preferences")
                        .eq("user_id", user.id)
                        .single();
                    groqKey = (profile?.preferences as any)?.groq_api_key || "";
                }
            }

            groqKey = groqKey.replace(/^["']|["']$/g, '').trim();

            if (!groqKey) {
                console.warn("SmartFit AI: No Groq key found, falling back to Gemini for text.");
                // Fallback to Gemini if no Groq key is provided
                const apiKey = await getApiKey();
                if (!apiKey) {
                    setLoading(false);
                    return;
                }
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
                const prompt = `Analyze this food description: "${query}". 
                    Identify the food and provide estimated Calories, Protein (g), Carbs (g), and Fats (g). 
                    Return ONLY a JSON object: { "name": "food name", "calories": 123, "protein": 12, "carbs": 34, "fats": 5 }.`;
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const data = JSON.parse(response.text().match(/\{.*\}/s)?.[0] || "{}");
                if (data.error) throw new Error(data.error);
                setResult(data);
                toast.success("Searched via Gemini");
                setLoading(false);
                return;
            }

            console.log("SmartFit AI: Using Groq for high-speed chat...");

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
                            content: "You are a specialized Nutrition AI. Analyze food descriptions and return ONLY a JSON object with: name, calories, protein, carbs, fats. No extra text."
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
                setResult(resultData);
                toast.success("Assistant processed your meal! 🍏");
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

    const handleConfirm = () => {
        if (result) {
            onScanComplete(result);
            setResult(null);
            setSearchQuery("");
        }
    };

    return (
        <Card className="glass border-primary/20 overflow-hidden shadow-2xl">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/20">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        Your's Nutritionist
                    </CardTitle>
                </div>
                <CardDescription>
                    Chat with your AI nutritionist to log meals instantly.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!result ? (
                    <div className="space-y-4">
                        {quotaExceeded && (
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-full bg-amber-500/20">
                                        <Info className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-amber-500 mb-1">Quota hit!</p>
                                        <p className="text-xs text-muted-foreground mb-3">
                                            The AI needs a short break. You can log calories directly below.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-8 border-amber-500/20 hover:bg-amber-500/10"
                                            onClick={() => {
                                                const manualLog = document.getElementById('manual-log-entry');
                                                if (manualLog) manualLog.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                        >
                                            Log Manually
                                        </Button>
                                    </div>
                                    <button onClick={() => setQuotaExceeded(false)} className="text-muted-foreground hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="relative">
                                <textarea
                                    placeholder="Tell me what you ate... (e.g., '3 scrambled eggs and bread')"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground resize-none transition-all hover:border-primary/20"
                                />
                                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground bg-black/60 px-2 py-1 rounded border border-white/5">
                                        Enter to log
                                    </span>
                                </div>
                            </div>
                            <Button
                                onClick={() => analyzeText(searchQuery)}
                                className="w-full py-6 bg-primary text-black font-bold text-base hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all active:scale-[0.98]"
                                disabled={loading || !searchQuery.trim()}
                            >
                                {loading ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing Nutrients...</>
                                ) : (
                                    <><Sparkles className="w-5 h-5 mr-2" /> Analyze Meal</>
                                )}
                            </Button>
                            <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground opacity-60">
                                <span>Fast</span>
                                <span>•</span>
                                <span>Free</span>
                                <span>•</span>
                                <span>Accurate</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <SparklesIcon className="w-12 h-12" />
                            </div>
                            <h4 className="font-bold text-lg mb-4 flex items-center justify-between">
                                <span className="truncate pr-4">{result.name}</span>
                                <span className="text-primary whitespace-nowrap">{result.calories} <span className="text-[10px]">kcal</span></span>
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                                <MacroItem label="Protein" value={`${result.protein}g`} />
                                <MacroItem label="Carbs" value={`${result.carbs}g`} />
                                <MacroItem label="Fats" value={`${result.fats}g`} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleConfirm} className="flex-1 bg-primary text-black font-bold hover:bg-primary/80">
                                <Check className="w-4 h-4 mr-2" />
                                Add to Journal
                            </Button>
                            <Button variant="outline" onClick={() => { setResult(null); setSearchQuery(""); }} className="border-white/10 text-white hover:bg-white/5">
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function MacroItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-black/40 p-2 rounded-lg text-center border border-white/5">
            <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
            <p className="text-sm font-bold text-white">{value}</p>
        </div>
    );
}

function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" /><path d="M3 5h4" /><path d="M21 17v4" /><path d="M19 19h4" />
        </svg>
    );
}
