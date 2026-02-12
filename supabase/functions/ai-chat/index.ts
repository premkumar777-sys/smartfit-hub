// SmartFit Hub - AI Chat Edge Function
// Dedicated chatbot for conversational AI trainer

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemMessage = `You are SmartFit AI, a friendly and knowledgeable fitness coach. You're like a supportive gym buddy who happens to be an expert.

Your personality:
- Be warm, friendly, and encouraging
- Respond to greetings naturally ("Hey! Great to hear from you!", "Hi there! How can I help you today?")
- Use casual, conversational language with occasional emojis 💪
- Keep responses concise (2-3 short paragraphs max)
- Be motivating and positive

Your expertise:
- Workout techniques and exercises
- Nutrition and meal planning
- Fitness motivation and mindset
- Recovery and rest
- Form guidance

IMPORTANT RULES:
- When someone says "hi", "hello", "hey" etc - just greet them back warmly! Don't ask for profile data.
- Only provide workout plans when specifically asked for one
- Keep responses short and friendly for casual chat
- You can chat about anything fitness-related naturally
- You're a helpful fitness friend, NOT a form that needs to be filled out`;

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { message, conversationHistory } = await req.json();

        // Use Lovable AI Gateway
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

        if (!LOVABLE_API_KEY) {
            console.error("LOVABLE_API_KEY is not configured");
            return new Response(
                JSON.stringify({ error: "AI service not configured." }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("Processing chat message:", message?.substring(0, 50));

        // Build messages array for OpenAI-compatible API
        const messages = [
            { role: "system", content: systemMessage }
        ];

        // Add conversation history if provided
        if (conversationHistory && Array.isArray(conversationHistory)) {
            for (const msg of conversationHistory.slice(-6)) {
                messages.push({
                    role: msg.role === "user" ? "user" : "assistant",
                    content: msg.content
                });
            }
        }

        // Add current user message
        messages.push({
            role: "user",
            content: message || "Hi"
        });

        console.log("Calling Lovable AI Gateway...");

        // Call Lovable AI Gateway
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash",
                messages: messages,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Lovable AI Gateway error:", response.status, errorText);

            if (response.status === 429) {
                return new Response(
                    JSON.stringify({ error: "Taking a quick breather! Try again in a moment. 💪" }),
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
                JSON.stringify({ error: "Oops! I'm having a moment. Try again?" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;

        if (!reply) {
            console.error("No reply in response:", JSON.stringify(data));
            return new Response(
                JSON.stringify({ error: "I'm at a loss for words! Try asking again." }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("Successfully generated reply");

        return new Response(
            JSON.stringify({ reply }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in chat function:", error);
        return new Response(
            JSON.stringify({ error: "Something went wrong. Let's try that again!" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
