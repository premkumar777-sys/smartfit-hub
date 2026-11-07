import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Apple,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCw,
  ScanLine,
  Sparkles,
  SwitchCamera,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/Container";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

const IMAGE_BUCKET = "nutrition-images";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const CATEGORIES = ["Breakfast", "Lunch", "Snacks", "Dinner"] as const;
type MealCategory = (typeof CATEGORIES)[number];

type FoodItem = {
  name: string;
  weight_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number | null;
  sugar: number | null;
  sodium_mg: number | null;
  source: "image" | "user";
};

type NutritionSummary = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number | null;
  sugar: number | null;
  sodium_mg: number | null;
};

type Analysis = {
  mealName: string;
  category: MealCategory;
  totalWeightGrams: number;
  confidence: number;
  items: FoodItem[];
  notes: string[];
  imagePath: string;
  submissionId: string;
};

type MealRecord = NutritionSummary & {
  id: string;
  meal_name: string;
  meal_category: MealCategory;
  food_weight_grams: number;
  food_items: FoodItem[];
  food_image_path: string | null;
  logged_at: string;
  imageUrl: string | null;
};

const blankSummary: NutritionSummary = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  fiber: null,
  sugar: null,
  sodium_mg: null,
};

function categoryForTime(): MealCategory {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "Breakfast";
  if (hour >= 11 && hour < 16) return "Lunch";
  if (hour >= 16 && hour < 19) return "Snacks";
  return "Dinner";
}

function summarize(items: FoodItem[]): NutritionSummary {
  const sumField = (field: keyof NutritionSummary) => {
    const values = items.map((item) => item[field]).filter((value): value is number => typeof value === "number");
    return values.length ? values.reduce((total, value) => total + value, 0) : null;
  };
  return {
    calories: sumField("calories") ?? 0,
    protein: sumField("protein") ?? 0,
    carbs: sumField("carbs") ?? 0,
    fats: sumField("fats") ?? 0,
    fiber: sumField("fiber"),
    sugar: sumField("sugar"),
    sodium_mg: sumField("sodium_mg"),
  };
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value);
}

function resizeItem(item: FoodItem, weight: number): FoodItem {
  const ratio = item.weight_grams > 0 ? weight / item.weight_grams : 0;
  return {
    ...item,
    weight_grams: weight,
    calories: item.calories * ratio,
    protein: item.protein * ratio,
    carbs: item.carbs * ratio,
    fats: item.fats * ratio,
    fiber: item.fiber === null ? null : item.fiber * ratio,
    sugar: item.sugar === null ? null : item.sugar * ratio,
    sodium_mg: item.sodium_mg === null ? null : item.sodium_mg * ratio,
  };
}

function Metric({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-medium text-white/50">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>
        {formatNumber(value, unit === "g" ? 1 : 0)}
        <span className="ml-1 text-xs font-medium text-white/45">{unit}</span>
      </p>
    </div>
  );
}

function MacroProgress({
  label,
  consumed,
  target,
  color,
}: {
  label: string;
  consumed: number;
  target: number;
  color: string;
}) {
  const percentage = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="font-medium text-white">
          {formatNumber(consumed, 1)} <span className="text-white/40">/ {formatNumber(target)}g</span>
        </span>
      </div>
      <Progress value={percentage} className="h-2 bg-white/10 [&>div]:bg-[#00e58a]" />
      <div className={`sr-only ${color}`}>{Math.round(percentage)}% of target</div>
    </div>
  );
}

export default function Nutrition() {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraRequestId = useRef(0);
  const analysisLock = useRef(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [targets, setTargets] = useState({ calories: 2000, protein: 150, carbs: 200, fats: 65 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoSource, setPhotoSource] = useState<"camera" | "upload" | null>(null);
  const [imageError, setImageError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "loading" | "live" | "error">("idle");
  const [cameraError, setCameraError] = useState("");
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);
  const [weightGrams, setWeightGrams] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState<MealCategory>(categoryForTime);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<string | null>(null);
  const [editedItems, setEditedItems] = useState<FoodItem[]>([]);
  const [editedName, setEditedName] = useState("");
  const [editedCategory, setEditedCategory] = useState<MealCategory>("Snacks");
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodWeight, setNewFoodWeight] = useState("");
  const [estimatingItem, setEstimatingItem] = useState(false);
  const [editImagePath, setEditImagePath] = useState<string | null>(null);

  const todayTotals = useMemo(
    () =>
      meals.reduce(
        (total, meal) => ({
          calories: total.calories + meal.calories,
          protein: total.protein + meal.protein,
          carbs: total.carbs + meal.carbs,
          fats: total.fats + meal.fats,
          fiber: total.fiber === null || meal.fiber === null ? null : total.fiber + meal.fiber,
          sugar: total.sugar === null || meal.sugar === null ? null : total.sugar + meal.sugar,
          sodium_mg:
            total.sodium_mg === null || meal.sodium_mg === null ? null : total.sodium_mg + meal.sodium_mg,
        }),
        { ...blankSummary },
      ),
    [meals],
  );
  const remainingCalories = targets.calories - todayTotals.calories;

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (!cameraStream) return;
    const video = videoRef.current;
    if (video) {
      video.srcObject = cameraStream;
      void video.play().catch((error: unknown) => {
        console.warn("Could not start the camera preview:", error);
      });
    }
    return () => {
      if (video) video.srcObject = null;
    };
  }, [cameraStream]);

  useEffect(
    () => () => {
      cameraRequestId.current += 1;
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    },
    [],
  );

  const loadMeals = useCallback(async (id: string) => {
    setLoading(true);
    setLoadError("");
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const [profileResult, logsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("daily_calories_target, protein_target, carbs_target, fats_target")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("nutrition_logs" as any)
          .select("*")
          .eq("user_id", id)
          .eq("is_confirmed", true)
          .gte("logged_at", start.toISOString())
          .lt("logged_at", end.toISOString())
          .order("logged_at", { ascending: true }),
      ]);
      if (profileResult.error) throw profileResult.error;
      if (logsResult.error) throw logsResult.error;

      const profile = profileResult.data as {
        daily_calories_target?: number | null;
        protein_target?: number | null;
        carbs_target?: number | null;
        fats_target?: number | null;
      } | null;
      setTargets({
        calories: profile?.daily_calories_target || 2000,
        protein: profile?.protein_target || 150,
        carbs: profile?.carbs_target || 200,
        fats: profile?.fats_target || 65,
      });

      const records = (logsResult.data || []) as any[];
      const hydrated = await Promise.all(
        records.map(async (record): Promise<MealRecord> => {
          let imageUrl: string | null = null;
          if (record.food_image_path) {
            const { data, error } = await supabase.storage
              .from(IMAGE_BUCKET)
              .createSignedUrl(record.food_image_path, 60 * 60);
            if (error) console.warn("Could not load a meal image:", error.message);
            imageUrl = data?.signedUrl ?? null;
          }
          return {
            id: record.id,
            meal_name: record.meal_name || "Meal",
            meal_category: record.meal_category || "Snacks",
            food_weight_grams: Number(record.food_weight_grams) || 0,
            food_items: Array.isArray(record.food_items) ? record.food_items : [],
            food_image_path: record.food_image_path,
            logged_at: record.logged_at,
            imageUrl,
            calories: Number(record.calories) || 0,
            protein: Number(record.protein) || 0,
            carbs: Number(record.carbs) || 0,
            fats: Number(record.fats) || 0,
            fiber: record.fiber === null ? null : Number(record.fiber) || 0,
            sugar: record.sugar === null ? null : Number(record.sugar) || 0,
            sodium_mg: record.sodium_mg === null ? null : Number(record.sodium_mg) || 0,
          };
        }),
      );
      setMeals(hydrated);
    } catch (error) {
      console.error("Nutrition dashboard load failed:", error);
      setLoadError("We couldn't load today's nutrition records. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Could not read the current session:", error);
        if (active) {
          setLoadError("We couldn't verify your session. Please sign in again.");
          setLoading(false);
        }
        return;
      }
      if (active) setUserId(data.session?.user.id ?? null);
    };
    void initialize();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (userId) void loadMeals(userId);
    else {
      setMeals([]);
      setLoading(false);
    }
  }, [loadMeals, userId]);

  const clearTemporaryImage = useCallback(async (path: string | null) => {
    if (!path) return;
    const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([path]);
    if (error) console.error("Temporary meal image cleanup failed:", error.message);
  }, []);

  const stopCamera = useCallback(() => {
    cameraRequestId.current += 1;
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setCameraStream(null);
    setCameraStatus("idle");
  }, []);

  const closeScanner = useCallback(() => {
    if (isAnalyzing || isSaving || estimatingItem) return;
    stopCamera();
    void clearTemporaryImage(analysis?.imagePath ?? null);
    setDialogOpen(false);
    setPhoto(null);
    setPhotoSource(null);
    setImageError("");
    setCameraError("");
    setWeightGrams("");
    setContext("");
    setCategory(categoryForTime());
    setAnalysis(null);
    setNewFoodName("");
    setNewFoodWeight("");
  }, [analysis?.imagePath, clearTemporaryImage, estimatingItem, isAnalyzing, isSaving, stopCamera]);

  const selectPhoto = (file: File | undefined, source: "camera" | "upload") => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setImageError("Choose a JPEG, PNG, or WebP image. Some camera apps save photos in an unsupported format.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be 8 MB or smaller. Choose or capture a smaller image.");
      return;
    }
    if (analysis?.imagePath) void clearTemporaryImage(analysis.imagePath);
    stopCamera();
    setImageError("");
    setPhoto(file);
    setPhotoSource(source);
    setAnalysis(null);
  };

  const startCamera = async (
    facingMode: "environment" | "user" = cameraFacingMode,
    deviceId?: string,
  ) => {
    const requestId = ++cameraRequestId.current;
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setCameraStream(null);
    setCameraStatus("loading");
    setCameraError("");
    setCameraFacingMode(facingMode);
    setCanSwitchCamera(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("error");
      setCameraError("Live camera preview isn't supported here. You can still upload a photo.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: facingMode } },
      });
      if (requestId !== cameraRequestId.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      cameraStreamRef.current = stream;
      setCameraStream(stream);
      setCameraStatus("live");
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        setCameraDevices(cameras);
        setCanSwitchCamera(cameras.length > 1);
      } catch (error) {
        console.warn("Could not list available cameras:", error);
        setCanSwitchCamera(false);
      }
    } catch (error) {
      if (requestId !== cameraRequestId.current) return;
      setCameraStatus("error");
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setCameraError("Camera access was denied. Allow camera access in your browser settings, or upload an image instead.");
      } else if (error instanceof DOMException && error.name === "NotFoundError") {
        setCameraError("No camera was found on this device. You can upload an image instead.");
      } else if (error instanceof DOMException && error.name === "NotReadableError") {
        setCameraError("The camera is already in use by another app. Close it or upload an image instead.");
      } else {
        setCameraError("We couldn't start the camera. Check your browser permissions, or upload an image instead.");
        console.error("Could not start the food scanner camera:", error);
      }
    }
  };

  const takePhoto = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 768px), (pointer: coarse)").matches) {
      cameraInput.current?.click();
      return;
    }
    void startCamera();
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("The camera preview isn't ready yet. Wait a moment and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("We couldn't capture this photo. Please try again or upload an image.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) {
      setCameraError("We couldn't capture this photo. Please try again or upload an image.");
      return;
    }

    stopCamera();
    selectPhoto(new File([blob], `meal-${Date.now()}.jpg`, { type: "image/jpeg" }), "camera");
  };

  const clearSelectedPhoto = () => {
    if (analysis?.imagePath) void clearTemporaryImage(analysis.imagePath);
    stopCamera();
    setPhoto(null);
    setPhotoSource(null);
    setAnalysis(null);
    setImageError("");
  };

  const analyzeMeal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const grams = Number(weightGrams);
    if (!userId) {
      toast.error("Sign in to analyze and save a meal.");
      return;
    }
    if (!photo) {
      toast.error("Add a photo of your meal first.");
      return;
    }
    if (!Number.isFinite(grams) || grams < 1 || grams > 5000) {
      toast.error("Enter a food-only weight between 1g and 5,000g.");
      return;
    }
    if (analysisLock.current) return;

    analysisLock.current = true;
    setIsAnalyzing(true);
    const extension = photo.type === "image/jpeg" ? "jpg" : photo.type.split("/")[1];
    const path = `${userId}/${crypto.randomUUID()}.${extension}`;
    try {
      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(path, photo, { contentType: photo.type, cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { data, error } = await supabase.functions.invoke("nutrition-ai", {
        body: {
          type: "analyze",
          imagePath: path,
          totalWeightGrams: grams,
          context: context.trim(),
          category,
        },
      });
      if (error) throw new Error(error.message || "Meal analysis failed.");
      if (data?.error) throw new Error(data.error);

      setAnalysis({
        mealName: data.mealName,
        category,
        totalWeightGrams: Number(data.totalWeightGrams) || grams,
        confidence: Number(data.confidence) || 0,
        items: data.items,
        notes: Array.isArray(data.notes) ? data.notes : [],
        imagePath: path,
        submissionId: crypto.randomUUID(),
      });
      toast.success("Meal analysis is ready to review.");
    } catch (error) {
      await clearTemporaryImage(path);
      console.error("Meal analysis failed:", error);
      toast.error("Couldn't analyze this meal", {
        description: error instanceof Error ? error.message : "Please try again with a clearer photo.",
      });
    } finally {
      analysisLock.current = false;
      setIsAnalyzing(false);
    }
  };

  const reestimateAnalysisItem = async (index: number) => {
    if (!analysis) return;
    const item = analysis.items[index];
    setEstimatingItem(true);
    try {
      const estimate = await estimateFoodItem(analysis.imagePath, item.name, item.weight_grams);
      if (!estimate) return;
      setAnalysis((current) => {
        if (!current) return current;
        const items = [...current.items];
        items[index] = estimate;
        return { ...current, items };
      });
    } catch (error) {
      toast.error("Couldn't update this food estimate", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setEstimatingItem(false);
    }
  };

  const updateAnalysisItem = (index: number, patch: Partial<FoodItem>) => {
    setAnalysis((current) => {
      if (!current) return current;
      const items = [...current.items];
      const existing = items[index];
      items[index] =
        typeof patch.weight_grams === "number"
          ? resizeItem({ ...existing, ...patch, weight_grams: existing.weight_grams }, patch.weight_grams)
          : { ...existing, ...patch };
      const totalWeightGrams = items.reduce((sum, item) => sum + item.weight_grams, 0);
      return { ...current, items, totalWeightGrams: totalWeightGrams || current.totalWeightGrams };
    });
  };

  const removeAnalysisItem = (index: number) => {
    setAnalysis((current) => {
      if (!current) return current;
      const items = current.items.filter((_, itemIndex) => itemIndex !== index);
      const totalWeightGrams = items.reduce((sum, item) => sum + item.weight_grams, 0);
      return { ...current, items, totalWeightGrams: totalWeightGrams || current.totalWeightGrams };
    });
  };

  const estimateFoodItem = async (imagePath: string, name: string, grams: number) => {
    if (!userId || !name.trim() || !Number.isFinite(grams) || grams < 1 || grams > 5000) {
      toast.error("Enter a food name and a weight between 1g and 5,000g.");
      return null;
    }
    const { data, error } = await supabase.functions.invoke("nutrition-ai", {
      body: { type: "estimate-item", imagePath, name: name.trim(), weightGrams: grams },
    });
    if (error) throw new Error(error.message || "Food estimate failed.");
    if (data?.error) throw new Error(data.error);
    return data.item as FoodItem;
  };

  const addAnalysisItem = async () => {
    if (!analysis) return;
    const currentWeight = analysis.items.reduce((sum, food) => sum + food.weight_grams, 0);
    const requestedWeight = Number(newFoodWeight);
    if (analysis.items.length && requestedWeight >= currentWeight) {
      toast.error("The added food must weigh less than the current total so the other portions can be adjusted.");
      return;
    }
    if (!analysis.items.length && requestedWeight !== analysis.totalWeightGrams) {
      toast.error(`With no other items, use the full ${formatNumber(analysis.totalWeightGrams)}g meal weight.`);
      return;
    }
    setEstimatingItem(true);
    try {
      const item = await estimateFoodItem(analysis.imagePath, newFoodName, requestedWeight);
      if (!item) return;
      setAnalysis((current) => {
        if (!current) return current;
        const total = current.items.reduce((sum, food) => sum + food.weight_grams, 0) || current.totalWeightGrams;
        const remaining = total - item.weight_grams;
        const existingTotal = current.items.reduce((sum, food) => sum + food.weight_grams, 0);
        const adjustedItems = current.items.map((food) =>
          resizeItem(food, existingTotal > 0 ? (food.weight_grams / existingTotal) * remaining : 0),
        );
        return { ...current, items: [...adjustedItems, item], totalWeightGrams: total };
      });
      setNewFoodName("");
      setNewFoodWeight("");
    } catch (error) {
      toast.error("Couldn't estimate that food item", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setEstimatingItem(false);
    }
  };

  const confirmMeal = async () => {
    if (!analysis || !userId || !analysis.items.length) return;
    const summary = summarize(analysis.items);
    const totalWeight = analysis.items.reduce((sum, item) => sum + item.weight_grams, 0);
    if (totalWeight <= 0 || analysis.items.some((item) => !item.name.trim() || item.weight_grams <= 0)) {
      toast.error("Every food item needs a name and a weight greater than zero.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("nutrition_logs" as any).upsert(
        {
          user_id: userId,
          client_submission_id: analysis.submissionId,
          meal_name: analysis.mealName,
          meal_category: analysis.category,
          food_weight_grams: totalWeight,
          food_items: analysis.items,
          food_image_path: analysis.imagePath,
          user_context: context.trim() || null,
          analysis_metadata: { confidence: analysis.confidence, notes: analysis.notes },
          calories: Math.round(summary.calories),
          protein: Number(summary.protein.toFixed(1)),
          carbs: Number(summary.carbs.toFixed(1)),
          fats: Number(summary.fats.toFixed(1)),
          fiber: summary.fiber === null ? null : Number(summary.fiber.toFixed(1)),
          sugar: summary.sugar === null ? null : Number(summary.sugar.toFixed(1)),
          sodium_mg: summary.sodium_mg === null ? null : Math.round(summary.sodium_mg),
          is_confirmed: true,
          confirmed_at: new Date().toISOString(),
          logged_at: new Date().toISOString(),
        },
        { onConflict: "user_id,client_submission_id", ignoreDuplicates: true },
      );
      if (error) throw error;

      setAnalysis(null);
      setPhoto(null);
      setWeightGrams("");
      setContext("");
      setDialogOpen(false);
      await loadMeals(userId);
      toast.success("Meal confirmed and added to today's nutrition.");
    } catch (error) {
      console.error("Could not save confirmed meal:", error);
      toast.error("Meal wasn't saved", {
        description: error instanceof Error ? error.message : "Please try confirming again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const beginEdit = (meal: MealRecord) => {
    setEditingMeal(meal.id);
    setEditedItems(meal.food_items);
    setEditedName(meal.meal_name);
    setEditedCategory(meal.meal_category);
    setEditImagePath(meal.food_image_path);
    setNewFoodName("");
    setNewFoodWeight("");
  };

  const updateEditedItem = (index: number, patch: Partial<FoodItem>) => {
    setEditedItems((items) =>
      items.map((item, itemIndex) =>
        itemIndex !== index
          ? item
          : typeof patch.weight_grams === "number"
            ? resizeItem({ ...item, ...patch, weight_grams: item.weight_grams }, patch.weight_grams)
            : { ...item, ...patch },
      ),
    );
  };

  const reestimateEditedItem = async (index: number) => {
    if (!editImagePath) {
      toast.error("This older meal has no image for an AI estimate.");
      return;
    }
    const item = editedItems[index];
    setEstimatingItem(true);
    try {
      const estimate = await estimateFoodItem(editImagePath, item.name, item.weight_grams);
      if (!estimate) return;
      setEditedItems((items) => items.map((current, itemIndex) => itemIndex === index ? estimate : current));
    } catch (error) {
      toast.error("Couldn't update this food estimate", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setEstimatingItem(false);
    }
  };

  const addEditedItem = async () => {
    if (!editImagePath) {
      toast.error("This older meal has no image. Add a food by editing its breakdown manually.");
      return;
    }
    const currentWeight = editedItems.reduce((sum, food) => sum + food.weight_grams, 0);
    const requestedWeight = Number(newFoodWeight);
    if (editedItems.length && requestedWeight >= currentWeight) {
      toast.error("The added food must weigh less than the current total so the other portions can be adjusted.");
      return;
    }
    setEstimatingItem(true);
    try {
      const item = await estimateFoodItem(editImagePath, newFoodName, requestedWeight);
      if (!item) return;
      setEditedItems((items) => {
        const total = items.reduce((sum, food) => sum + food.weight_grams, 0);
        const remaining = total - item.weight_grams;
        const adjustedItems = items.map((food) =>
          resizeItem(food, total > 0 ? (food.weight_grams / total) * remaining : 0),
        );
        return [...adjustedItems, item];
      });
      setNewFoodName("");
      setNewFoodWeight("");
    } catch (error) {
      toast.error("Couldn't estimate that food item", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setEstimatingItem(false);
    }
  };

  const saveEditedMeal = async (meal: MealRecord) => {
    if (!userId || !editedItems.length) {
      toast.error("A meal needs at least one food item.");
      return;
    }
    if (editedItems.some((item) => !item.name.trim() || item.weight_grams <= 0)) {
      toast.error("Every food item needs a name and a weight greater than zero.");
      return;
    }
    const summary = summarize(editedItems);
    const foodWeight = editedItems.reduce((sum, item) => sum + item.weight_grams, 0);
    const { error } = await supabase
      .from("nutrition_logs" as any)
      .update({
        meal_name: editedName.trim() || "Meal",
        meal_category: editedCategory,
        food_weight_grams: foodWeight,
        food_items: editedItems,
        calories: Math.round(summary.calories),
        protein: Number(summary.protein.toFixed(1)),
        carbs: Number(summary.carbs.toFixed(1)),
        fats: Number(summary.fats.toFixed(1)),
        fiber: summary.fiber,
        sugar: summary.sugar,
        sodium_mg: summary.sodium_mg,
      })
      .eq("id", meal.id)
      .eq("user_id", userId);
    if (error) {
      toast.error("Couldn't update this meal", { description: error.message });
      return;
    }
    setEditingMeal(null);
    await loadMeals(userId);
    toast.success("Meal updated and daily totals recalculated.");
  };

  const deleteMeal = async (meal: MealRecord) => {
    if (!userId || !window.confirm(`Delete "${meal.meal_name}" from today's log?`)) return;
    const { error } = await supabase
      .from("nutrition_logs" as any)
      .delete()
      .eq("id", meal.id)
      .eq("user_id", userId);
    if (error) {
      toast.error("Couldn't delete this meal", { description: error.message });
      return;
    }
    if (meal.food_image_path) {
      const { error: imageError } = await supabase.storage.from(IMAGE_BUCKET).remove([meal.food_image_path]);
      if (imageError) console.error("Meal image cleanup failed:", imageError.message);
    }
    await loadMeals(userId);
    toast.success("Meal deleted and daily totals recalculated.");
  };

  return (
    <main
      className="min-h-screen overflow-x-clip bg-[#080b0a] pb-28 text-white selection:bg-[#00e58a]/30"
      style={{ paddingTop: "calc(var(--header-height, 5rem) + 1.5rem)" }}
    >
      <Container className="relative z-10 max-w-5xl px-4 sm:px-6">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-white/10 bg-[#101412] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#00e58a]/30 bg-[#00e58a]/10 text-[#00e58a]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#00e58a]">SmartFit AI</p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Nutrition</h1>
              <p className="mt-1 text-sm text-white/50">A clearer picture of what fuels your day.</p>
            </div>
          </div>
          <Button
            onClick={() => {
              if (!userId) {
                toast.error("Sign in to scan and save your meals.");
                navigate("/auth");
                return;
              }
              setDialogOpen(true);
            }}
            className="h-12 w-full rounded-xl bg-[#00e58a] px-5 font-bold text-black hover:bg-[#00cc7a] sm:w-auto"
          >
            <ScanLine className="mr-2 h-5 w-5" />
            + Scan Your Food
          </Button>
        </header>

        {loadError && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">
            <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{loadError}</span>
            {userId && <Button variant="ghost" onClick={() => void loadMeals(userId)}>Try again</Button>}
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-[#101412] p-5 sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white/55">TODAY'S INTAKE</p>
                <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{formatNumber(todayTotals.calories)} <span className="text-base font-medium text-white/50">kcal</span></h2>
                <p className="mt-1 text-sm text-white/45">of {formatNumber(targets.calories)} kcal daily target</p>
              </div>
              <div className="rounded-2xl bg-[#00e58a]/10 p-3 text-[#00e58a]"><Apple className="h-6 w-6" /></div>
            </div>
            <Progress
              value={targets.calories > 0 ? Math.min(100, (todayTotals.calories / targets.calories) * 100) : 0}
              className="h-3 bg-white/10 [&>div]:bg-[#00e58a]"
            />
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-white/45">{Math.round(targets.calories > 0 ? (todayTotals.calories / targets.calories) * 100 : 0)}% of target</span>
              <span className={remainingCalories < 0 ? "text-amber-300" : "text-[#00e58a]"}>
                {formatNumber(Math.abs(remainingCalories))} kcal {remainingCalories < 0 ? "over" : "remaining"}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#101412] p-5 sm:p-7">
            <h2 className="mb-5 text-lg font-bold">Macronutrients</h2>
            <div className="space-y-5">
              <MacroProgress label="Protein" consumed={todayTotals.protein} target={targets.protein} color="text-[#00e58a]" />
              <MacroProgress label="Carbohydrates" consumed={todayTotals.carbs} target={targets.carbs} color="text-sky-400" />
              <MacroProgress label="Fats" consumed={todayTotals.fats} target={targets.fats} color="text-amber-400" />
            </div>
          </div>
        </section>

        <section className="mt-9">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white/45">YOUR CONFIRMED ENTRIES</p>
              <h2 className="mt-1 text-xl font-bold">Today's meals</h2>
            </div>
            <span className="text-sm text-white/45">{meals.length} {meals.length === 1 ? "meal" : "meals"}</span>
          </div>

          {loading ? (
            <div className="flex min-h-32 items-center justify-center rounded-3xl border border-white/10 bg-[#101412] text-white/60">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading today's meals…
            </div>
          ) : meals.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-[#101412]/70 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00e58a]/10 text-[#00e58a]"><Utensils className="h-6 w-6" /></div>
              <h3 className="mt-4 text-lg font-semibold">Nothing logged today</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/50">Take a photo of your meal, add its food-only weight, and review the estimate before it counts.</p>
              <Button onClick={() => userId ? setDialogOpen(true) : navigate("/auth")} className="mt-5 rounded-xl bg-[#00e58a] font-bold text-black hover:bg-[#00cc7a]">
                <Camera className="mr-2 h-4 w-4" /> Scan your first meal
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map((meal) => {
                const isExpanded = expandedMeal === meal.id;
                const isEditing = editingMeal === meal.id;
                const items = isEditing ? editedItems : meal.food_items;
                return (
                  <article key={meal.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#101412]">
                    <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
                      {meal.imageUrl ? (
                        <img src={meal.imageUrl} alt={meal.meal_name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/45"><Utensils className="h-5 w-5" /></div>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
                        className="min-w-0 flex-1 text-left"
                        aria-expanded={isExpanded}
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold">{meal.meal_name}</span>
                          <span className="rounded-full bg-[#00e58a]/10 px-2 py-0.5 text-[11px] font-medium text-[#00e58a]">{meal.meal_category}</span>
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-xs text-white/45"><Clock3 className="h-3 w-3" />{new Date(meal.logged_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                        <span className="mt-2 block text-xs text-white/55">
                          {formatNumber(meal.calories)} kcal · P {formatNumber(meal.protein, 1)}g · C {formatNumber(meal.carbs, 1)}g · F {formatNumber(meal.fats, 1)}g
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
                        className="rounded-lg p-2 text-white/45 hover:bg-white/5 hover:text-white"
                        aria-label={isExpanded ? "Collapse meal details" : "Expand meal details"}
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-white/10 px-4 py-4 sm:px-5">
                        {isEditing ? (
                          <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="text-xs text-white/50">Meal name
                                <input value={editedName} onChange={(event) => setEditedName(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white" />
                              </label>
                              <label className="text-xs text-white/50">Category
                                <select value={editedCategory} onChange={(event) => setEditedCategory(event.target.value as MealCategory)} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#111] px-3 text-sm text-white">
                                  {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
                                </select>
                              </label>
                            </div>
                            {editedItems.map((item, index) => (
                              <div key={`${meal.id}-${index}`} className="grid grid-cols-[1fr_88px_36px] items-end gap-2">
                                <label className="text-xs text-white/50">Food name
                                  <input value={item.name} onChange={(event) => updateEditedItem(index, { name: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white" />
                                </label>
                                <label className="text-xs text-white/50">Weight (g)
                                  <input type="number" min="1" value={item.weight_grams} onChange={(event) => updateEditedItem(index, { weight_grams: Number(event.target.value) })} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-sm text-white" />
                                </label>
                                <button type="button" onClick={() => setEditedItems((current) => current.filter((_, i) => i !== index))} aria-label={`Remove ${item.name}`} className="mb-1 rounded-lg p-2 text-white/40 hover:bg-red-400/10 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                                {editImagePath && (
                                  <button type="button" disabled={estimatingItem} onClick={() => void reestimateEditedItem(index)} className="col-span-3 justify-self-start text-xs text-[#00e58a] hover:underline disabled:opacity-50">
                                    {estimatingItem ? "Updating estimate…" : "Re-estimate nutrition"}
                                  </button>
                                )}
                              </div>
                            ))}
                            <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                              <input value={newFoodName} onChange={(event) => setNewFoodName(event.target.value)} placeholder="Add a food item" className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/35" />
                              <input type="number" min="1" value={newFoodWeight} onChange={(event) => setNewFoodWeight(event.target.value)} placeholder="Weight (g)" className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/35" />
                              {editImagePath ? (
                                <Button type="button" variant="outline" disabled={estimatingItem} onClick={() => void addEditedItem()} className="h-10 border-white/15 text-white hover:bg-white/10">
                                  {estimatingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />} Add food
                                </Button>
                              ) : (
                                <span className="self-center text-xs text-white/40">New items need a meal photo to estimate nutrients.</span>
                              )}
                            </div>
                            <p className="text-xs text-white/40">Changing weight scales estimated nutrients proportionally. After correcting a food name, re-estimate its nutrition. Estimates are approximate.</p>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" onClick={() => void saveEditedMeal(meal)} className="rounded-lg bg-[#00e58a] font-semibold text-black hover:bg-[#00cc7a]"><Check className="mr-1 h-4 w-4" />Save changes</Button>
                              <Button type="button" variant="ghost" onClick={() => setEditingMeal(null)} className="text-white/70 hover:bg-white/5">Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-3">
                              {items.map((item, index) => (
                                <div key={`${item.name}-${index}`} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                  <span className="text-white/80">
                                    {item.name} <span className="text-white/40">— {formatNumber(item.weight_grams)}g</span>
                                    <span className="ml-2 text-[10px] text-white/35">{item.source === "user" ? "from your details" : "identified in photo"}</span>
                                  </span>
                                  <span className="text-xs text-white/50">{formatNumber(item.calories)} kcal · P {formatNumber(item.protein, 1)}g · C {formatNumber(item.carbs, 1)}g · F {formatNumber(item.fats, 1)}g</span>
                                </div>
                              ))}
                              {items.length === 0 && <p className="text-sm text-white/45">No detailed food breakdown available.</p>}
                            </div>
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                              <p className="text-xs text-white/45">Estimated total weight: {formatNumber(meal.food_weight_grams)}g</p>
                              <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => beginEdit(meal)} className="h-9 border-white/15 text-white hover:bg-white/10">Edit meal</Button>
                                <Button type="button" variant="ghost" onClick={() => void deleteMeal(meal)} className="h-9 text-red-300 hover:bg-red-400/10 hover:text-red-200"><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </Container>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) setDialogOpen(true);
          else closeScanner();
        }}
      >
        <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto border-white/10 bg-[#101412] p-0 text-white">
          <div className="p-5 sm:p-7">
            <DialogHeader className="mb-6 pr-7 text-left">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#00e58a]/10 text-[#00e58a]"><ScanLine className="h-5 w-5" /></div>
              <DialogTitle className="text-2xl font-bold">{analysis ? "Review your meal" : "Scan your food"}</DialogTitle>
              <DialogDescription className="text-white/50">
                {analysis ? "Check the food breakdown and estimates before adding this meal to your day." : "A photo and the food-only weight help us create a better estimate."}
              </DialogDescription>
            </DialogHeader>

            {!analysis ? (
              <form onSubmit={analyzeMeal} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">Food image</label>
                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      disabled={isAnalyzing || cameraStatus === "loading" || cameraStatus === "live"}
                      onClick={takePhoto}
                      className="h-14 rounded-xl bg-[#00e58a] font-bold text-black hover:bg-[#00cc7a] disabled:opacity-50"
                    >
                      {cameraStatus === "loading" ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Camera className="mr-2 h-5 w-5" />
                      )}
                      Take a Photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isAnalyzing}
                      onClick={() => fileInput.current?.click()}
                      className="h-14 rounded-xl border-white/15 bg-white/[0.03] font-semibold text-white hover:bg-white/10"
                    >
                      <ImagePlus className="mr-2 h-5 w-5 text-[#00e58a]" />
                      Upload Image
                    </Button>
                  </div>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      selectPhoto(event.target.files?.[0], "upload");
                      event.currentTarget.value = "";
                    }}
                    className="sr-only"
                  />
                  <input
                    ref={cameraInput}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => {
                      selectPhoto(event.target.files?.[0], "camera");
                      event.currentTarget.value = "";
                    }}
                    className="sr-only"
                  />
                  {cameraStatus === "loading" && (
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-[#00e58a]" />Waiting for camera permission…</span>
                      <Button type="button" variant="ghost" onClick={stopCamera} className="text-white/70 hover:text-white">Cancel</Button>
                    </div>
                  )}
                  {cameraError && cameraStatus !== "idle" && (
                    <div role="alert" className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-300/20 bg-amber-100/[0.04] p-4 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
                      <span>{cameraError}</span>
                      <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} className="shrink-0 border-white/15 text-white hover:bg-white/10">
                        <ImagePlus className="mr-2 h-4 w-4" />Upload Image
                      </Button>
                    </div>
                  )}
                  {cameraStatus === "live" && (
                    <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
                      <video ref={videoRef} autoPlay muted playsInline aria-label="Live meal camera preview" className="max-h-[50dvh] min-h-48 w-full object-contain" />
                      <div className="flex items-center justify-between gap-3 border-t border-white/10 p-3">
                        <Button type="button" variant="ghost" onClick={stopCamera} className="text-white/70 hover:text-white">
                          <X className="mr-2 h-4 w-4" />Close camera
                        </Button>
                        <div className="flex items-center gap-2">
                          {canSwitchCamera && (
                            <Button
                              type="button"
                              variant="outline"
                              aria-label="Switch camera"
                              onClick={() => {
                                const currentDeviceId = cameraStreamRef.current
                                  ?.getVideoTracks()[0]
                                  ?.getSettings().deviceId;
                                const currentIndex = cameraDevices.findIndex((device) => device.deviceId === currentDeviceId);
                                const nextDevice = cameraDevices[(currentIndex + 1) % cameraDevices.length];
                                void startCamera(
                                  cameraFacingMode === "environment" ? "user" : "environment",
                                  nextDevice?.deviceId,
                                );
                              }}
                              className="h-10 w-10 border-white/15 p-0 text-white hover:bg-white/10"
                            >
                              <SwitchCamera className="h-4 w-4" />
                            </Button>
                          )}
                          <Button type="button" onClick={() => void capturePhoto()} className="h-10 rounded-xl bg-[#00e58a] px-4 font-bold text-black hover:bg-[#00cc7a]">
                            <Camera className="mr-2 h-4 w-4" />Capture
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {imageError && (
                    <p role="alert" className="mb-3 flex items-center gap-2 text-sm text-red-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />{imageError}
                    </p>
                  )}
                  {previewUrl ? (
                    <div className="relative overflow-hidden rounded-2xl border border-white/10">
                      <img src={previewUrl} alt="Selected meal preview" className="max-h-64 w-full object-contain" />
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 p-3">
                        <span className="text-xs text-white/50">{photoSource === "camera" ? "Photo captured" : "Image uploaded"}</span>
                        <div className="flex flex-wrap gap-2">
                          {photoSource === "camera" && (
                            <Button type="button" variant="secondary" disabled={cameraStatus === "loading" || cameraStatus === "live"} onClick={takePhoto} className="h-9 bg-black/75 text-white hover:bg-black">
                              <RefreshCw className="mr-1 h-4 w-4" />Retake photo
                            </Button>
                          )}
                          <Button type="button" variant="secondary" onClick={clearSelectedPhoto} className="h-9 bg-black/75 text-white hover:bg-black">
                            <ImagePlus className="mr-1 h-4 w-4" />Replace
                          </Button>
                          <Button type="button" variant="secondary" onClick={clearSelectedPhoto} className="h-9 bg-black/75 text-white hover:bg-black" aria-label="Remove image">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : cameraStatus !== "live" && (
                    <p className="rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-3 text-center text-xs text-white/45">
                      JPEG, PNG, or WebP · up to 8 MB
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium">Total food weight (excluding plate)
                    <div className="relative mt-2">
                      <input type="number" min="1" max="5000" step="1" required value={weightGrams} onChange={(event) => setWeightGrams(event.target.value)} placeholder="e.g. 350" className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 pr-12 text-white placeholder:text-white/35" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40">g</span>
                    </div>
                    <span className="mt-2 block text-xs font-normal leading-5 text-white/45">Weigh the food without the plate: weigh the empty plate, then subtract that from the plate-plus-food weight.</span>
                  </label>
                  <label className="block text-sm font-medium">Meal category
                    <select value={category} onChange={(event) => setCategory(event.target.value as MealCategory)} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0b0e0c] px-4 text-white">
                      {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                </div>

                <label className="block text-sm font-medium">Additional context <span className="font-normal text-white/40">(optional)</span>
                  <textarea
                    value={context}
                    onChange={(event) => setContext(event.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Add details about your meal (optional). Example: 150g rice, 100g dal, 1 tbsp oil, homemade preparation, added sugar, etc."
                    className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/35"
                  />
                </label>

                <Button type="submit" disabled={isAnalyzing || !photo || cameraStatus === "loading" || cameraStatus === "live"} className="h-12 w-full rounded-xl bg-[#00e58a] font-bold text-black hover:bg-[#00cc7a] disabled:opacity-50">
                  {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing your meal…</> : <><Sparkles className="mr-2 h-4 w-4" />Analyze My Meal</>}
                </Button>
                {isAnalyzing && <p className="text-center text-xs text-white/45">Identifying foods and estimating nutrients. This can take a few seconds.</p>}
              </form>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-3 sm:flex-row">
                  {previewUrl && <img src={previewUrl} alt={analysis.mealName} className="h-40 w-full rounded-xl object-cover sm:h-28 sm:w-36" />}
                  <div className="min-w-0 flex-1 py-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#00e58a]">Detected meal</p>
                    <h3 className="mt-1 text-lg font-bold">{analysis.mealName}</h3>
                    <p className="mt-1 text-sm text-white/50">{analysis.category} · estimated {formatNumber(analysis.totalWeightGrams)}g</p>
                    <p className="mt-2 text-xs text-white/45">AI confidence: {Math.round(analysis.confidence * 100)}% · estimates may vary</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(() => {
                    const summary = summarize(analysis.items);
                    return <>
                      <Metric label="Calories" value={summary.calories} unit="kcal" color="text-[#00e58a]" />
                      <Metric label="Protein" value={summary.protein} unit="g" color="text-sky-300" />
                      <Metric label="Carbs" value={summary.carbs} unit="g" color="text-amber-300" />
                      <Metric label="Fats" value={summary.fats} unit="g" color="text-violet-300" />
                    </>;
                  })()}
                </div>

                <div className="rounded-2xl border border-white/10 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">Food breakdown</h3>
                    <span className="text-xs text-white/40">{formatNumber(analysis.items.reduce((sum, item) => sum + item.weight_grams, 0))}g total</span>
                  </div>
                  <div className="space-y-3">
                    {analysis.items.map((item, index) => (
                      <div key={`analysis-${index}`} className="grid grid-cols-[minmax(0,1fr)_86px_34px] items-end gap-2 border-t border-white/[0.07] pt-3 first:border-0 first:pt-0">
                        <label className="min-w-0 text-xs text-white/45">Food name
                          <input value={item.name} onChange={(event) => updateAnalysisItem(index, { name: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white" />
                          <span className="mt-1 block truncate text-[11px] text-white/35">{item.source === "user" ? "From your details · " : "Identified in photo · "}{formatNumber(item.calories)} kcal · P {formatNumber(item.protein, 1)}g · C {formatNumber(item.carbs, 1)}g · F {formatNumber(item.fats, 1)}g</span>
                        </label>
                        <label className="text-xs text-white/45">Weight (g)
                          <input type="number" min="1" step="1" value={item.weight_grams} onChange={(event) => updateAnalysisItem(index, { weight_grams: Number(event.target.value) })} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-sm text-white" />
                        </label>
                        <button type="button" onClick={() => removeAnalysisItem(index)} aria-label={`Remove ${item.name}`} className="mb-1 rounded-lg p-2 text-white/40 hover:bg-red-400/10 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                        <button type="button" disabled={estimatingItem} onClick={() => void reestimateAnalysisItem(index)} className="col-span-3 justify-self-start text-xs text-[#00e58a] hover:underline disabled:opacity-50">
                          {estimatingItem ? "Updating estimate…" : "Re-estimate nutrition"}
                        </button>
                      </div>
                    ))}
                    <div className="grid gap-2 border-t border-white/[0.07] pt-3 sm:grid-cols-[1fr_110px_auto]">
                      <input value={newFoodName} onChange={(event) => setNewFoodName(event.target.value)} placeholder="Add a missing food" className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/35" />
                      <input type="number" min="1" value={newFoodWeight} onChange={(event) => setNewFoodWeight(event.target.value)} placeholder="Weight (g)" className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/35" />
                      <Button type="button" variant="outline" disabled={estimatingItem} onClick={() => void addAnalysisItem()} className="h-10 border-white/15 text-white hover:bg-white/10">
                        {estimatingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />} Add food
                      </Button>
                    </div>
                  </div>
                </div>

                {analysis.notes.length > 0 && (
                  <div className="rounded-xl border border-amber-200/10 bg-amber-100/[0.04] p-4">
                    <p className="text-sm font-semibold text-amber-100">AI notes</p>
                    <ul className="mt-2 space-y-1 text-sm text-white/60">{analysis.notes.map((note, index) => <li key={index}>• {note}</li>)}</ul>
                  </div>
                )}
                <p className="text-xs leading-5 text-white/40">Nutrition is an AI estimate, not a laboratory measurement. Oil, salt, and sugar quantities cannot be reliably determined from an image alone. Review before logging.</p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => {
                      void clearTemporaryImage(analysis.imagePath);
                      setAnalysis(null);
                    }}
                    className="h-12 flex-1 border-white/15 text-white hover:bg-white/10"
                  >
                    <ChevronUp className="mr-2 h-4 w-4" />Edit meal details
                  </Button>
                  <Button type="button" disabled={isSaving || analysis.items.length === 0} onClick={() => void confirmMeal()} className="h-12 flex-1 rounded-xl bg-[#00e58a] font-bold text-black hover:bg-[#00cc7a]">
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving meal…</> : <><Check className="mr-2 h-4 w-4" />Confirm &amp; Log Meal</>}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
