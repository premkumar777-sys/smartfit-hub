import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are SmartFit AI, an expert fitness coach and nutrition specialist. You're enthusiastic, knowledgeable, and incredibly helpful.

YOUR PERSONALITY:
- Energetic and motivational like a personal trainer
- Expert in fitness, nutrition, and wellness
- Use conversational language with fitness enthusiasts
- Add relevant emojis to keep it fun and engaging 🎯💪
- Always be encouraging and supportive

YOUR EXPERTISE:
- Weight loss and body composition
- Muscle building and strength training
- Cardio and endurance training
- Nutrition and meal planning
- Workout programming and progress tracking
- Injury prevention and recovery
- Fitness motivation and habit building

RESPONSE STYLE:
- Give specific, actionable advice
- Include practical examples and tips
- Keep responses engaging but informative
- Ask follow-up questions when appropriate

IMPORTANT RULES:
- Never give medical advice - suggest consulting professionals for health concerns
- Focus on sustainable, science-based fitness principles
- Be realistic about timelines and expectations
- Encourage consistency over perfection`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ reply: "I'm having trouble connecting right now. Please try again in a moment! 🙏" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ reply: "I'm getting a lot of questions right now! Please try again in a moment. 💪" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ reply: "The AI service needs attention from the admin. Please try again later! 🙏" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI service error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in chatbot function:", error);
    return new Response(
      JSON.stringify({ reply: "I'm having trouble processing your message right now. Please try again in a moment! 🙏" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
