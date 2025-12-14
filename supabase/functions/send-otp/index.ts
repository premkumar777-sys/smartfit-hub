import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send email using SMTP
async function sendEmailWithSMTP(to: string, otp: string): Promise<void> {
  const client = new SMTPClient({
    connection: {
      hostname: Deno.env.get("SMTP_HOST")!,
      port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
      tls: Deno.env.get("SMTP_PORT") === "465",
      auth: {
        username: Deno.env.get("SMTP_USER")!,
        password: Deno.env.get("SMTP_PASS")!,
      },
    },
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0a0a0f;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #2a2a4a;">
          <h1 style="color: #00ff9c; margin: 0 0 24px; font-size: 28px; text-align: center;">
            🏋️ FitAI Login
          </h1>
          <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Your one-time verification code is:
          </p>
          <div style="background: #0a0a0f; border-radius: 12px; padding: 24px; text-align: center; border: 2px solid #00ff9c;">
            <span style="font-size: 36px; font-weight: bold; color: #00ff9c; letter-spacing: 8px; font-family: monospace;">
              ${otp}
            </span>
          </div>
          <p style="color: #888; font-size: 14px; line-height: 1.6; margin-top: 24px; text-align: center;">
            This code expires in <strong style="color: #00ff9c;">10 minutes</strong>.
            <br>If you didn't request this code, please ignore this email.
          </p>
        </div>
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} FitAI. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  await client.send({
    from: Deno.env.get("SMTP_USER")!,
    to: to,
    subject: "Your FitAI Login Code",
    content: "auto",
    html: htmlContent,
  });

  await client.close();
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, action, otp } = body;

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

      // Send email
      await sendEmailWithSMTP(email, generatedOtp);
      console.log(`OTP sent to ${email}`);

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
