import { useState, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Camera, Upload, Check, X, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FoodScannerProps {
    onScanComplete: (data: { calories: number; protein: number; carbs: number; fats: number; name: string }) => void;
}

export function FoodScanner({ onScanComplete }: FoodScannerProps) {
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"photo" | "search">("photo");
    const [searchQuery, setSearchQuery] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setResult(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const getApiKey = async () => {
        const envKey = import.meta.env.VITE_GEMINI_API_KEY;
        let key = envKey || "";

        if (!key) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from("profiles").select("preferences").eq("user_id", user.id).single();
                key = (profile?.preferences as any)?.gemini_api_key || "";
            }
        }

        const cleanKey = key.replace(/^["']|["']$/g, '').trim();
        if (!cleanKey) {
            toast.error("No API key found. Add one in .env or Settings.");
            return null;
        }
        return cleanKey;
    };

    const analyzeText = async (query: string) => {
        if (!query.trim()) return;
        setLoading(true);
        setResult(null);

        try {
            const apiKey = await getApiKey();
            if (!apiKey) return;

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `Analyze this food description: "${query}". 
            Identify the food and provide estimated Calories, Protein (g), Carbs (g), and Fats (g). 
            Return ONLY a JSON object: { "name": "food name", "calories": 123, "protein": 12, "carbs": 34, "fats": 5 }.
            If the description is not food, return { "error": "Please describe a valid meal." }.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{.*\}/s);
            if (!jsonMatch) throw new Error("Could not parse AI response");
            const data = JSON.parse(jsonMatch[0]);

            if (data.error) {
                toast.error(data.error);
            } else {
                setResult(data);
                toast.success("AI Search Success!");
            }
        } catch (error: any) {
            console.error("AI Search Error:", error);
            toast.error("AI Search failed", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const analyzeImage = async () => {
        if (!image) return;

        setLoading(true);
        let apiKey = "";
        let source = "Unknown";

        try {
            // 1. Get API Key: Priority 1: Environment Variable (Developer Provided), Priority 2: Profile Settings (User Provided)
            const envKey = import.meta.env.VITE_GEMINI_API_KEY;
            apiKey = envKey || "";
            source = "Environment (.env)";

            if (!apiKey) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("preferences")
                        .eq("user_id", user.id)
                        .single();
                    apiKey = (profile?.preferences as any)?.gemini_api_key || "";
                    source = "User Profile (Settings)";
                }
            }

            // Sanitize: Trim quotes and whitespace
            apiKey = apiKey.replace(/^["']|["']$/g, '').trim();

            if (!apiKey) {
                console.error("SmartFit AI: No API key found.");
                toast.error("AI Feature Unavailable", {
                    description: "Please add your API key in .env or Settings.",
                    duration: 5000
                });
                setLoading(false);
                return;
            }

            console.log(`SmartFit AI: Using key from ${source}. Starts with: ${apiKey.substring(0, 6)}`);

            // 2. Initialize Gemini
            const genAI = new GoogleGenerativeAI(apiKey);

            // Try possible models in order of performance
            const possibleModels = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-pro-vision"];
            let success = false;
            let lastError = null;

            // 3. Prepare image for Gemini (remove data:image/...;base64, prefix)
            const base64Data = image.split(",")[1];
            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                },
            };

            const prompt = `Analyze this food image and provide the estimated Calories, Protein (g), Carbs (g), and Fats (g). 
            Return ONLY a JSON object in this format: 
            { "name": "food name", "calories": 123, "protein": 12, "carbs": 34, "fats": 5 }. 
            If multi-food plate, give total for the plate. If no food is detected, return { "error": "No food detected" }.`;

            for (const modelName of possibleModels) {
                try {
                    console.log(`SmartFit AI: Trying model ${modelName} with key starting ${apiKey.substring(0, 4)}...`);
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent([prompt, imagePart]);
                    const response = await result.response;
                    const text = response.text();

                    // 4. Parse JSON from response
                    const jsonMatch = text.match(/\{.*\}/s);
                    if (!jsonMatch) throw new Error(`Model ${modelName} returned non-JSON: ${text.substring(0, 100)}`);

                    const data = JSON.parse(jsonMatch[0]);

                    if (data.error) {
                        console.warn(`SmartFit AI: API returned error for ${modelName}:`, data.error);
                        toast.error(data.error);
                    } else {
                        setResult(data);
                        toast.success(`Success! Analyzed with ${modelName}`);
                        success = true;
                    }
                    if (success) break;
                } catch (err: any) {
                    console.warn(`SmartFit AI: Model ${modelName} failed. Full error:`, err);
                    lastError = err;
                }
            }

            if (!success && lastError) {
                throw lastError;
            }
        } catch (error: any) {
            console.error("SmartFit AI: Final Analysis Failure:", error);

            let descriptiveError = error?.message || "Check your API key and connection.";
            const keyPreview = apiKey?.substring(0, 6) + "..." || "None";

            // Provide specific troubleshooting for 404/Not Found errors
            if (descriptiveError.includes("404") || descriptiveError.includes("not found")) {
                descriptiveError = `No compatible model found for key [${keyPreview}]. If you enabled the API, it may take 1-2 mins to activate. Otherwise, try a fresh key from AI Studio.`;
            }

            toast.error("AI Analysis failed", {
                description: descriptiveError,
                action: {
                    label: "Troubleshoot",
                    onClick: () => window.open("https://aistudio.google.com/app/apikey", "_blank")
                },
                duration: 15000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (result) {
            onScanComplete(result);
            setImage(null);
            setResult(null);
        }
    };

    return (
        <Card className="glass border-primary/20 overflow-hidden shadow-2xl">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-primary animate-pulse" />
                        Smart AI Tracker
                    </CardTitle>
                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                        <button
                            onClick={() => { setActiveTab("photo"); setResult(null); }}
                            className={`px-3 py-1 text-xs rounded-md transition-all ${activeTab === "photo" ? "bg-primary text-black font-bold" : "text-muted-foreground hover:text-white"}`}
                        >
                            Photo
                        </button>
                        <button
                            onClick={() => { setActiveTab("search"); setResult(null); }}
                            className={`px-3 py-1 text-xs rounded-md transition-all ${activeTab === "search" ? "bg-primary text-black font-bold" : "text-muted-foreground hover:text-white"}`}
                        >
                            Search
                        </button>
                    </div>
                </div>
                <CardDescription>
                    {activeTab === "photo"
                        ? "Scan your plate for instant tracking."
                        : "Describe your meal (e.g., '2 eggs with a slice of bread')."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!result ? (
                    <>
                        {activeTab === "photo" ? (
                            <div className="space-y-4">
                                {!image ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-primary/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-primary/5 transition-all cursor-pointer group"
                                    >
                                        <div className="p-4 rounded-full bg-primary/10 group-hover:scale-110 transition-transform">
                                            <Camera className="w-8 h-8 text-primary" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-medium">Snap or Upload</p>
                                            <p className="text-sm text-muted-foreground text-[10px]">Photo-to-Macros</p>
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="relative aspect-square max-h-[200px] mx-auto rounded-xl overflow-hidden bg-black/40 border border-white/10">
                                            <img src={image} alt="Meal" className="w-full h-full object-cover" />
                                            {!loading && (
                                                <button onClick={() => setImage(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <Button onClick={analyzeImage} className="w-full" disabled={loading}>
                                            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : "Scan Photo"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative">
                                    <textarea
                                        placeholder="What did you eat today?"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground resize-none"
                                    />
                                </div>
                                <Button
                                    onClick={() => analyzeText(searchQuery)}
                                    className="w-full"
                                    disabled={loading || !searchQuery.trim()}
                                >
                                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching...</> : "AI Search Macros"}
                                </Button>
                                <p className="text-[10px] text-center text-muted-foreground italic">
                                    Example: "One large bowl of oatmeal with blueberries and honey"
                                </p>
                            </div>
                        )}
                    </>
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
                            <Button variant="outline" onClick={() => { setResult(null); setImage(null); setSearchQuery(""); }} className="border-white/10 text-white hover:bg-white/5">
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
