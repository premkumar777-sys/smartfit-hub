import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const VAPID_PUBLIC_KEY =
  Deno.env.get("VAPID_PUBLIC_KEY") ||
  "BH79WHgkFoMF6I5hs9JKPHVt1NTbWAs5IhNXbY6duWWIOZaxZzp-B21GW-tHAYbIwoEAuCY6v9-4juXBCG4v2_c";
const VAPID_PRIVATE_KEY =
  Deno.env.get("VAPID_PRIVATE_KEY") ||
  "2-y_flcE49TqwTs9gjXEjalGtLf4HFZNUS_ig56dLhY";
const VAPID_SUBJECT =
  Deno.env.get("VAPID_SUBJECT") || "mailto:contact@smartfitai.in";

// Configure web-push with VAPID credentials
try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.warn("[send-push-notification] Failed to configure VAPID details:", e);
}

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

/**
 * Dispatch encrypted Web Push packet via VAPID (RFC 8291 / 8292)
 */
async function dispatchPushToDevice(subscription: any, payload: PushPayload) {
  if (!subscription || !subscription.endpoint) {
    return { success: false, reason: "Invalid subscription structure" };
  }

  try {
    const response = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      {
        TTL: 86400, // 24 hours
        urgency: "high",
      }
    );
    return { success: true, statusCode: response.statusCode };
  } catch (err: any) {
    console.error("[send-push-notification] Dispatch error:", err?.statusCode, err?.message);
    const isExpired = err?.statusCode === 404 || err?.statusCode === 410;
    return {
      success: false,
      statusCode: err?.statusCode || 500,
      expired: isExpired,
      error: err?.message || "Delivery failed",
    };
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action = "daily_cron", userId, customTitle, customBody, targetUrl = "/app/today" } = body;

    console.log(`[send-push-notification] Processing action=${action}, userId=${userId}`);

    // Action 1: Immediate Test or Direct Push for a specific user
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

      if (subError || !subData || !subData.subscription) {
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

      // Physically dispatch encrypted Web Push via VAPID
      const dispatchResult = await dispatchPushToDevice(subData.subscription, payload);

      // Clean up if subscription expired on Google / Mozilla gateway
      if (dispatchResult.expired) {
        console.log(`[send-push-notification] Removing expired subscription for user ${userId}`);
        await supabase
          .from("user_push_subscriptions")
          .delete()
          .eq("user_id", userId);
      } else {
        await supabase
          .from("user_push_subscriptions")
          .update({ last_notified_at: new Date().toISOString() })
          .eq("user_id", userId);
      }

      return new Response(
        JSON.stringify({
          success: dispatchResult.success,
          dispatchResult,
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
        if (!sub.subscription) continue;

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

        const payload: PushPayload = {
          title: reminder.title,
          body: reminder.body,
          icon: "/pwa-192x192.png",
          badge: "/favicon.png",
          data: { url: "/app/today" },
        };

        // Physically dispatch encrypted Web Push via VAPID
        const dispatchResult = await dispatchPushToDevice(sub.subscription, payload);

        if (dispatchResult.expired) {
          await supabase.from("user_push_subscriptions").delete().eq("id", sub.id);
        } else {
          await supabase
            .from("user_push_subscriptions")
            .update({
              last_notified_at: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("id", sub.id);
        }

        results.push({
          userId: sub.user_id,
          name: athleteName,
          title: reminder.title,
          success: dispatchResult.success,
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
