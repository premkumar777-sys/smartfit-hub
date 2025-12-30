// SmartFit AI Chatbot - Simple Response System
// Provides helpful responses for SmartFit Hub without external API dependencies

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple response database
const responses: Record<string, string[]> = {
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
    "Weight loss success: 80% nutrition, 20% exercise. Track calories, eat protein-rich meals with veggies, and stay active. Use our nutrition calculator! 📊",
    "Belly fat responds well to HIIT workouts, core exercises, and reducing processed foods. Aim for sustainable changes - quick fixes don't last! 💪",
    "Healthy fat loss: 0.5-1kg per week. Focus on whole foods, adequate protein, and regular cardio. Track progress in our dashboard! 📈"
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

function getResponseType(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Check for greetings first
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey") ||
      (lowerMessage.trim().length < 10 && !lowerMessage.includes(" "))) {
    return "greeting";
  }

  // Check for weight loss/fat loss queries
  if (lowerMessage.includes("lose") || lowerMessage.includes("weight") || lowerMessage.includes("fat") ||
      lowerMessage.includes("belly") || lowerMessage.includes("slim") || lowerMessage.includes("burn") ||
      lowerMessage.includes("reduce")) {
    return "weight_loss";
  }

  // Check for workout/exercise queries
  if (lowerMessage.includes("workout") || lowerMessage.includes("exercise") || lowerMessage.includes("train") ||
      lowerMessage.includes("gym") || lowerMessage.includes("lift") || lowerMessage.includes("cardio") ||
      lowerMessage.includes("strength") || lowerMessage.includes("muscle")) {
    return "workout";
  }

  // Check for nutrition/diet queries
  if (lowerMessage.includes("nutrition") || lowerMessage.includes("diet") || lowerMessage.includes("food") ||
      lowerMessage.includes("eat") || lowerMessage.includes("meal") || lowerMessage.includes("calorie") ||
      lowerMessage.includes("protein") || lowerMessage.includes("carb")) {
    return "nutrition";
  }

  // Check for feature/app queries
  if (lowerMessage.includes("feature") || lowerMessage.includes("app") || lowerMessage.includes("smartfit") ||
      lowerMessage.includes("how to") || lowerMessage.includes("tutorial")) {
    return "features";
  }

  // Check for general fitness/health queries
  if (lowerMessage.includes("fitness") || lowerMessage.includes("health") || lowerMessage.includes("strong") ||
      lowerMessage.includes("fit") || lowerMessage.includes("body") || lowerMessage.includes("build")) {
    return "fitness";
  }

  // Questions starting with how/what/can
  if (lowerMessage.startsWith("how") || lowerMessage.startsWith("what") || lowerMessage.startsWith("can") ||
      lowerMessage.includes("help")) {
    return "help";
  }

  // Default to fitness for general queries
  if (lowerMessage.length > 5) {
    return "fitness";
  }

  return "help"; // Final fallback
}

function getRandomResponse(type: string): string {
  const typeResponses = responses[type] || responses.help;
  return typeResponses[Math.floor(Math.random() * typeResponses.length)];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();

    console.log("Processing chatbot message:", message?.substring(0, 50));

    // Get appropriate response based on message content
    const responseType = getResponseType(message || "");
    const reply = getRandomResponse(responseType);

    console.log("Generated chatbot reply for type:", responseType);

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
