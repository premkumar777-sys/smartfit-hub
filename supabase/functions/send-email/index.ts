import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { 
  supabase, 
  sendEmail, 
  welcomeTemplate, 
  emailVerificationTemplate, 
  forgotPasswordTemplate, 
  otpTemplate, 
  contactFormTemplate, 
  subscriptionConfirmationTemplate, 
  paymentSuccessTemplate, 
  paymentFailedTemplate, 
  trialExpiryTemplate, 
  weeklyProgressTemplate 
} from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const isServiceRole = authHeader.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "SUPER_SECRET_FALLBACK_KEY");
    
    // Parse request body
    const body = await req.json();
    const { action, email, data } = body;

    console.log(`[send-email] Received action=${action}, email=${email}, isServiceRole=${isServiceRole}`);

    // Action-specific Authorization & Execution
    switch (action) {
      
      // 1. WELCOME EMAIL (Can be triggered by user upon first dashboard load if welcome_sent = false)
      case "welcome": {
        if (!email) return new Response(JSON.stringify({ error: "Email is required" }), { status: 400, headers: corsHeaders });
        
        // 1. Verify user JWT token to authenticate welcome email request
        let userId: string;
        if (isServiceRole) {
          // Admin bypass
          const { data: profileData } = await supabase.from("profiles").select("id").eq("email", email.toLowerCase()).single();
          userId = profileData?.id;
        } else {
          // Verify user authorization token
          const token = authHeader.replace("Bearer ", "");
          const { data: { user }, error: authError } = await supabase.auth.getUser(token);
          if (authError || !user || user.email?.toLowerCase() !== email.toLowerCase()) {
            return new Response(JSON.stringify({ error: "Unauthorized user identity check failed" }), { status: 401, headers: corsHeaders });
          }
          userId = user.id;
        }

        // Check if welcome email is already sent
        const { data: profile } = await supabase.from("profiles").select("welcome_sent, username").eq("id", userId).single();
        if (profile?.welcome_sent) {
          return new Response(JSON.stringify({ success: true, message: "Welcome email already sent" }), { status: 200, headers: corsHeaders });
        }

        const username = profile?.username || data?.username || splitEmailName(email);
        const loginUrl = `${Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://smartfitai.in"}/auth`;
        const html = welcomeTemplate(username, loginUrl);
        
        const sendResult = await sendEmail({
          to: email,
          subject: "⚡ Welcome to SmartFit AI - Smarter training begins now!",
          html: html,
          type: "welcome"
        });

        if (sendResult.success) {
          // Update database profile flag
          await supabase.from("profiles").update({ welcome_sent: true }).eq("id", userId);
        }

        return new Response(JSON.stringify(sendResult), { status: sendResult.success ? 200 : 500, headers: corsHeaders });
      }

      // 2. SIGNUP OTP (Sends 6-digit confirmation code during user registration)
      case "signup-otp": {
        if (!email) return new Response(JSON.stringify({ error: "Email is required" }), { status: 400, headers: corsHeaders });

        // Generate OTP valid for 10 minutes
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Save in database
        const { error: dbError } = await supabase
          .from("email_otps")
          .upsert({
            email: email.toLowerCase(),
            otp: otp,
            expires_at: expiresAt.toISOString(),
            attempts: 0
          }, { onConflict: "email" });

        if (dbError) {
          console.error("[signup-otp] DB error:", dbError);
          return new Response(JSON.stringify({ error: "Failed to create verification code" }), { status: 500, headers: corsHeaders });
        }

        const html = emailVerificationTemplate(otp);
        const sendResult = await sendEmail({
          to: email,
          subject: "🔐 Confirm your SmartFit AI Account - Verification Code",
          html: html,
          type: "signup_verification"
        });

        return new Response(JSON.stringify(sendResult), { status: sendResult.success ? 200 : 500, headers: corsHeaders });
      }

      // 3. VERIFY SIGNUP OTP (Confirms email and registers the user profile)
      case "verify-signup-otp": {
        const { otp, username, password } = data || {};
        if (!email || !otp || !password) {
          return new Response(JSON.stringify({ error: "Missing required registration parameters" }), { status: 400, headers: corsHeaders });
        }

        // Fetch stored OTP
        const { data: otpData, error: fetchError } = await supabase
          .from("email_otps")
          .select("*")
          .eq("email", email.toLowerCase())
          .single();

        if (fetchError || !otpData) {
          return new Response(JSON.stringify({ error: "No verification code exists for this email" }), { status: 400, headers: corsHeaders });
        }

        // Check if expired
        if (new Date(otpData.expires_at) < new Date()) {
          await supabase.from("email_otps").delete().eq("email", email.toLowerCase());
          return new Response(JSON.stringify({ error: "Verification code has expired. Request a new one." }), { status: 400, headers: corsHeaders });
        }

        // Verify OTP code
        if (otpData.otp !== otp) {
          await supabase.from("email_otps").update({ attempts: otpData.attempts + 1 }).eq("email", email.toLowerCase());
          return new Response(JSON.stringify({ error: "Incorrect verification code. Please try again." }), { status: 400, headers: corsHeaders });
        }

        // OTP is valid - delete it
        await supabase.from("email_otps").delete().eq("email", email.toLowerCase());

        // Create the user profile in Supabase Auth using admin client
        const { data: authUser, error: signupError } = await supabase.auth.admin.createUser({
          email: email.toLowerCase(),
          password: password,
          email_confirm: true,
          user_metadata: { username: username || splitEmailName(email) }
        });

        if (signupError) {
          console.error("[verify-signup-otp] Create User Error:", signupError);
          return new Response(JSON.stringify({ error: signupError.message }), { status: 500, headers: corsHeaders });
        }

        // Immediately send welcome email
        const loginUrl = `${Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://smartfitai.in"}/auth`;
        const welcomeHtml = welcomeTemplate(username || splitEmailName(email), loginUrl);
        await sendEmail({
          to: email,
          subject: "⚡ Welcome to SmartFit AI - Smarter training begins now!",
          html: welcomeHtml,
          type: "welcome"
        });

        // Set welcome_sent flag to true on the newly created profile
        await supabase.from("profiles").update({ welcome_sent: true }).eq("id", authUser.user.id);

        return new Response(JSON.stringify({ success: true, message: "Account registered successfully" }), { status: 200, headers: corsHeaders });
      }

      // 4. FORGOT PASSWORD (Generates secure token and sends reset link)
      case "forgot-password": {
        if (!email) return new Response(JSON.stringify({ error: "Email is required" }), { status: 400, headers: corsHeaders });

        // Verify user exists in auth
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        if (userError) {
          console.error("[forgot-password] Auth listing error:", userError);
          return new Response(JSON.stringify({ error: "Internal Auth lookup failure" }), { status: 500, headers: corsHeaders });
        }

        const targetUser = userData.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (!targetUser) {
          // Security best practice: return success even if email not found to avoid user enumeration
          return new Response(JSON.stringify({ success: true, message: "If the email exists, a password reset link has been dispatched" }), { status: 200, headers: corsHeaders });
        }

        // Generate reset token valid for 15 minutes
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        const { error: resetDbError } = await supabase
          .from("password_resets")
          .insert({
            email: email.toLowerCase(),
            token: token,
            expires_at: expiresAt.toISOString()
          });

        if (resetDbError) {
          console.error("[forgot-password] Reset table write error:", resetDbError);
          return new Response(JSON.stringify({ error: "Failed to generate password reset request" }), { status: 500, headers: corsHeaders });
        }

        const siteUrl = Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://smartfitai.in";
        const resetLink = `${siteUrl}/reset-password?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;
        
        const html = forgotPasswordTemplate(resetLink);
        const sendResult = await sendEmail({
          to: email,
          subject: "🔑 Password Reset Request - SmartFit AI",
          html: html,
          type: "forgot_password"
        });

        return new Response(JSON.stringify(sendResult), { status: sendResult.success ? 200 : 500, headers: corsHeaders });
      }

      // 5. RESET PASSWORD (Verifies token and sets new password)
      case "reset-password": {
        const { token, password } = data || {};
        if (!email || !token || !password) {
          return new Response(JSON.stringify({ error: "Missing required reset password parameters" }), { status: 400, headers: corsHeaders });
        }

        // Verify token in database
        const { data: resetData, error: dbError } = await supabase
          .from("password_resets")
          .select("*")
          .eq("email", email.toLowerCase())
          .eq("token", token)
          .eq("used", false)
          .single();

        if (dbError || !resetData) {
          return new Response(JSON.stringify({ error: "Invalid, used, or expired password reset token" }), { status: 400, headers: corsHeaders });
        }

        // Check expiration
        if (new Date(resetData.expires_at) < new Date()) {
          return new Response(JSON.stringify({ error: "This password reset link has expired" }), { status: 400, headers: corsHeaders });
        }

        // Fetch auth user ID
        const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          return new Response(JSON.stringify({ error: "User lookup failure" }), { status: 500, headers: corsHeaders });
        }

        const targetUser = usersList.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (!targetUser) {
          return new Response(JSON.stringify({ error: "User profile no longer exists" }), { status: 404, headers: corsHeaders });
        }

        // Update password using Admin Auth Client
        const { error: updateError } = await supabase.auth.admin.updateUserById(targetUser.id, {
          password: password
        });

        if (updateError) {
          console.error("[reset-password] Password update failed:", updateError);
          return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: corsHeaders });
        }

        // Mark token as used
        await supabase
          .from("password_resets")
          .update({ used: true })
          .eq("id", resetData.id);

        return new Response(JSON.stringify({ success: true, message: "Password updated successfully!" }), { status: 200, headers: corsHeaders });
      }

      // 6. CONTACT US FORM SUBMISSION
      case "contact-form": {
        const { name, subject, message } = data || {};
        if (!email || !name || !subject || !message) {
          return new Response(JSON.stringify({ error: "Missing required contact form fields" }), { status: 400, headers: corsHeaders });
        }

        const recipient = Deno.env.get("BREVO_SENDER_EMAIL") || "founder@smartfitai.in";
        const timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }) + " IST";
        
        const html = contactFormTemplate(name, email, subject, message, timestamp);
        const sendResult = await sendEmail({
          to: recipient,
          subject: `📬 Contact Us Form: ${subject}`,
          html: html,
          type: "contact_form_notification"
        });

        return new Response(JSON.stringify(sendResult), { status: sendResult.success ? 200 : 500, headers: corsHeaders });
      }

      // 7. SUBSCRIPTION ACTIVATION / VERIFICATION TRIGGERS (ADMIN ONLY - WEBHOOK BINDINGS)
      case "subscription-success": {
        if (!isServiceRole) {
          return new Response(JSON.stringify({ error: "Access denied. Admin access only." }), { status: 403, headers: corsHeaders });
        }

        const { planName, amount, paymentId, renewalDate, invoiceUrl } = data || {};
        if (!email || !planName || !amount || !paymentId) {
          return new Response(JSON.stringify({ error: "Missing required subscription confirmation details" }), { status: 400, headers: corsHeaders });
        }

        const invoiceLink = invoiceUrl || `${Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://smartfitai.in"}/app/profile`;
        const subHtml = subscriptionConfirmationTemplate(planName, amount, paymentId, renewalDate, invoiceLink);
        
        const subResult = await sendEmail({
          to: email,
          subject: "🎉 Subscription Confirmed! Welcome to SmartFit AI Premium",
          html: subHtml,
          type: "subscription_confirmation"
        });

        return new Response(JSON.stringify(subResult), { status: 200, headers: corsHeaders });
      }

      case "payment-success": {
        if (!isServiceRole) {
          return new Response(JSON.stringify({ error: "Access denied. Admin access only." }), { status: 403, headers: corsHeaders });
        }

        const { amount, planName, transactionId, invoiceUrl } = data || {};
        if (!email || !amount || !planName || !transactionId) {
          return new Response(JSON.stringify({ error: "Missing required payment details" }), { status: 400, headers: corsHeaders });
        }

        const invoiceLink = invoiceUrl || `${Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://smartfitai.in"}/app/profile`;
        const payHtml = paymentSuccessTemplate(amount, planName, transactionId, invoiceLink);
        
        const payResult = await sendEmail({
          to: email,
          subject: "✔️ Payment Successful Receipt - SmartFit AI",
          html: payHtml,
          type: "payment_success"
        });

        return new Response(JSON.stringify(payResult), { status: 200, headers: corsHeaders });
      }

      case "payment-failed": {
        if (!isServiceRole) {
          return new Response(JSON.stringify({ error: "Access denied. Admin access only." }), { status: 403, headers: corsHeaders });
        }

        const { reason, retryUrl } = data || {};
        if (!email || !reason) {
          return new Response(JSON.stringify({ error: "Missing required payment failure details" }), { status: 400, headers: corsHeaders });
        }

        const retryLink = retryUrl || `${Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://smartfitai.in"}/pricing`;
        const failHtml = paymentFailedTemplate(reason, retryLink);
        
        const failResult = await sendEmail({
          to: email,
          subject: "⚠️ Payment Transaction Failed - SmartFit AI",
          html: failHtml,
          type: "payment_failed"
        });

        return new Response(JSON.stringify(failResult), { status: 200, headers: corsHeaders });
      }

      // 8. CRON ACTIONS (Triggered by pg_cron with service role token)
      case "send-weekly-reports": {
        if (!isServiceRole) {
          return new Response(JSON.stringify({ error: "Access denied. Admin access only." }), { status: 403, headers: corsHeaders });
        }

        console.log("[send-weekly-reports] Weekly report dispatch initialized...");

        // Fetch all active user profiles
        const { data: profiles, error: pError } = await supabase
          .from("profiles")
          .select("id, email, username");

        if (pError || !profiles) {
          console.error("[send-weekly-reports] Profile query error:", pError);
          return new Response(JSON.stringify({ error: "Failed to load profiles" }), { status: 500, headers: corsHeaders });
        }

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        let sentCount = 0;

        for (const profile of profiles) {
          if (!profile.email) continue;

          // 1. Get user workout sessions for the past 7 days
          const { data: sessions } = await supabase
            .from("workout_sessions")
            .select("*")
            .eq("user_id", profile.id)
            .gte("created_at", oneWeekAgo.toISOString());

          // 2. Get user progress logs (weight) for the past 7 days
          const { data: logs } = await supabase
            .from("progress_logs")
            .select("*")
            .eq("user_id", profile.id)
            .gte("date", oneWeekAgo.toISOString().split("T")[0])
            .order("date", { ascending: false });

          // Calculate metrics
          const workoutCount = sessions ? sessions.length : 0;
          const workoutSummary = `${workoutCount} sessions`;
          
          // Estimate calories burned (0.15 kcal/second of training duration)
          const caloriesBurned = sessions 
            ? sessions.reduce((acc, s) => acc + Math.round((s.duration_seconds || 0) * 0.15), 0)
            : 0;

          // Streak estimation (based on active workout days this week)
          let streak = 0;
          if (sessions && sessions.length > 0) {
            const activeDates = new Set(sessions.map(s => new Date(s.created_at).toDateString()));
            streak = activeDates.size;
          }

          // Weight change calculation
          let weightChange = "--";
          if (logs && logs.length >= 2) {
            const latestW = parseFloat(logs[0].weight || "0");
            const earliestW = parseFloat(logs[logs.length - 1].weight || "0");
            const diff = latestW - earliestW;
            weightChange = diff > 0 ? `+${diff.toFixed(1)} kg` : `${diff.toFixed(1)} kg`;
          }

          // Dynamic AI recommendations based on metrics
          let recommendation = "Smash your training goals this week! Focus on maintaining consistent workout logs.";
          if (workoutCount >= 4) {
            recommendation = "Phenomenal consistency! Your recovery protocols are critical now—prioritize deep sleep (7-8 hours) and keep protein intake high.";
          } else if (workoutCount > 0 && workoutCount < 3) {
            recommendation = "Great job getting in some movement. Let's aim to schedule 3 workouts this week to unlock deeper conditioning benefits.";
          } else if (workoutCount === 0) {
            recommendation = "Every workout counts, even a 10-minute stretch session. Let's start with one short workout this week to kickstart your streak!";
          }

          const html = weeklyProgressTemplate({
            name: profile.username || splitEmailName(profile.email),
            workoutSummary,
            caloriesBurned,
            weightChange,
            streak,
            aiRecommendation: recommendation
          });

          await sendEmail({
            to: profile.email,
            subject: "📈 Your Weekly SmartFit AI Progress Summary",
            html: html,
            type: "weekly_report"
          });

          sentCount++;
        }

        return new Response(JSON.stringify({ success: true, reports_dispatched: sentCount }), { status: 200, headers: corsHeaders });
      }

      case "send-trial-expiry-reminders": {
        if (!isServiceRole) {
          return new Response(JSON.stringify({ error: "Access denied. Admin access only." }), { status: 403, headers: corsHeaders });
        }

        console.log("[send-trial-expiry-reminders] Expiry check initialized...");

        const startCheck = new Date();
        startCheck.setDate(startCheck.getDate() + 2);
        startCheck.setHours(0, 0, 0, 0);

        const endCheck = new Date();
        endCheck.setDate(endCheck.getDate() + 2);
        endCheck.setHours(23, 59, 59, 999);

        // Fetch subscriptions ending in exactly 2 days
        const { data: subs, error: subError } = await supabase
          .from("subscriptions")
          .select("id, user_id, current_period_end")
          .eq("status", "trialing")
          .gte("current_period_end", startCheck.toISOString())
          .lte("current_period_end", endCheck.toISOString());

        if (subError || !subs) {
          console.error("[trial-expiry] Subscription query failure:", subError);
          return new Response(JSON.stringify({ error: "Failed to fetch trial details" }), { status: 500, headers: corsHeaders });
        }

        let sentReminders = 0;

        for (const sub of subs) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", sub.user_id)
            .single();

          if (profile?.email) {
            const upgradeUrl = `${Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://smartfitai.in"}/pricing`;
            const html = trialExpiryTemplate(upgradeUrl);
            
            await sendEmail({
              to: profile.email,
              subject: "⏳ SmartFit AI Premium Trial ends in 2 days - Don't lose access!",
              html: html,
              type: "trial_expiry_warning"
            });
            
            sentReminders++;
          }
        }

        return new Response(JSON.stringify({ success: true, warnings_dispatched: sentReminders }), { status: 200, headers: corsHeaders });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action type" }), { status: 400, headers: corsHeaders });
    }
    
  } catch (error: any) {
    console.error("[send-email] Server error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

// Helper: Get user's name from email address fallback
function splitEmailName(email: string): string {
  const parts = email.split("@");
  return parts[0];
}
