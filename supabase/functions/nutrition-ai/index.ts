import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const imageBucket = "nutrition-images";
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const categories = new Set(["Breakfast", "Lunch", "Snacks", "Dinner"]);
const responseHeaders = { ...corsHeaders, "Content-Type": "application/json" };

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

class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function round(value: number, precision = 1): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function getImageDataUrl(client: ReturnType<typeof createClient>, userId: string, imagePath: unknown) {
  if (
    typeof imagePath !== "string" ||
    !imagePath.startsWith(`${userId}/`) ||
    imagePath.includes("..") ||
    imagePath.includes("\\")
  ) {
    throw new HttpError("Invalid meal image reference.", 400);
  }

  const { data: image, error } = await client.storage.from(imageBucket).download(imagePath);
  if (error || !image) throw new HttpError("The meal image could not be loaded. Please upload it again.", 400);
  if (image.size > 8 * 1024 * 1024 || !allowedTypes.has(image.type)) {
    throw new HttpError("Use a JPEG, PNG, or WebP image up to 8 MB.", 400);
  }
  const bytes = new Uint8Array(await image.arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isWebp =
    bytes.length >= 12 &&
    new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.subarray(8, 12)) === "WEBP";
  const actualType = isJpeg ? "image/jpeg" : isPng ? "image/png" : isWebp ? "image/webp" : null;
  if (!actualType || actualType !== image.type) {
    throw new HttpError("The uploaded file is not a valid JPEG, PNG, or WebP image.", 400);
  }
  return `data:${actualType};base64,${toBase64(bytes)}`;
}

async function callVisionModel(imageUrl: string, prompt: string) {
  const apiKey = Deno.env.get("GROQ_API_KEY")?.trim();
  if (!apiKey) throw new HttpError("Meal analysis is unavailable: the server's GROQ_API_KEY is not configured.", 503);

  const model = Deno.env.get("GROQ_VISION_MODEL")?.trim() || "qwen/qwen3.8-27b";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_completion_tokens: 1800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a cautious food identification and nutrition estimation assistant. Return valid JSON only. Estimates are approximate, never laboratory measurements. Do not claim you used a nutrition database. Do not invent exact amounts of oil, salt, sugar, or hidden ingredients. Distinguish visible foods from details provided by the user. If the photo is unclear or does not show food, return status='unclear', an empty items array, and concise clarification notes.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("Groq vision request failed:", response.status, (await response.text()).slice(0, 1000));
    throw new HttpError(`The vision service is temporarily unavailable (HTTP ${response.status}). Please try again.`, 502);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new HttpError("The vision service returned an empty analysis. Please try again.", 502);
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new HttpError("The vision service returned an unreadable analysis. Please try again.", 502);
  }
}

function makeFoodItem(value: unknown, source: "image" | "user"): FoodItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.name !== "string" || item.name.trim().length < 2 || item.name.trim().length > 100) return null;
  const calories = finiteNumber(item.calories);
  const protein = finiteNumber(item.protein);
  const carbs = finiteNumber(item.carbs);
  const fats = finiteNumber(item.fats);
  const grams = finiteNumber(item.weightGrams ?? item.weight_grams);
  if (calories === null || protein === null || carbs === null || fats === null || grams === null || grams <= 0) {
    return null;
  }
  if (calories > grams * 12 || protein > grams * 1.1 || carbs > grams * 1.1 || fats > grams * 1.1) return null;

  const optionalNutrient = (camelName: string, snakeName: string) =>
    finiteNumber(item[camelName] ?? item[snakeName]);
  const detectedSource =
    source === "image" && item.source === "user" ? "user" : source;

  return {
    name: item.name.trim(),
    weight_grams: round(grams),
    calories: round(calories),
    protein: round(protein),
    carbs: round(carbs),
    fats: round(fats),
    fiber: optionalNutrient("fiber", "fiber"),
    sugar: optionalNutrient("sugar", "sugar"),
    sodium_mg: optionalNutrient("sodiumMg", "sodium_mg"),
    source: detectedSource,
  };
}

function totalFoodItem(item: FoodItem, factor: number, weight: number): FoodItem {
  return {
    ...item,
    weight_grams: weight,
    calories: round(item.calories * factor),
    protein: round(item.protein * factor),
    carbs: round(item.carbs * factor),
    fats: round(item.fats * factor),
    fiber: item.fiber === null ? null : round(item.fiber * factor),
    sugar: item.sugar === null ? null : round(item.sugar * factor),
    sodium_mg: item.sodium_mg === null ? null : round(item.sodium_mg * factor),
  };
}

function makeSummary(items: FoodItem[]) {
  const sum = (field: keyof FoodItem) => {
    const values = items.map((item) => item[field]).filter((value): value is number => typeof value === "number");
    return values.length ? round(values.reduce((total, value) => total + value, 0)) : null;
  };
  return {
    calories: sum("calories") ?? 0,
    protein: sum("protein") ?? 0,
    carbs: sum("carbs") ?? 0,
    fats: sum("fats") ?? 0,
    fiber: sum("fiber"),
    sugar: sum("sugar"),
    sodium_mg: sum("sodium_mg"),
  };
}

function normalizeNotes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((note): note is string => typeof note === "string")
    .map((note) => note.trim().slice(0, 240))
    .filter(Boolean)
    .slice(0, 4);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed." }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) return respond({ error: "Sign in to analyze a meal." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) {
      console.error("Supabase URL or anon key is not configured for nutrition-ai.");
      return respond({ error: "Meal analysis is not configured on the server." }, 500);
    }

    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user) return respond({ error: "Your session is invalid. Please sign in again." }, 401);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return respond({ error: "Request must contain valid JSON." }, 400);
    }

    if (body.type === "estimate-item") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const grams = finiteNumber(body.weightGrams);
      if (!name || name.length > 100 || grams === null || grams < 1 || grams > 5000) {
        return respond({ error: "Enter a food name and a weight between 1g and 5,000g." }, 400);
      }

      const imageUrl = await getImageDataUrl(client, user.id, body.imagePath);
      const result = await callVisionModel(
        imageUrl,
        `Estimate nutrition for the user-identified food item "${name}" weighing ${grams} grams. The user-provided name is authoritative; use the photo only for preparation/appearance clues. Do not add other food items. Return JSON with this shape: {"status":"ok","item":{"name":"...","weightGrams":${grams},"calories":0,"protein":0,"carbs":0,"fats":0,"fiber":null,"sugar":null,"sodiumMg":null},"notes":["..."]}. Use numeric estimates for calories and macros. Return null only for fiber, sugar, or sodium when information is insufficient. Mention meaningful uncertainty briefly.`,
      );
      if (result.status !== "ok") return respond({ error: "That item could not be estimated from the available details." }, 422);
      const item = makeFoodItem(result.item, "user");
      if (!item) return respond({ error: "The vision service returned an invalid item estimate. Please try again." }, 502);
      item.weight_grams = round(grams);
      return respond({ item, notes: normalizeNotes(result.notes) });
    }

    if (body.type !== "analyze") return respond({ error: "Unsupported nutrition analysis request." }, 400);
    const requestedGrams = finiteNumber(body.totalWeightGrams);
    if (body.context !== undefined && typeof body.context !== "string") {
      return respond({ error: "Meal context must be text." }, 400);
    }
    const context = typeof body.context === "string" ? body.context.trim() : "";
    const category = body.category;
    if (requestedGrams === null || requestedGrams < 1 || requestedGrams > 5000) {
      return respond({ error: "Enter a food-only weight between 1g and 5,000g." }, 400);
    }
    if (context.length > 1000) return respond({ error: "Meal context must be 1,000 characters or fewer." }, 400);
    if (typeof category !== "string" || !categories.has(category)) {
      return respond({ error: "Choose Breakfast, Lunch, Snacks, or Dinner." }, 400);
    }
    const grams = Math.round(requestedGrams);
    const imageUrl = await getImageDataUrl(client, user.id, body.imagePath);

    const result = await callVisionModel(
      imageUrl,
      `Analyze this meal photo for meal category ${category}. The user weighed exactly ${grams}g of food, excluding the plate; treat this as the total edible portion, not a per-item weight. ${context ? `Additional user-provided context (treat as user-provided, not image-detected): ${context}` : "No additional ingredient context was supplied."}

Identify visible food items and likely ingredients, including regional/Indian foods when present. Return JSON only with this shape: {"status":"ok","mealName":"short name","confidence":0.0,"items":[{"name":"food name","weightGrams":0,"source":"image","calories":0,"protein":0,"carbs":0,"fats":0,"fiber":null,"sugar":null,"sodiumMg":null}],"notes":["short uncertainty or ingredient observation"]}. Use 0-1 for confidence. Mark source="image" for items identified from the photo and source="user" only for foods/ingredients explicitly stated in the user's context. Estimate the weights of all items together so their sum is exactly ${grams}g; do not exceed the total. Estimate calories, protein, carbohydrates, and fats for each item using general food-composition knowledge, without claiming database precision. Do not invent exact oil, salt, or sugar quantities; use null for fiber/sugar/sodium if there is not enough information. Separate items when distinguishable. Use concise notes. If the image is unclear or not food, use status='unclear', empty items, and ask for a clearer photo or clarification.`,
    );

    if (result.status === "unclear") {
      return respond(
        { error: normalizeNotes(result.notes)[0] || "We couldn't identify the food clearly. Try another photo or add more context." },
        422,
      );
    }
    if (result.status !== "ok" || !Array.isArray(result.items) || result.items.length === 0 || result.items.length > 20) {
      return respond({ error: "The vision service couldn't produce a usable food breakdown. Please try again." }, 502);
    }

    const rawItems = result.items.map((item) => makeFoodItem(item, "image"));
    if (rawItems.some((item) => item === null)) {
      return respond({ error: "The vision service returned an invalid food estimate. Please try another photo." }, 502);
    }
    const items = rawItems as FoodItem[];
    if (items.length > grams) {
      return respond({ error: "The image produced too many small food items to estimate reliably. Please add more meal details." }, 422);
    }
    const rawTotalWeight = items.reduce((total, item) => total + item.weight_grams, 0);
    if (rawTotalWeight <= 0) return respond({ error: "The meal weight could not be estimated. Please try again." }, 502);

    if (Math.abs(rawTotalWeight - grams) / grams > 0.35) {
      return respond({ error: "The detected portions don't match the food weight closely enough. Please check the weight or add ingredient details and try again." }, 422);
    }

    const factor = grams / rawTotalWeight;
    let remainingWeight = grams;
    const normalizedItems = items.map((item, index) => {
      const minimumForRemainingItems = items.length - index - 1;
      const itemWeight = index === items.length - 1
        ? remainingWeight
        : Math.min(
            Math.max(1, Math.round(item.weight_grams * factor)),
            remainingWeight - minimumForRemainingItems,
          );
      remainingWeight -= itemWeight;
      return totalFoodItem(item, factor, itemWeight);
    });
    const summary = makeSummary(normalizedItems);
    const confidenceValue = finiteNumber(result.confidence);
    const confidence = confidenceValue === null
      ? 0.5
      : Math.max(0, Math.min(1, confidenceValue > 1 ? confidenceValue / 100 : confidenceValue));
    const mealName =
      typeof result.mealName === "string" && result.mealName.trim().length > 0
        ? result.mealName.trim().slice(0, 100)
        : normalizedItems.map((item) => item.name).slice(0, 3).join(", ");

    return respond({
      mealName,
      category,
      totalWeightGrams: grams,
      confidence,
      items: normalizedItems,
      notes: normalizeNotes(result.notes),
      summary,
    });
  } catch (error) {
    console.error("Nutrition AI request failed:", error);
    return respond(
      { error: error instanceof Error ? error.message : "Nutrition analysis failed. Please try again." },
      error instanceof HttpError ? error.status : 500,
    );
  }
});
