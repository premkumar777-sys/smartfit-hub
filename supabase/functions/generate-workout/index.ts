// SmartFit Hub - AI Workout Generator Edge Function
// Uses Lovable AI Gateway (auto-provisioned, no API key required)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { age, weight, height, bmi, goal, customPrompt } = await req.json();

        // Get Lovable API key (auto-provisioned)
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

        if (!LOVABLE_API_KEY) {
            console.error("LOVABLE_API_KEY is not configured");
            return new Response(
                JSON.stringify({ error: "AI service not configured. Please ensure Lovable Cloud is enabled." }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Support custom prompts for chatbot mode
        let prompt: string;
        let systemMessage: string;

        // Check for chat mode (customPrompt is set and is a non-empty string)
        const isChatMode = typeof customPrompt === 'string' && customPrompt.trim().length > 0;

        if (isChatMode) {
            // Chat mode - use custom prompt directly with conversational AI
            prompt = customPrompt;
            systemMessage = `You are SmartFit AI, a friendly and knowledgeable fitness coach. You're like a supportive gym buddy who happens to be an expert.

Your personality:
- Be warm, friendly, and encouraging - respond to greetings naturally ("Hey! Great to hear from you!" etc.)
- Use casual, conversational language with occasional emojis 💪
- Give concise, helpful answers (2-3 paragraphs max)
- Be motivating and positive
- Use bullet points for lists when helpful

Your expertise:
- Workout techniques and exercises
- Nutrition and meal planning  
- Fitness motivation and mindset
- Recovery and rest
- Form guidance

Important: You can chat about anything fitness-related, answer greetings, and have natural conversations. You're not just a workout generator - you're a helpful fitness friend!`;
            console.log("Processing chat message");
        } else {
            // Workout generation mode
            console.log("Generating workout plan for:", { age, weight, height, bmi, goal });
            systemMessage = "You are an expert fitness trainer who creates personalized workout plans.";
            prompt = `You are an expert fitness trainer. Create a personalized, safe, and effective workout plan.

User Profile:
- Age: ${age} years
- Weight: ${weight} kg
- Height: ${height} cm
- BMI: ${bmi}
- Fitness Goal: ${goal}

Create a comprehensive weekly workout plan that includes:
1. Brief fitness assessment based on BMI and goals
2. Weekly schedule (which days, which exercises)
3. Sets, reps, and rest periods for each exercise
4. Safety tips and progression advice
5. Expected timeline for results

Format the plan clearly with markdown headings and bullet points.
Keep it practical, achievable, and motivating.`;
        }

        // Call Lovable AI Gateway
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash",
                messages: [
                    { role: "system", content: systemMessage },
                    { role: "user", content: prompt }
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Lovable AI error:", response.status, errorText);

            if (response.status === 429) {
                return new Response(
                    JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
                    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            if (response.status === 402) {
                return new Response(
                    JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
                    { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            return new Response(
                JSON.stringify({ error: "Failed to generate workout plan. Please try again." }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const data = await response.json();
        const workoutPlan = data.choices?.[0]?.message?.content;

        if (!workoutPlan) {
            console.error("No workout plan in response:", data);
            return new Response(
                JSON.stringify({ error: "No workout plan generated. Please try again." }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("Successfully generated workout plan");

        return new Response(
            JSON.stringify({ workoutPlan }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in generate-workout function:", error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
