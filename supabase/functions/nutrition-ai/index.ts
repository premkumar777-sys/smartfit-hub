import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Missing authorization header" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { 
                global: { headers: { Authorization: authHeader } },
                auth: { persistSession: false } 
            }
        );

        // Get user from token
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            console.error("Auth error:", userError);
            return new Response(
                JSON.stringify({ error: "Invalid token or user not found" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const body = await req.json();
        const { type } = body;

        // Get Groq API key
        let GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";

        if (!GROQ_API_KEY) {
            console.log("GROQ_API_KEY environment variable not found, trying user profile fallback...");
            const { data: profile } = await supabaseClient
                .from("profiles")
                .select("preferences")
                .eq("id", user.id)
                .single();
            
            GROQ_API_KEY = (profile?.preferences as any)?.groq_api_key || "";
        }

        if (GROQ_API_KEY) {
            GROQ_API_KEY = GROQ_API_KEY.replace(/^["']|["']$/g, '').trim();
        }

        if (!GROQ_API_KEY) {
            console.error("GROQ_API_KEY is not configured");
            return new Response(
                JSON.stringify({ error: "AI Assistant Unavailable. Please add your Groq API key in Settings or .env" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        let responseBody: any;
        if (type === 'scan') {
            const { query } = body;
            if (!query) {
                return new Response(
                    JSON.stringify({ error: "Query is required for scan type" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
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

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Groq API Error: ${response.status} - ${errText}`);
            }

            const data = await response.json();
            responseBody = JSON.parse(data.choices[0].message.content);
        } else if (type === 'meal-plan') {
            const { calories, protein, carbs, fats, dietaryPreference } = body;
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "system",
                            content: `You are a high-performance Nutrition AI. Create a detailed 1-day meal plan for a user with the following targets:
Calories: ${calories} kcal
Protein: ${protein}g
Carbs: ${carbs}g
Fats: ${fats}g
Dietary Preference: ${dietaryPreference.toUpperCase()}

FORMAT:
- Breakfast (Time, Name, Macros, Ingredients)
- Lunch (Time, Name, Macros, Ingredients)
- Snack (Time, Name, Macros, Ingredients)
- Dinner (Time, Name, Macros, Ingredients)

Keep it highly professional, science-based, and appetizing.`
                        },
                        {
                            role: "user",
                            content: `Generate a ${dietaryPreference} meal plan for today.`
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Groq API Error: ${response.status} - ${errText}`);
            }

            const data = await response.json();
            responseBody = { mealPlan: data.choices[0].message.content };
        } else {
            return new Response(
                JSON.stringify({ error: "Invalid request type" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify(responseBody),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in nutrition-ai function:", error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
