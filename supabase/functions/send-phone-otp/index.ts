import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, action, otp } = await req.json();

    // Validate phone number format (E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number. Use E.164 format (e.g., +1234567890)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "send") {
      // Rate limiting: Check for recent OTPs
      const { data: existingOtp } = await supabase
        .from("phone_otps")
        .select("created_at, attempts")
        .eq("phone", phone)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingOtp) {
        const createdAt = new Date(existingOtp.created_at);
        const now = new Date();
        const secondsSinceLastOtp = (now.getTime() - createdAt.getTime()) / 1000;

        // Rate limit: 60 seconds between OTP requests
        if (secondsSinceLastOtp < 60) {
          return new Response(
            JSON.stringify({
              error: `Please wait ${Math.ceil(60 - secondsSinceLastOtp)} seconds before requesting a new code`
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Delete any existing OTPs for this phone
      await supabase.from("phone_otps").delete().eq("phone", phone);

      // Generate new OTP
      const newOtp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store OTP in database
      const { error: insertError } = await supabase.from("phone_otps").insert({
        phone,
        otp: newOtp,
        expires_at: expiresAt.toISOString(),
      });

      if (insertError) {
        console.error("Failed to store OTP:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to generate OTP" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send SMS via Twilio
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        console.error("Missing Twilio credentials");
        return new Response(
          JSON.stringify({ error: "SMS service not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      const smsBody = `Your SmartFit AI verification code is: ${newOtp}. This code expires in 5 minutes.`;

      const twilioResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        },
        body: new URLSearchParams({
          To: phone,
          From: twilioPhoneNumber,
          Body: smsBody,
        }),
      });

      if (!twilioResponse.ok) {
        const errorData = await twilioResponse.json();
        console.error("Twilio error:", errorData);

        // Clean up the OTP we just stored
        await supabase.from("phone_otps").delete().eq("phone", phone);

        return new Response(
          JSON.stringify({ error: "Failed to send SMS. Please check your phone number." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`OTP sent successfully to ${phone}`);
      return new Response(
        JSON.stringify({ success: true, message: "OTP sent successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "verify") {
      if (!otp || otp.length !== 6) {
        return new Response(
          JSON.stringify({ error: "Invalid OTP format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get stored OTP
      const { data: storedOtp, error: fetchError } = await supabase
        .from("phone_otps")
        .select("*")
        .eq("phone", phone)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !storedOtp) {
        return new Response(
          JSON.stringify({ error: "No OTP found. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check expiry
      if (new Date(storedOtp.expires_at) < new Date()) {
        await supabase.from("phone_otps").delete().eq("id", storedOtp.id);
        return new Response(
          JSON.stringify({ error: "OTP expired. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check attempts (max 5)
      if (storedOtp.attempts >= 5) {
        await supabase.from("phone_otps").delete().eq("id", storedOtp.id);
        return new Response(
          JSON.stringify({ error: "Too many attempts. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Increment attempts
      await supabase
        .from("phone_otps")
        .update({ attempts: storedOtp.attempts + 1 })
        .eq("id", storedOtp.id);

      // Verify OTP
      if (storedOtp.otp !== otp) {
        return new Response(
          JSON.stringify({ error: "Invalid OTP. Please try again." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // OTP is valid - delete it
      await supabase.from("phone_otps").delete().eq("id", storedOtp.id);

      // Try to create user - if exists, we'll get phone_exists error
      let userId: string;
      let isNewUser = false;

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        phone,
        phone_confirm: true,
        user_metadata: { phone_verified: true },
      });

      if (createError) {
        if (createError.code === "phone_exists" || createError.message?.includes("Phone number already registered")) {
          // User exists - find them by listing with phone filter
          console.log("Phone exists, finding user by phone...");

          // Use getUserById after getting from identities or search
          const { data: usersData } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          });

          const foundUser = usersData?.users?.find((u) => {
            // Check both phone and phone identity
            return u.phone === phone ||
              u.phone === phone.replace('+', '') ||
              u.identities?.some((id) => id.identity_data?.phone === phone);
          });

          if (foundUser) {
            userId = foundUser.id;
            console.log(`Found existing user: ${userId}`);
          } else {
            // User exists but couldn't find - create session with phone-based email
            console.log("User exists but not found in list, proceeding with session creation");
            // Generate deterministic userId based on phone for consistency
            const fakeEmail = `${phone.replace(/[^0-9]/g, '')}@phone.smartfit.local`;

            // Try to sign in the existing user by generating link
            const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
              type: "magiclink",
              email: fakeEmail,
            });

            if (linkData?.user) {
              userId = linkData.user.id;
              console.log(`Got user from link generation: ${userId}`);
            } else {
              console.error("Could not find or create user session:", linkError);
              return new Response(
                JSON.stringify({ error: "Account exists but login failed. Try again." }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
        } else {
          console.error("Failed to create user:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to create user account" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (newUser?.user) {
        userId = newUser.user.id;
        isNewUser = true;
        console.log(`New user created: ${userId}`);
      } else {
        return new Response(
          JSON.stringify({ error: "Failed to create user account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate a magic link / session for the user
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: `${phone.replace("+", "")}@phone.smartfit.local`,
        options: {
          data: { phone, phone_verified: true },
        },
      });

      if (linkError || !linkData) {
        console.error("Failed to generate auth link:", linkError);
        return new Response(
          JSON.stringify({ error: "Failed to generate authentication" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          verified: true,
          isNewUser,
          token: linkData.properties?.hashed_token,
          type: "magiclink",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in send-phone-otp:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
