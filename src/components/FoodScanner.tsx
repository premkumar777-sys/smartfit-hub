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

    const analyzeImage = async () => {
        if (!image) return;

        setLoading(true);
        try {
            // 1. Get API Key from profile preferences
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data: profile } = await supabase
                .from("profiles")
                .select("preferences")
                .eq("user_id", user.id)
                .single();

            const apiKey = (profile?.preferences as any)?.gemini_api_key;

            if (!apiKey) {
                toast.error("Please add your Gemini API Key in Settings first!", {
                    description: "Go to Settings > AI Settings to add your key for free.",
                    duration: 5000
                });
                setLoading(false);
                return;
            }

            // 2. Initialize Gemini
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            // 4. Parse JSON from response
            const jsonMatch = text.match(/\{.*\}/s);
            if (!jsonMatch) throw new Error("Could not parse AI response");

            const data = JSON.parse(jsonMatch[0]);

            if (data.error) {
                toast.error(data.error);
            } else {
                setResult(data);
                toast.success("AI Analysis Complete!");
            }
        } catch (error) {
            console.error("AI Analysis Error:", error);
            toast.error("AI Analysis failed. Please check your API key.");
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
        <Card className="glass border-primary/20 overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary" />
                    AI Meal Scanner
                </CardTitle>
                <CardDescription>Snap or upload a photo of your meal for instant macro tracking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!image ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-primary/20 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                        <div className="p-4 rounded-full bg-primary/10">
                            <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium">Click to Upload</p>
                            <p className="text-sm text-muted-foreground">or drop your meal photo here</p>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/10">
                            <img src={image} alt="Meal" className="w-full h-full object-contain" />
                            {!result && !loading && (
                                <button
                                    onClick={() => setImage(null)}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {!result ? (
                            <Button
                                onClick={analyzeImage}
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        AI Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-4 h-4 mr-2" />
                                        Analyze Meal with AI
                                    </>
                                )}
                            </Button>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                                    <h4 className="font-bold text-lg mb-3 flex items-center justify-between">
                                        {result.name}
                                        <span className="text-primary text-sm font-medium">{result.calories} kcal</span>
                                    </h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        <MacroItem label="Protein" value={`${result.protein}g`} />
                                        <MacroItem label="Carbs" value={`${result.carbs}g`} />
                                        <MacroItem label="Fats" value={`${result.fats}g`} />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleConfirm} className="flex-1 bg-primary text-black hover:bg-primary/90">
                                        <Check className="w-4 h-4 mr-2" />
                                        Confirm & Log Meal
                                    </Button>
                                    <Button variant="outline" onClick={() => setResult(null)} disabled={loading}>
                                        Retry
                                    </Button>
                                </div>
                                <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                                    <Info className="w-3 h-3" />
                                    AI estimates may vary. Verify before logging.
                                </p>
                            </div>
                        )}
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
