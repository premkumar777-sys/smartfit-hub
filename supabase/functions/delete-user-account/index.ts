import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Verify user identity using user token
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired session. Please sign in again." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { confirmationPhrase, password } = await req.json().catch(() => ({}));

    // If password provided, verify it
    if (password) {
      const { error: pwdError } = await userClient.auth.signInWithPassword({
        email: user.email!,
        password,
      });
      if (pwdError) {
        return new Response(JSON.stringify({ error: "Incorrect password. Account deletion aborted." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (confirmationPhrase !== "DELETE") {
      return new Response(JSON.stringify({ error: 'Please enter "DELETE" to confirm permanent account removal.' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Admin client with service_role privileges to purge user data
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userId = user.id;

    console.log(`[AccountDeletion] Initiating full data purge for user ${userId} (${user.email})`);

    // A. Clean up storage files (nutrition photos, avatar, etc.)
    try {
      const { data: files } = await adminClient.storage.from("nutrition-images").list(userId);
      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${userId}/${f.name}`);
        await adminClient.storage.from("nutrition-images").remove(filePaths);
      }
    } catch (storageErr) {
      console.warn("[AccountDeletion] Storage cleanup notice:", storageErr);
    }

    // B. Delete records from database tables
    await adminClient.from("user_push_subscriptions").delete().eq("user_id", userId);
    await adminClient.from("cookie_consent_logs").delete().eq("user_id", userId);
    await adminClient.from("nutrition_logs").delete().eq("user_id", userId);
    await adminClient.from("completed_workouts").delete().eq("user_id", userId);
    await adminClient.from("workout_sessions").delete().eq("user_id", userId);
    await adminClient.from("subscriptions").delete().eq("user_id", userId);
    await adminClient.from("gym_event_registrations").delete().eq("user_id", userId);
    await adminClient.from("profiles").delete().eq("id", userId);

    // C. Permanently delete user from Supabase Auth
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("[AccountDeletion] Failed to delete auth user:", deleteAuthError);
      throw deleteAuthError;
    }

    console.log(`[AccountDeletion] User ${userId} successfully purged from auth and database.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Your SmartFit AI account and all associated data have been permanently deleted.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[AccountDeletion] Error processing account deletion:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process account deletion request." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
