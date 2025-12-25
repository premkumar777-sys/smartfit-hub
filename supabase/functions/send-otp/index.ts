import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, action, otp } = body;

    console.log(`Received request: action=${action}, email=${email}`);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "send") {
      // Generate OTP
      const generatedOtp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in database
      const { error: upsertError } = await supabase
        .from("email_otps")
        .upsert({
          email: email.toLowerCase(),
          otp: generatedOtp,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
        }, {
          onConflict: "email",
        });

      if (upsertError) {
        console.error("Error storing OTP:", upsertError);
        return new Response(
          JSON.stringify({ error: "Failed to generate OTP" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Send email using Resend
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.error("RESEND_API_KEY not configured");
        return new Response(
          JSON.stringify({ error: "Email service not configured" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const resend = new Resend(resendApiKey);

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FitZone Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; margin: 0; padding: 0; background-color: #0a0a0f;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header with Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #00ff9c 0%, #4CC9F0 100%); -webkit-background-clip: text; background-clip: text;">
        <h1 style="font-size: 42px; font-weight: 800; margin: 0; color: #00ff9c; letter-spacing: -1px;">
          ⚡ FITZONE
        </h1>
      </div>
      <p style="color: #4CC9F0; font-size: 14px; margin: 8px 0 0; letter-spacing: 3px; text-transform: uppercase;">
        Your Fitness Journey
      </p>
    </div>
    
    <!-- Main Card -->
    <div style="background: linear-gradient(145deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 20px; padding: 48px 40px; border: 1px solid rgba(0, 255, 156, 0.2); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 255, 156, 0.1);">
      
      <!-- Icon -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">🔐</span>
      </div>
      
      <h2 style="color: #ffffff; margin: 0 0 16px; font-size: 24px; text-align: center; font-weight: 600;">
        Verification Code
      </h2>
      
      <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
        Enter this code to securely access your FitZone account:
      </p>
      
      <!-- OTP Code Box -->
      <div style="background: linear-gradient(135deg, #0a0a0f 0%, #12121a 100%); border-radius: 16px; padding: 28px; text-align: center; border: 2px solid #00ff9c; box-shadow: 0 0 30px rgba(0, 255, 156, 0.2), inset 0 0 20px rgba(0, 255, 156, 0.05);">
        <span style="font-size: 40px; font-weight: 700; color: #00ff9c; letter-spacing: 12px; font-family: 'SF Mono', 'Fira Code', monospace; text-shadow: 0 0 20px rgba(0, 255, 156, 0.5);">
          ${generatedOtp}
        </span>
      </div>
      
      <!-- Timer Notice -->
      <div style="text-align: center; margin-top: 28px; padding: 16px; background: rgba(76, 201, 240, 0.1); border-radius: 12px; border: 1px solid rgba(76, 201, 240, 0.2);">
        <p style="color: #4CC9F0; font-size: 14px; margin: 0;">
          ⏱️ This code expires in <strong>10 minutes</strong>
        </p>
      </div>
      
      <!-- Security Notice -->
      <p style="color: #666; font-size: 13px; line-height: 1.6; margin-top: 28px; text-align: center;">
        🛡️ If you didn't request this code, you can safely ignore this email.
        <br>Never share this code with anyone.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
      <p style="color: #00ff9c; font-size: 13px; margin: 0 0 8px; font-weight: 600;">
        💪 Stay Strong. Train Smart.
      </p>
      <p style="color: #555; font-size: 12px; margin: 0;">
        © 2025 FitZone. All rights reserved.
      </p>
      <p style="color: #444; font-size: 11px; margin: 12px 0 0;">
        Questions? Contact us at support@fitzone.com
      </p>
    </div>
  </div>
</body>
</html>
      `.trim();

      try {
        const { error: emailError } = await resend.emails.send({
          from: "FitZone <onboarding@resend.dev>",
          to: [email],
          subject: "🔐 Your FitZone Verification Code",
          html: htmlContent,
        });

        if (emailError) {
          console.error("Resend error:", emailError);
          return new Response(
            JSON.stringify({ error: `Failed to send email: ${emailError.message}` }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        console.log(`OTP email sent successfully to ${email}`);
      } catch (emailError: any) {
        console.error("Email send error:", emailError);
        return new Response(
          JSON.stringify({ error: `Failed to send email: ${emailError.message}` }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "OTP sent successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else if (action === "verify") {
      if (!otp) {
        return new Response(
          JSON.stringify({ error: "OTP is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Get stored OTP
      const { data: otpData, error: fetchError } = await supabase
        .from("email_otps")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();

      if (fetchError || !otpData) {
        return new Response(
          JSON.stringify({ error: "No OTP found for this email. Please request a new one." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check if OTP is expired
      if (new Date(otpData.expires_at) < new Date()) {
        await supabase.from("email_otps").delete().eq("email", email.toLowerCase());
        return new Response(
          JSON.stringify({ error: "OTP has expired. Please request a new one." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check attempts
      if (otpData.attempts >= 5) {
        await supabase.from("email_otps").delete().eq("email", email.toLowerCase());
        return new Response(
          JSON.stringify({ error: "Too many attempts. Please request a new OTP." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verify OTP
      if (otpData.otp !== otp) {
        await supabase
          .from("email_otps")
          .update({ attempts: otpData.attempts + 1 })
          .eq("email", email.toLowerCase());

        return new Response(
          JSON.stringify({ error: "Invalid OTP. Please try again." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // OTP is valid - delete it
      await supabase.from("email_otps").delete().eq("email", email.toLowerCase());

      // Sign in or create user using Supabase Admin
      const { data: userData } = await supabase.auth.admin.listUsers();
      const existingUser = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (existingUser) {
        // Generate magic link for existing user
        const { data, error } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: email.toLowerCase(),
        });
        
        if (error) {
          console.error("Error generating link:", error);
          return new Response(
            JSON.stringify({ error: "Failed to authenticate" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            verified: true,
            token: data.properties?.hashed_token,
            type: "magiclink"
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        // Create new user
        const tempPassword = crypto.randomUUID();
        const { error: createError } = await supabase.auth.admin.createUser({
          email: email.toLowerCase(),
          password: tempPassword,
          email_confirm: true,
        });

        if (createError) {
          console.error("Error creating user:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to create account" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Generate magic link for new user
        const { data, error } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: email.toLowerCase(),
        });

        if (error) {
          console.error("Error generating link:", error);
          return new Response(
            JSON.stringify({ error: "Failed to authenticate" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            verified: true,
            token: data.properties?.hashed_token,
            type: "magiclink",
            isNewUser: true
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
