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

  const primaryModel = Deno.env.get("GROQ_VISION_MODEL")?.trim() || "llama-3.2-11b-vision-preview";
  const fallbackModel = primaryModel === "llama-3.2-11b-vision-preview" ? "llama-3.2-90b-vision-preview" : "llama-3.2-11b-vision-preview";

  const tryRequest = async (modelName: string) => {
    return await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        temperature: 0.1,
        max_completion_tokens: 2000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an expert sports nutritionist and precision culinary vision AI. Return valid JSON only. Accurately identify foods, preparation methods, cooking styles (fried, grilled, boiled, curry with oil), and realistic portion sizes. You possess deep culinary expertise across Indian/South Asian dishes (rotis, chapati, naan, paratha, dal varieties, biryani, paneer, dosa, idli, sambar, poha, upma, curries) as well as global fitness staples (chicken breast, eggs, brown/white rice, oatmeal, whey protein, peanut butter, salads, avocado, salmon, beef). Deconstruct mixed meals into discrete food items with realistic weights in grams and accurate macros.\n\nCRITICAL NON-FOOD / INEDIBLE GUARDRAIL:\nFirst, strictly verify if the photo shows edible food or beverages prepared for human consumption. If the image depicts non-food objects (e.g. plastic, packaging with no visible food, wood, furniture, tree leaves / house plants / foliage not prepared as food, metal, paper, toys, shoes, electronics, pets/animals, empty plates/tables, or people without food), you MUST return:\n{\"status\":\"not_food\",\"reason\":\"[Specific friendly explanation: e.g. '🚫 That looks like plastic or packaging rather than edible food. Please snap a picture of your actual meal!' or '🌿 We detected tree leaves or foliage! Unless this is leafy greens or salad, please scan edible food.' or '🪵 That looks like wood or an everyday object. SmartFit AI only calculates macros for edible food and drinks.']\",\"items\":[],\"notes\":[]}.\nIf the photo is too dark or blurry to identify anything, return status='unclear' with a request for a clearer photo.",
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
  };

  let response = await tryRequest(primaryModel);
  if (!response.ok && (response.status === 404 || response.status === 400 || response.status === 429 || response.status === 503)) {
    console.warn(`Vision model ${primaryModel} returned HTTP ${response.status}, attempting fallback to ${fallbackModel}...`);
    try {
      const fallbackRes = await tryRequest(fallbackModel);
      if (fallbackRes.ok) response = fallbackRes;
    } catch (_) {}
  }

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
    const hasUserWeight = requestedGrams !== null && requestedGrams >= 1 && requestedGrams <= 5000;
    const grams = hasUserWeight ? Math.round(requestedGrams) : null;

    if (body.context !== undefined && typeof body.context !== "string") {
      return respond({ error: "Meal context must be text." }, 400);
    }
    const context = typeof body.context === "string" ? body.context.trim() : "";
    const category = body.category;
    if (context.length > 1000) return respond({ error: "Meal context must be 1,000 characters or fewer." }, 400);
    if (typeof category !== "string" || !categories.has(category)) {
      return respond({ error: "Choose Breakfast, Lunch, Snacks, or Dinner." }, 400);
    }

    const imageUrl = await getImageDataUrl(client, user.id, body.imagePath);

    const promptText = hasUserWeight
      ? `Analyze this meal photo for meal category ${category}. The user weighed exactly ${grams}g of edible food (excluding plate). ${context ? `User context: ${context}` : ""}

Identify visible food items, preparation style, and ingredients with precision, including Indian regional dishes (dal, roti, chapati, rice, sabzi, paneer, dosa, idli, biryani) and global fitness nutrition. Return valid JSON only: {"status":"ok","mealName":"short descriptive name","confidence":0.0,"items":[{"name":"food name","weightGrams":0,"source":"image","calories":0,"protein":0,"carbs":0,"fats":0,"fiber":null,"sugar":null,"sodiumMg":null}],"notes":["short actionable fitness or nutritional tip"]}. Distribute the food items so their total weights approximately sum to ${grams}g. Mark source="image" for foods in photo, source="user" only for foods specified exclusively in user context. Provide 1-2 concise fitness or nutritional observations in notes. If photo is unclear or not food, return status='unclear', empty items.`
      : `Analyze this meal photo for meal category ${category}. The user did NOT use a kitchen scale. You must VISUALLY ESTIMATE the portion size and weight (in grams) for each item on the plate based on standard visual references:
- 1 standard roti / chapati: ~35-40g (100-120 kcal, 3g P, 20g C, 2g F)
- 1 medium katori / bowl of dal or curry: ~150g (120-180 kcal)
- 1 cup cooked white or brown rice: ~150-180g (190-230 kcal, 4g P, 45g C)
- 1 medium chicken breast (cooked): ~150g (240 kcal, 45g P, 4g F)
- 1 whole egg: ~50g (75 kcal, 6g P, 5g F), 1 egg white: ~33g
- 1 medium dosa: ~100-120g (160-200 kcal), 2 idlis: ~100g total
- 1 serving paneer dish / bhurji: ~120-150g
- 1 plate biryani / fried rice: ~300-350g (450-600 kcal)
- Salads / raw veggies: ~80-120g per bowl
${context ? `Additional user-provided context: ${context}` : ""}

Accurately identify each food item, estimate its realistic weight in grams, and compute calories, protein, carbs, fats, fiber, and sodium. Return valid JSON only: {"status":"ok","mealName":"short descriptive name","confidence":0.0,"items":[{"name":"food name","weightGrams":0,"source":"image","calories":0,"protein":0,"carbs":0,"fats":0,"fiber":null,"sugar":null,"sodiumMg":null}],"notes":["short actionable fitness or nutritional tip"]}. Use 0-1 for confidence. Provide 1-2 concise fitness or nutritional observations in notes. If the photo is unclear or does not show food, return status='unclear', empty items, and ask for a clearer photo.`;

    const result = await callVisionModel(imageUrl, promptText);

    if (result.status === "not_food") {
      const reason =
        typeof result.reason === "string" && result.reason.trim()
          ? result.reason.trim()
          : normalizeNotes(result.notes)[0] || "No edible food or drink was detected in this photo. Please snap a picture of your meal!";
      return respond({ error: reason }, 422);
    }

    if (result.status === "unclear") {
      return respond(
        { error: normalizeNotes(result.notes)[0] || "We couldn't identify the food clearly. Please take a clearer photo with good lighting." },
        422,
      );
    }
    if (result.status !== "ok" || !Array.isArray(result.items) || result.items.length === 0 || result.items.length > 20) {
      return respond({ error: "No food items were recognized in this photo. Please scan an edible meal or beverage." }, 422);
    }

    const rawItems = result.items.map((item) => makeFoodItem(item, "image"));
    if (rawItems.some((item) => item === null)) {
      return respond({ error: "The vision service returned an invalid food estimate. Please try another photo." }, 502);
    }
    const items = rawItems as FoodItem[];
    const rawTotalWeight = items.reduce((total, item) => total + item.weight_grams, 0);
    if (rawTotalWeight <= 0) return respond({ error: "The meal weight could not be estimated. Please try again." }, 502);

    let normalizedItems: FoodItem[];
    let finalTotalWeight: number;

    if (hasUserWeight && grams !== null) {
      // User entered exact kitchen scale weight: scale items to match total smoothly
      finalTotalWeight = grams;
      const factor = grams / rawTotalWeight;
      let remainingWeight = grams;
      normalizedItems = items.map((item, index) => {
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
    } else {
      // Auto-portion estimation from visual model
      finalTotalWeight = Math.round(rawTotalWeight);
      normalizedItems = items;
    }

    const summary = makeSummary(normalizedItems);
    const confidenceValue = finiteNumber(result.confidence);
    const confidence = confidenceValue === null
      ? 0.75
      : Math.max(0, Math.min(1, confidenceValue > 1 ? confidenceValue / 100 : confidenceValue));
    const mealName =
      typeof result.mealName === "string" && result.mealName.trim().length > 0
        ? result.mealName.trim().slice(0, 100)
        : normalizedItems.map((item) => item.name).slice(0, 3).join(", ");

    return respond({
      mealName,
      category,
      totalWeightGrams: finalTotalWeight,
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
