// SmartFit AI Chatbot - AI-Powered Responses with Fallback
// Uses multiple AI services with intelligent fallback system

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fallback responses for when AI services are unavailable
const fallbackResponses: Record<string, string[]> = {
  greeting: [
    "Hello! 👋 I'm your SmartFit AI assistant. I'm here to help you with fitness, workouts, and nutrition advice!",
    "Hi there! Welcome to SmartFit AI! How can I help you achieve your fitness goals today?",
    "Hey! I'm excited to help you on your fitness journey. What would you like to know?"
  ],
  fitness: [
    "For beginners, start with 3-4 workout days per week, focusing on compound exercises like squats, push-ups, and rows. Consistency is key! 💪",
    "Remember to warm up before workouts and cool down afterward. Stay hydrated and listen to your body!",
    "Great job staying committed to your fitness goals! Every workout counts, no matter how small."
  ],
  workout: [
    "A good workout routine includes cardio, strength training, and flexibility work. Mix it up to keep things interesting!",
    "Try the AI Workout Generator for personalized plans based on your goals and fitness level.",
    "Remember: quality over quantity. Focus on proper form to prevent injuries and maximize results."
  ],
  nutrition: [
    "Focus on whole foods: lean proteins, vegetables, fruits, whole grains, and healthy fats. Stay hydrated with water!",
    "Track your nutrition to understand your calorie needs. Use the nutrition calculator for personalized recommendations.",
    "Meal timing matters, but consistency with healthy eating is more important than perfection."
  ],
  weight_loss: [
    "To lose belly fat, focus on overall body fat reduction through cardio, strength training, and clean eating. Spot reduction isn't possible, but consistency works! 🎯",
    "For fat loss, create a 500-calorie daily deficit through diet and exercise. Combine cardio (30-45 mins) with strength training 3x/week. Stay consistent! 🏃‍♂️",
    "Weight loss success: 80% nutrition, 20% exercise. Track calories, eat protein-rich meals with veggies, and stay active. Use our nutrition calculator! 📊"
  ],
  features: [
    "SmartFit AI offers AI-powered workout generation, nutrition tracking, progress monitoring, and gamification features!",
    "Try the AI Workout Generator, nutrition calculator, or explore our training guides for expert advice.",
    "All features are available for free! Explore the dashboard, progress tracking, and workout sessions."
  ],
  help: [
    "I'm here to help! Ask me about workouts, nutrition, fitness tips, or how to use SmartFit AI features.",
    "Need workout ideas? Nutrition advice? Or help navigating the app? Just ask!",
    "Don't hesitate to reach out for any fitness-related questions. I'm here to support your journey!"
  ]
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

// Multiple AI service configurations
const AI_SERVICES = [
  {
    name: "Lovable AI",
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    headers: (apiKey: string) => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    body: (messages: any[], model?: string) => ({
      model: model || "google/gemini-2.5-flash",
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
    envKey: "LOVABLE_API_KEY"
  },
  {
    name: "OpenAI",
    url: "https://api.openai.com/v1/chat/completions",
    headers: (apiKey: string) => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    body: (messages: any[], model?: string) => ({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 600,
      temperature: 0.8,
    })
    envKey: "OPENAI_API_KEY"
  },
  {
    name: "HuggingFace",
    url: "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
    headers: (apiKey: string) => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    body: (messages: any[]) => ({
      inputs: {
        past_user_inputs: messages.slice(0, -1).map(m => m.content),
        generated_responses: [],
        text: messages[messages.length - 1]?.content || ""
      },
      parameters: {
        max_length: 500,
        temperature: 0.7
      }
    }),
    envKey: "HUGGINGFACE_API_KEY"
  }
];

async function callAIService(service: any, messages: any[]): Promise<string | null> {
  try {
    const apiKey = Deno.env.get(service.envKey);

    if (!apiKey) {
      console.log(`${service.name} API key not configured`);
      return null;
    }

    console.log(`Trying ${service.name} service with key: ${apiKey.substring(0, 10)}...`);

    const response = await fetch(service.url, {
      method: "POST",
      headers: service.headers(apiKey),
      body: JSON.stringify(service.body(messages)),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${service.name} error:`, response.status, errorText);
      return null;
    }

    const data = await response.json();

    // Handle different response formats
    let reply: string;
    if (data.choices?.[0]?.message?.content) {
      // OpenAI/Lovable format
      reply = data.choices[0].message.content;
    } else if (data.generated_text) {
      // HuggingFace format
      reply = data.generated_text;
    } else if (Array.isArray(data) && data[0]?.generated_text) {
      // Alternative HuggingFace format
      reply = data[0].generated_text;
    } else {
      console.error(`${service.name} unexpected response format:`, JSON.stringify(data));
      return null;
    }

    if (!reply || reply.trim().length === 0) {
      console.error(`${service.name} returned empty response`);
      return null;
    }

    console.log(`${service.name} successfully generated response: ${reply.substring(0, 100)}...`);
    return reply.trim();

  } catch (error) {
    console.error(`${service.name} service error:`, error);
    return null;
  }
}

function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Simple keyword matching for fallback
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return fallbackResponses.greeting[Math.floor(Math.random() * fallbackResponses.greeting.length)];
  }

  if (lowerMessage.includes("lose") || lowerMessage.includes("weight") || lowerMessage.includes("fat")) {
    return fallbackResponses.weight_loss[Math.floor(Math.random() * fallbackResponses.weight_loss.length)];
  }

  if (lowerMessage.includes("workout") || lowerMessage.includes("exercise")) {
    return fallbackResponses.workout[Math.floor(Math.random() * fallbackResponses.workout.length)];
  }

  if (lowerMessage.includes("food") || lowerMessage.includes("diet") || lowerMessage.includes("eat")) {
    return fallbackResponses.nutrition[Math.floor(Math.random() * fallbackResponses.nutrition.length)];
  }

  return fallbackResponses.help[Math.floor(Math.random() * fallbackResponses.help.length)];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();

    console.log("Processing chatbot message:", message?.substring(0, 50));

    // Build messages array for AI services
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

    let reply: string | null = null;

    // Try each AI service in order until one works
    for (const service of AI_SERVICES) {
      console.log(`Attempting to use ${service.name}...`);
      reply = await callAIService(service, messages);
      if (reply) {
        console.log(`Successfully got response from ${service.name}: ${reply.substring(0, 50)}...`);
        break;
      } else {
        console.log(`${service.name} failed, trying next service...`);
      }
    }

    // If all AI services failed, use fallback
    if (!reply) {
      console.log("All AI services failed, using fallback response");
      reply = getFallbackResponse(message || "");
    }

    console.log("Final chatbot reply generated");

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
