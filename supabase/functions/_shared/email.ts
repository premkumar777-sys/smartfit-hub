import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase Client for logging
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validate Email Address
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Brevo Outgoing Email Options
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  type: string;
}

// Write Log Entry to DB
async function logEmail(recipient: string, type: string, status: "success" | "failed", errorMessage?: string) {
  try {
    const { error } = await supabase
      .from("email_logs")
      .insert({
        recipient_email: recipient.toLowerCase(),
        email_type: type,
        status: status,
        error_message: errorMessage || null
      });
      
    if (error) {
      console.error("[Email Log Error] Failed to write log to DB:", error);
    }
  } catch (err) {
    console.error("[Email Log Error] Exception writing log:", err);
  }
}

// Send Email via Brevo API with Retry Logic
export async function sendEmail({ to, subject, html, type }: SendEmailOptions): Promise<{ success: boolean; message: string }> {
  if (!isValidEmail(to)) {
    const errMsg = "Invalid recipient email address format.";
    await logEmail(to, type, "failed", errMsg);
    return { success: false, message: errMsg };
  }

  const apiKey = Deno.env.get("BREVO_API_KEY");
  const senderName = Deno.env.get("BREVO_SENDER_NAME") || "SmartFit AI";
  const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL") || "founder@smartfitai.in";

  if (!apiKey) {
    const errMsg = "BREVO_API_KEY is not configured in environment variables.";
    console.error(`[Email Error] ${errMsg}`);
    await logEmail(to, type, "failed", errMsg);
    return { success: false, message: errMsg };
  }

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to.toLowerCase() }],
    subject: subject,
    htmlContent: html,
  };

  const maxRetries = 3;
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      console.log(`[Email Service] Attempting to send ${type} email to ${to} (Attempt ${attempt}/${maxRetries})...`);
      
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`[Email Service] ${type} email sent successfully to ${to}.`);
        await logEmail(to, type, "success");
        return { success: true, message: "Email sent successfully" };
      } else {
        const errorData = await response.text();
        throw new Error(`Brevo API error (Status ${response.status}): ${errorData}`);
      }
    } catch (error: any) {
      lastError = error;
      console.warn(`[Email Service] Attempt ${attempt} failed:`, error.message);
      
      // Delay before retrying (exponential backoff: 1s, 2s, 4s)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  const finalErrMsg = lastError ? lastError.message : "Unknown error during dispatch.";
  console.error(`[Email Service] Failed to send email after ${maxRetries} attempts:`, finalErrMsg);
  await logEmail(to, type, "failed", finalErrMsg);
  return { success: false, message: finalErrMsg };
}

// -------------------------------------------------------------
// HTML EMAIL TEMPLATE GENERATORS (Vibrant, Responsive, Dark Mode)
// -------------------------------------------------------------

// Base Layout Template
function baseLayout(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=SF+Mono&display=swap');
    body {
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #030303;
      color: #e0e0e0;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 800;
      margin: 0;
      color: #00ff9c;
      letter-spacing: -1px;
    }
    .header p {
      color: #4CC9F0;
      font-size: 11px;
      margin: 5px 0 0;
      letter-spacing: 4px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .card {
      background: linear-gradient(145deg, #0e0e18 0%, #08080f 100%);
      border-radius: 24px;
      padding: 40px 30px;
      border: 1px solid rgba(0, 255, 156, 0.15);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
    }
    .cta-button {
      display: inline-block;
      background-color: #00ff9c;
      color: #030303 !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 14px;
      padding: 14px 32px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 25px 0;
      transition: all 0.2s ease;
      box-shadow: 0 4px 15px rgba(0, 255, 156, 0.3);
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .footer p {
      color: #666;
      font-size: 12px;
      margin: 5px 0;
    }
    .footer a {
      color: #00ff9c;
      text-decoration: none;
    }
    .highlight-box {
      background: rgba(0, 255, 156, 0.05);
      border: 1px solid rgba(0, 255, 156, 0.2);
      border-radius: 16px;
      padding: 20px;
      margin: 25px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>⚡ SMARTFIT AI</h1>
      <p>TRAIN SMART. PERFORM BETTER.</p>
    </div>
    
    <div class="card">
      ${content}
    </div>
    
    <div class="footer">
      <p style="color: #00ff9c; font-weight: 600; font-size: 13px;">💪 Your Fitness. Reimagined by AI.</p>
      <p>© 2026 SmartFit AI. All rights reserved.</p>
      <p>Questions? Contact us at <a href="mailto:founder@smartfitai.in">founder@smartfitai.in</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

// 1. Welcome Email Template
export function welcomeTemplate(username: string, loginUrl: string): string {
  const content = `
    <h2 style="color: #ffffff; margin: 0 0 15px; font-size: 24px; font-weight: 800;">Welcome, ${username}!</h2>
    <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Welcome to <strong>SmartFit AI</strong>. You've officially taken the first step towards transforming your physique and unlocking elite health, driven by advanced artificial intelligence.
    </p>
    <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Here is what you can start exploring in your dashboard right now:
    </p>
    <ul style="color: #e0e0e0; font-size: 15px; line-height: 1.8; padding-left: 20px; margin: 0 0 20px;">
      <li>🤖 <strong>AI Personal Trainer:</strong> Tailored coaching recommendations updated daily.</li>
      <li>🏋️ <strong>Personalized Workouts:</strong> Custom plans designed specifically for your equipment and goals.</li>
      <li>🥗 <strong>AI Nutrition Planner:</strong> Advanced calorie and macro breakdowns.</li>
      <li>📈 <strong>Progress Dashboard:</strong> Beautiful tracking metrics to keep you motivated.</li>
    </ul>
    <div style="text-align: center;">
      <a href="${loginUrl}" class="cta-button">Go to Dashboard</a>
    </div>
    <p style="color: #666; font-size: 13px; line-height: 1.5; margin-top: 20px; text-align: center;">
      Let's get to work. Get ready to smash your limits!
    </p>
  `;
  return baseLayout("Welcome to SmartFit AI", content);
}

// 2. Email Verification Template
export function emailVerificationTemplate(otp: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 40px;">🔐</span>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 15px; font-size: 22px; font-weight: 800; text-align: center;">Verify Your Email</h2>
    <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 25px;">
      Use the following secure 6-digit verification code to complete your signup process at SmartFit AI.
    </p>
    
    <div style="background: linear-gradient(135deg, #030303 0%, #0a0a14 100%); border-radius: 16px; padding: 24px; text-align: center; border: 2px solid #00ff9c; box-shadow: 0 0 25px rgba(0, 255, 156, 0.15);">
      <span style="font-size: 38px; font-weight: 800; color: #00ff9c; letter-spacing: 10px; font-family: 'SF Mono', monospace; text-shadow: 0 0 15px rgba(0, 255, 156, 0.4);">
        ${otp}
      </span>
    </div>
    
    <div style="text-align: center; margin-top: 25px; padding: 12px; background: rgba(76, 201, 240, 0.08); border-radius: 10px; border: 1px solid rgba(76, 201, 240, 0.15);">
      <p style="color: #4CC9F0; font-size: 13px; margin: 0; font-weight: 600;">
        ⏱️ This verification code expires in <strong>10 minutes</strong>.
      </p>
    </div>
    
    <p style="color: #555; font-size: 12px; margin-top: 25px; text-align: center; line-height: 1.4;">
      If you did not request this account registration, you can safely ignore this message.
    </p>
  `;
  return baseLayout("Verify your SmartFit AI Account", content);
}

// 3. Forgot Password Template
export function forgotPasswordTemplate(resetUrl: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 40px;">🔑</span>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 15px; font-size: 22px; font-weight: 800; text-align: center;">Reset Your Password</h2>
    <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 25px;">
      We received a request to reset your SmartFit AI account password. Click the button below to secure a new password.
    </p>
    
    <div style="text-align: center;">
      <a href="${resetUrl}" class="cta-button">Reset Password</a>
    </div>
    
    <div style="text-align: center; margin-top: 25px; padding: 12px; background: rgba(247, 37, 133, 0.08); border-radius: 10px; border: 1px solid rgba(247, 37, 133, 0.15);">
      <p style="color: #F72585; font-size: 13px; margin: 0; font-weight: 600;">
        ⏱️ This password reset link is valid for <strong>15 minutes</strong>.
      </p>
    </div>
    
    <p style="color: #555; font-size: 12px; margin-top: 25px; text-align: center; line-height: 1.4;">
      For security reasons, this link can only be used once. If you did not request this, please secure your account.
    </p>
  `;
  return baseLayout("Reset Password - SmartFit AI", content);
}

// 4. OTP Email Template
export function otpTemplate(otp: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 40px;">🛡️</span>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 15px; font-size: 22px; font-weight: 800; text-align: center;">Authentication Code</h2>
    <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 25px;">
      Enter the code below to log into your SmartFit AI account:
    </p>
    
    <div style="background: linear-gradient(135deg, #030303 0%, #0a0a14 100%); border-radius: 16px; padding: 24px; text-align: center; border: 2px solid #00ff9c; box-shadow: 0 0 25px rgba(0, 255, 156, 0.15);">
      <span style="font-size: 38px; font-weight: 800; color: #00ff9c; letter-spacing: 10px; font-family: 'SF Mono', monospace; text-shadow: 0 0 15px rgba(0, 255, 156, 0.4);">
        ${otp}
      </span>
    </div>
    
    <div style="text-align: center; margin-top: 25px; padding: 12px; background: rgba(76, 201, 240, 0.08); border-radius: 10px; border: 1px solid rgba(76, 201, 240, 0.15);">
      <p style="color: #4CC9F0; font-size: 13px; margin: 0; font-weight: 600;">
        ⏱️ This OTP code is valid for <strong>5 minutes</strong> and single-use only.
      </p>
    </div>
    
    <p style="color: #555; font-size: 12px; margin-top: 25px; text-align: center;">
      Never share this security code with anyone.
    </p>
  `;
  return baseLayout("SmartFit AI Verification Code", content);
}

// 5. Contact Form Notification Template (For Admin)
export function contactFormTemplate(name: string, email: string, subject: string, message: string, timestamp: string): string {
  const content = `
    <h2 style="color: #ffffff; margin: 0 0 15px; font-size: 20px; font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">
      📬 New Contact Us Submission
    </h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 8px 0; color: #888; font-weight: 600; width: 30%;">Name:</td>
        <td style="padding: 8px 0; color: #fff;">${name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #888; font-weight: 600;">Email:</td>
        <td style="padding: 8px 0; color: #00ff9c;"><a href="mailto:${email}" style="color: #00ff9c; text-decoration: none;">${email}</a></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #888; font-weight: 600;">Subject:</td>
        <td style="padding: 8px 0; color: #fff; font-weight: 600;">${subject}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #888; font-weight: 600;">Submitted:</td>
        <td style="padding: 8px 0; color: #aaa;">${timestamp}</td>
      </tr>
    </table>
    
    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin-top: 10px;">
      <h4 style="margin: 0 0 8px; color: #eee; font-size: 14px;">Message Content:</h4>
      <p style="margin: 0; color: #ccc; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
    </div>
  `;
  return baseLayout("New Contact Form Message", content);
}

// 6. Subscription Confirmation Template
export function subscriptionConfirmationTemplate(plan: string, amount: string, paymentId: string, renewalDate: string, invoiceLink: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 40px;">🎉</span>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 15px; font-size: 22px; font-weight: 800; text-align: center; color: #00ff9c;">Subscription Confirmed!</h2>
    <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 25px;">
      Your membership is active! Prepare to unlock premium AI capabilities, custom programming, and analytics dashboard tools.
    </p>
    
    <div class="highlight-box">
      <h3 style="margin: 0 0 12px; color: #fff; font-size: 16px; font-weight: 600;">Subscription Summary</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #888;">Plan Name:</td>
          <td style="padding: 6px 0; color: #fff; font-weight: 600; text-align: right;">${plan}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #888;">Amount Paid:</td>
          <td style="padding: 6px 0; color: #00ff9c; font-weight: 600; text-align: right;">${amount}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #888;">Payment ID:</td>
          <td style="padding: 6px 0; color: #fff; text-align: right; font-family: monospace; font-size: 12px;">${paymentId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #888;">Renewal Date:</td>
          <td style="padding: 6px 0; color: #fff; text-align: right;">${renewalDate}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin-top: 15px;">
      <a href="${invoiceLink}" class="cta-button" style="background-color: #4CC9F0; color: #030303; box-shadow: 0 4px 15px rgba(76, 201, 240, 0.3);">View Invoice Details</a>
    </div>
  `;
  return baseLayout("Subscription Confirmed - SmartFit AI", content);
}

// 7. Payment Success Template
export function paymentSuccessTemplate(amount: string, plan: string, transactionId: string, invoiceLink: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 40px;">✔️</span>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 15px; font-size: 22px; font-weight: 800; text-align: center; color: #00ff9c;">Payment Successful!</h2>
    <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 25px;">
      Thank you for your payment. We have successfully processed your transaction.
    </p>
    
    <div class="highlight-box">
      <h3 style="margin: 0 0 12px; color: #fff; font-size: 16px; font-weight: 600;">Transaction Receipt</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #888;">Plan Purchased:</td>
          <td style="padding: 6px 0; color: #fff; font-weight: 600; text-align: right;">${plan}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #888;">Transaction ID:</td>
          <td style="padding: 6px 0; color: #fff; text-align: right; font-family: monospace; font-size: 12px;">${transactionId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #888;">Amount:</td>
          <td style="padding: 6px 0; color: #00ff9c; font-weight: 600; text-align: right;">${amount}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #888;">Status:</td>
          <td style="padding: 6px 0; color: #00ff9c; font-weight: 600; text-align: right; text-transform: uppercase;">Succeeded</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin-top: 15px;">
      <a href="${invoiceLink}" class="cta-button">Download Invoice</a>
    </div>
  `;
  return baseLayout("Payment Successful - SmartFit AI", content);
}

// 8. Payment Failed Template
export function paymentFailedTemplate(reason: string, retryLink: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 40px;">⚠️</span>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 15px; font-size: 22px; font-weight: 800; text-align: center; color: #ff5252;">Payment Failed</h2>
    <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 25px;">
      We were unable to complete processing your subscription payment.
    </p>
    
    <div style="background: rgba(255, 82, 82, 0.05); border: 1px solid rgba(255, 82, 82, 0.2); border-radius: 16px; padding: 20px; margin: 25px 0;">
      <h3 style="margin: 0 0 8px; color: #fff; font-size: 15px; font-weight: 600;">Failure Reason</h3>
      <p style="margin: 0; color: #ff7878; font-size: 14px;">${reason}</p>
    </div>
    
    <div style="text-align: center; margin-top: 15px;">
      <a href="${retryLink}" class="cta-button" style="background-color: #ff5252; color: #fff !important; box-shadow: 0 4px 15px rgba(255, 82, 82, 0.3);">Retry Payment</a>
    </div>
    
    <p style="color: #666; font-size: 12px; margin-top: 25px; text-align: center;">
      If you continue to experience payment errors, please contact your banking institution or write to our support team.
    </p>
  `;
  return baseLayout("Payment Failed - SmartFit AI", content);
}

// 9. Trial Expiry Reminder Template
export function trialExpiryTemplate(upgradeLink: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 40px;">⏳</span>
    </div>
    <h2 style="color: #ffffff; margin: 0 0 15px; font-size: 22px; font-weight: 800; text-align: center;">Your Trial Ends in 2 Days!</h2>
    <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 25px;">
      Your SmartFit AI Premium Trial is scheduled to expire in <strong>2 days</strong>. Don't lose access to your custom AI training models, workout plans, and metrics dashboard.
    </p>
    
    <div class="highlight-box">
      <h3 style="margin: 0 0 12px; color: #fff; font-size: 15px; font-weight: 600; text-align: center;">What You Will Lose</h3>
      <ul style="color: #bbb; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>🤖 Personalized real-time AI Trainer chat streams</li>
        <li>🏋️ Advanced custom program routines & history tracking</li>
        <li>🥗 Weekly tailored nutrition and macro adjustments</li>
        <li>📊 Comprehensive dashboard analytics logs</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin-top: 15px;">
      <a href="${upgradeLink}" class="cta-button">Upgrade to Premium</a>
    </div>
  `;
  return baseLayout("Trial Expiring Soon - SmartFit AI", content);
}

// 10. Weekly Progress Report Template
interface WeeklyReportData {
  name: string;
  workoutSummary: string;
  caloriesBurned: number;
  weightChange: string;
  streak: number;
  aiRecommendation: string;
}

export function weeklyProgressTemplate(data: WeeklyReportData): string {
  const content = `
    <h2 style="color: #ffffff; margin: 0 0 10px; font-size: 22px; font-weight: 800;">Hey ${data.name}!</h2>
    <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
      Here is your SmartFit AI weekly performance check-in for the past week:
    </p>
    
    <div style="display: table; width: 100%; margin-bottom: 25px; text-align: center;">
      <!-- Row 1 -->
      <div style="display: table-row;">
        <!-- Card 1 -->
        <div style="display: table-cell; width: 50%; padding: 10px;">
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 15px 10px;">
            <span style="font-size: 20px;">🏋️</span>
            <h4 style="margin: 5px 0 2px; font-size: 11px; color: #888; text-transform: uppercase; tracking: 1px;">Workouts</h4>
            <p style="margin: 0; font-size: 22px; font-weight: 800; color: #fff;">${data.workoutSummary}</p>
          </div>
        </div>
        <!-- Card 2 -->
        <div style="display: table-cell; width: 50%; padding: 10px;">
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 15px 10px;">
            <span style="font-size: 20px;">🔥</span>
            <h4 style="margin: 5px 0 2px; font-size: 11px; color: #888; text-transform: uppercase; tracking: 1px;">Calories</h4>
            <p style="margin: 0; font-size: 22px; font-weight: 800; color: #00ff9c;">${data.caloriesBurned} kcal</p>
          </div>
        </div>
      </div>
      
      <!-- Row 2 -->
      <div style="display: table-row;">
        <!-- Card 3 -->
        <div style="display: table-cell; width: 50%; padding: 10px;">
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 15px 10px;">
            <span style="font-size: 20px;">⚖️</span>
            <h4 style="margin: 5px 0 2px; font-size: 11px; color: #888; text-transform: uppercase; tracking: 1px;">Weight Change</h4>
            <p style="margin: 0; font-size: 22px; font-weight: 800; color: #4CC9F0;">${data.weightChange}</p>
          </div>
        </div>
        <!-- Card 4 -->
        <div style="display: table-cell; width: 50%; padding: 10px;">
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 15px 10px;">
            <span style="font-size: 20px;">⚡</span>
            <h4 style="margin: 5px 0 2px; font-size: 11px; color: #888; text-transform: uppercase; tracking: 1px;">Active Streak</h4>
            <p style="margin: 0; font-size: 22px; font-weight: 800; color: #ff9f43;">${data.streak} Days</p>
          </div>
        </div>
      </div>
    </div>
    
    <div style="background: rgba(0, 255, 156, 0.03); border: 1px solid rgba(0, 255, 156, 0.2); border-radius: 16px; padding: 20px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px; color: #00ff9c; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">🤖 SmartFit Trainer Recommendation</h3>
      <p style="margin: 0; color: #eee; font-size: 14px; line-height: 1.6; font-style: italic;">
        "${data.aiRecommendation}"
      </p>
    </div>
  `;
  return baseLayout("Your SmartFit AI Weekly Progress", content);
}
