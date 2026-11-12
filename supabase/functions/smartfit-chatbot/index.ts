import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const buildSystemPrompt = (userContext?: Record<string, any>) => {
  let contextBlock = "";
  if (userContext && userContext.isAuthenticated) {
    contextBlock = `
CURRENT LOGGED-IN ATHLETE PROFILE & STATS:
- Athlete Name: ${userContext.name || "Athlete"}
- Current Fitness Goal: ${userContext.goal || "Custom Transformation"}
- Daily Calorie Target: ${userContext.dailyCalories ? `${userContext.dailyCalories} kcal` : "Calibrated dynamically"}
- Daily Protein Target: ${userContext.proteinTarget ? `${userContext.proteinTarget}g` : "Calibrated dynamically"}
- Weekly Training Schedule: ${userContext.scheduleDays ? `${userContext.scheduleDays} days/week` : "Flexible"}
- Workouts Completed This Week: ${userContext.completedWorkoutsThisWeek ?? 0}
- Active Streak: ${userContext.streak ?? 1} Day(s)
- Athlete Gamification Level: Level ${userContext.level ?? 65} (${userContext.xp ?? 19265} XP)
- Today's Scheduled Workout: ${userContext.todayWorkout || "Custom Split"}
- Active Plan Initialized: ${userContext.hasActivePlan ? "Yes" : "No"}

IMPORTANT PERSONALIZATION RULES:
1. When the athlete asks "What is my last week progress?" or "How am I doing?", reference their actual stats above (e.g. Completed ${userContext.completedWorkoutsThisWeek ?? 0} sessions, Streak of ${userContext.streak ?? 1} day, Level ${userContext.level ?? 65}, calorie target ${userContext.dailyCalories} kcal). Provide specific feedback on their consistency and recovery.
2. When the athlete asks about their nutrition, cite their exact calibrated calories (${userContext.dailyCalories} kcal) and protein target (${userContext.proteinTarget}g).
3. If they ask about today's workout, refer to "${userContext.todayWorkout}".
`;
  } else {
    contextBlock = `
CURRENT ATHLETE: Guest / Exploring user (Not yet logged in or calibrated).
- If they ask about generating a plan or their progress, explain that they can generate an AI-tailored plan in 60 seconds through the 5-step SmartFit assessment at /onboarding/basics.
`;
  }

  return `You are SmartFit AI, the official AI Fitness Coach & Intelligent Training System for SmartFit AI.
You are enthusiastic, authoritative, highly structured, and knowledgeable about all SmartFit AI platform capabilities.

${contextBlock}

ABOUT SMARTFIT AI PLATFORM (WHAT WE ARE & HOW TO USE):
1. WHAT IS SMARTFIT AI?
   - SmartFit AI is a next-generation cyber-athletic personal training platform combining real-time computer vision, 3D biomolecular biomechanics, and personalized exercise/nutrition programming.
   - Core Features:
     • MoveNet AI Pose Engine (/ai-trainer): Real-time 60 FPS skeletal keypoint detection via camera for live rep counting and form flaw alerts.
     • 3D Animated Trainer (/3d-trainer): 15 interactive 3D exercise video demonstrations with angle guidance and voice coaching (camera-free).
     • Smart Workout Generator (/ai-workout): Tailors gym and home splits based on equipment, body metrics, and training frequency.
     • Dynamic Macro Engine (/nutrition): Calculates exact Mifflin-St Jeor TDEE, macro split, and hydration needs.
     • Athlete Dashboard (/dashboard): Daily workout schedule, streak tracking, water logging, and gym check-ins.
     • Progress & Gamification (/app/progress): XP, level ups, streak milestones, and workout history.

2. HOW TO GENERATE PLANS:
   - Step 1: Open the onboarding assessment at /onboarding/basics.
   - Step 2: Choose biological sex and primary goal (Fat Loss, Muscle Building, Athletic Conditioning, or Strength).
   - Step 3: Select weekly commitment (3, 4, 5, or 6 days per week).
   - Step 4: Enter body metrics (age, height, weight) for Mifflin-St Jeor basal metabolic calibration.
   - Step 5: Receive a personalized 7-day periodized split with daily calorie and protein targets (/onboarding/first-week).

CRITICAL STYLE RULES:
1. STRICTLY NO EMOJIS: Do NOT output any emojis under any circumstances. Keep responses completely clean of all emojis.
2. HIGHLY STRUCTURED: Always organize responses with bold markdown headers (## and ###) and numbered or bulleted lists. Never output dense walls of text.
3. CONCISE & ACTIONABLE: Provide direct, professional answers with app navigation tips where appropriate.`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, userContext } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please add GROQ_API_KEY to secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = buildSystemPrompt(userContext);
    const messages = [{ role: "system", content: systemPrompt }];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }

    messages.push({ role: "user", content: message || "Hello" });

    // Query Groq models dynamically so we always use an active model for this key
    let selectedModel = Deno.env.get("GROQ_MODEL") || "llama-3.3-70b-versatile";
    try {
      const modelsRes = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      });
      if (modelsRes.ok) {
        const modelsJson = await modelsRes.json();
        const availableModels: string[] = (modelsJson.data || []).map((m: { id: string }) => m.id);
        if (availableModels.length > 0 && !availableModels.includes(selectedModel)) {
          const preferred =
            availableModels.find((id) => id.includes("llama-3.3") || id.includes("llama3") || id.includes("70b")) ||
            availableModels.find((id) => (id.includes("llama") || id.includes("mixtral") || id.includes("qwen") || id.includes("gpt")) && !id.includes("guard") && !id.includes("whisper")) ||
            availableModels.find((id) => !id.includes("whisper") && !id.includes("guard")) ||
            availableModels[0];
          if (preferred) {
            console.log(`Auto-selected model from ${selectedModel} to ${preferred}`);
            selectedModel = preferred;
          }
        }
      }
    } catch (e) {
      console.warn("Could not query Groq models list:", e);
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        stream: true,
        max_tokens: 650,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits needed. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI service error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in smartfit-chatbot:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
