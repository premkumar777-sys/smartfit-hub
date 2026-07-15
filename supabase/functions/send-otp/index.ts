import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, otpTemplate } from "../_shared/email.ts";

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

    console.log(`Received request in send-otp action=${action}, email=${email}`);

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
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes for Auth OTP

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

      // Generate the beautiful HTML using our shared template
      const htmlContent = otpTemplate(generatedOtp);

      // Send email using our shared Brevo service
      const sendResult = await sendEmail({
        to: email,
        subject: "🔐 Your SmartFit AI Verification Code",
        html: htmlContent,
        type: "auth_otp"
      });

      if (!sendResult.success) {
        return new Response(
          JSON.stringify({ error: sendResult.message }),
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

      // Create user if they don't exist, otherwise generate magic link for the existing user
      let isNewUser = false;
      const tempPassword = crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: tempPassword,
        email_confirm: true,
      });

      if (createError) {
        // If user already exists, we proceed with generateLink. Otherwise fail.
        const isEmailExists = createError.status === 422 || 
                             createError.code === "email_exists" || 
                             createError.message?.includes("email") || 
                             createError.message?.includes("registered") || 
                             createError.message?.includes("exists");
                             
        if (!isEmailExists) {
          console.error("Error creating user during OTP verification:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to create account" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      } else {
        isNewUser = true;
      }

      // Generate magic link (works for both new and existing users)
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: email.toLowerCase(),
      });

      if (linkError || !linkData) {
        console.error("Error generating auth link during OTP verification:", linkError);
        return new Response(
          JSON.stringify({ error: "Failed to authenticate" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          verified: true,
          token: linkData.properties?.hashed_token,
          actionLink: linkData.properties?.action_link,
          type: "magiclink",
          isNewUser
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
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
