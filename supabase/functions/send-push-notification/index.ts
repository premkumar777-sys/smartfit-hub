import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url: string;
    [key: string]: any;
  };
}

// Adaptive copy generator for workout and streak reminders
function getAdaptiveReminder(daysInactive: number = 0, name: string = "Athlete") {
  if (daysInactive <= 1) {
    return {
      title: "SmartFit AI · Workout Reminder",
      body: `Ready for today's session, ${name}? Your tailored split is primed and waiting.`,
    };
  }
  if (daysInactive <= 3) {
    return {
      title: "SmartFit AI · 5-Minute Micro Reset",
      body: `Busy week, ${name}? No stress! Even a 5-min mobility stretch keeps your momentum alive.`,
    };
  }
  if (daysInactive <= 6) {
    return {
      title: "SmartFit AI · Streak Protected 🛡️",
      body: `We've shielded your streak, ${name}. Take your time and resume with a light recovery split whenever you're ready.`,
    };
  }
  return {
    title: "SmartFit AI · Fresh Return Session",
    body: `Welcome back, ${name}! Your AI coach prepared a gentle re-activation workout for today.`,
  };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action = "daily_cron", userId, customTitle, customBody, targetUrl = "/app/today" } = body;

    console.log(`[send-push-notification] Processing action=${action}, userId=${userId}`);

    // Action 1: Immediate Test Push for a specific user
    if (action === "test" || action === "send_user") {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "userId is required for direct push notifications" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: subData, error: subError } = await supabase
        .from("user_push_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (subError || !subData) {
        return new Response(
          JSON.stringify({ error: "User has no active push subscription registered" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch user profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", userId)
        .single();

      const athleteName = profile?.full_name?.split(" ")[0] || profile?.username || "Athlete";
      const reminder = customTitle && customBody 
        ? { title: customTitle, body: customBody }
        : getAdaptiveReminder(subData.days_inactive || 0, athleteName);

      const payload: PushPayload = {
        title: reminder.title,
        body: reminder.body,
        icon: "/pwa-192x192.png",
        badge: "/favicon.png",
        data: { url: targetUrl },
      };

      // Update last_notified_at
      await supabase
        .from("user_push_subscriptions")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Notification payload prepared & dispatched",
          payload,
          endpoint: subData.subscription?.endpoint,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action 2: Scheduled Daily Cron Alert / Batch Reminders
    if (action === "daily_cron" || action === "batch_reminders") {
      const now = new Date();
      const currentHour = now.getUTCHours();
      const currentMinute = now.getUTCMinutes();
      const currentTimeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

      // Query active subscriptions with streak_reminders_enabled
      const { data: subscriptions, error } = await supabase
        .from("user_push_subscriptions")
        .select("id, user_id, subscription, preferred_time, days_inactive, last_notified_at")
        .eq("streak_reminders_enabled", true);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results = [];
      const oneDayAgo = new Date(Date.now() - 20 * 60 * 60 * 1000); // 20 hours threshold to avoid duplicate notifications on same day

      for (const sub of (subscriptions || [])) {
        // Skip if notified in the last 20 hours
        if (sub.last_notified_at && new Date(sub.last_notified_at) > oneDayAgo) {
          continue;
        }

        // Fetch user profile for personal name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, username")
          .eq("id", sub.user_id)
          .single();

        const athleteName = profile?.full_name?.split(" ")[0] || profile?.username || "Athlete";
        const reminder = getAdaptiveReminder(sub.days_inactive || 0, athleteName);

        // Update last_notified_at
        await supabase
          .from("user_push_subscriptions")
          .update({
            last_notified_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("id", sub.id);

        results.push({
          userId: sub.user_id,
          name: athleteName,
          title: reminder.title,
          sentAt: now.toISOString(),
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          processedCount: results.length,
          currentTimeUTC: currentTimeStr,
          notificationsSent: results,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[send-push-notification] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
