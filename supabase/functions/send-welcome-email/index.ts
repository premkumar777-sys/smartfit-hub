import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  email: string;
  username?: string;
}

const createWelcomeEmailHtml = (username?: string) => {
  const displayName = username || 'there';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Our Platform</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">🎉 Welcome!</h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                      Hi ${displayName},
                    </h2>
                    
                    <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                      We're thrilled to have you on board! Your account has been successfully created, and you're all set to explore our platform.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                      Here's what you can do next:
                    </p>
                    
                    <ul style="margin: 0 0 30px; padding-left: 20px; color: #666666; font-size: 16px; line-height: 1.8;">
                      <li>Complete your profile</li>
                      <li>Explore our features</li>
                      <li>Start your journey</li>
                    </ul>
                    
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                          <a href="${Deno.env.get('VITE_SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://yourapp.lovable.app'}/dashboard" 
                             style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                            Get Started
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                      If you have any questions, feel free to reach out to our support team.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                      © ${new Date().getFullYear()} Your Platform. All rights reserved.
                    </p>
                    <p style="margin: 10px 0 0; color: #999999; font-size: 12px;">
                      You received this email because you signed up for our platform.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, username }: WelcomeEmailRequest = await req.json();
    
    if (!email) {
      throw new Error('Email is required');
    }

    console.log(`Sending welcome email to: ${email}`);

    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error('SMTP configuration is incomplete. Please check environment variables.');
    }

    const client = new SmtpClient();

    await client.connectTLS({
      hostname: smtpHost,
      port: smtpPort,
      username: smtpUser,
      password: smtpPass,
    });

    await client.send({
      from: smtpUser,
      to: email,
      subject: "Welcome to Our Platform! 🎉",
      content: createWelcomeEmailHtml(username),
      html: createWelcomeEmailHtml(username),
    });

    await client.close();

    console.log(`Welcome email sent successfully to: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully' 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send welcome email' 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
