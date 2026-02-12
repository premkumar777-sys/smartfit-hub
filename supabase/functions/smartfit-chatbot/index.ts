// SmartFit AI Chatbot - Powered by Lovable AI
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
- Reference SmartFit features when relevant

IMPORTANT RULES:
- Never give medical advice - suggest consulting professionals for health concerns
- Focus on sustainable, science-based fitness principles
- Be realistic about timelines and expectations
- Encourage consistency over perfection

ABOUT SMARTFIT:
- AI-powered workout generator for personalized plans
- Nutrition tracking and macro calculations
- Progress monitoring and analytics
- Community features and gamification
- Free access to all core features`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();

    console.log("Processing chatbot message:", message?.substring(0, 50));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({
          reply: "I'm having trouble connecting right now. Please try again in a moment! 🙏"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history (last 10 messages for context)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }

    // Add current user message
    messages.push({
      role: "user",
      content: message || "Hello",
    });

    console.log("Calling Lovable AI Gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash",
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            reply: "I'm getting a lot of questions right now! Please try again in a moment. 💪"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            reply: "The AI service needs attention from the admin. Please try again later! 🙏"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("Empty response from Lovable AI:", JSON.stringify(data));
      throw new Error("Empty response from AI");
    }

    console.log("Chatbot reply generated successfully");

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in chatbot function:", error);
    return new Response(
      JSON.stringify({
        reply: "I'm having trouble processing your message right now. Please try again in a moment! 🙏"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
