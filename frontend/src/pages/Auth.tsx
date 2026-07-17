import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Loader2, Mail, Lock, User, Key, KeyRound, ShieldAlert, Eye, EyeOff, ArrowRight } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .max(100)
    .refine((password) => /[A-Z]/.test(password), {
      message: "Password must contain at least one uppercase letter.",
    })
    .refine((password) => /[a-z]/.test(password), {
      message: "Password must contain at least one lowercase letter.",
    })
    .refine((password) => /[0-9]/.test(password), {
      message: "Password must contain at least one number.",
    })
    .refine((password) => /[!@#$%^&*()_\-+=?<>/]/.test(password), {
      message: "Password must contain at least one special character.",
    }),
  username: z.string().trim().min(2, { message: "Username must be at least 2 characters" }).max(50).optional(),
});

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const returnUrl = (location.state as { returnUrl?: string })?.returnUrl || "/dashboard";
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  
  // Custom Flow States
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Login OTP States
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  
  // Signup OTP States
  const [signupStep, setSignupStep] = useState<"form" | "verify-otp">("form");
  const [pendingSignupData, setPendingSignupData] = useState<{
    email: string;
    username: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(returnUrl, { replace: true });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || event === "SIGNED_IN") {
        sessionStorage.removeItem("smartfit_checkin_prompted");
      }
      if (session) {
        navigate(returnUrl, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Standard Email/Password Login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const validated = authSchema.parse({ email, password });

      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      navigate(returnUrl, { replace: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Custom Signup Trigger - OTP Verification Step 1
  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;

    try {
      const validated = authSchema.parse({ email, password, username });
      
      setPendingSignupData({
        email: validated.email,
        username: validated.username || "",
        password: validated.password
      });

      // Call signup-otp edge function
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { action: "signup-otp", email: validated.email }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Verification code sent!",
        description: "Please check your email for a 6-digit confirmation code.",
      });
      setSignupStep("verify-otp");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signup failed",
          description: error.message || "Unable to initiate registration. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Custom Signup verification - OTP Verification Step 2
  const handleVerifySignupOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pendingSignupData) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          action: "verify-signup-otp",
          email: pendingSignupData.email,
          data: {
            otp: otpCode,
            username: pendingSignupData.username,
            password: pendingSignupData.password
          }
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Account verified!",
        description: "Completing sign in...",
      });

      // Auto login user with credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: pendingSignupData.email,
        password: pendingSignupData.password,
      });

      if (signInError) throw signInError;

      toast({
        title: "Welcome to SmartFit AI!",
        description: "Your account is active.",
      });
      navigate(returnUrl, { replace: true });
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired verification code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Login Trigger - Step 1: Send OTP
  const handleSendLoginOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      setOtpEmail(email.trim());
      
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { email: email.trim(), action: "send" }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Code sent",
        description: "Please check your inbox for a 6-digit login verification code.",
      });
      setOtpStep("verify");
    } catch (error: any) {
      toast({
        title: "Send OTP failed",
        description: error.message || "Unable to dispatch verification code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Login Trigger - Step 2: Verify OTP
  const handleVerifyLoginOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { email: otpEmail, action: "verify", otp: otpCode }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Login successful",
        description: "Redirecting you...",
      });

      if (data.actionLink) {
        window.location.href = data.actionLink;
      } else {
        toast({
          title: "Sign-in error",
          description: "Missing magic link.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Login verification failed",
        description: error.message || "Invalid verification code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Link Trigger
  const handleForgotPasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { action: "forgot-password", email: email.trim() }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Reset link sent",
        description: data.message || "A secure reset link has been dispatched to your email address.",
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error.message || "Unable to send password reset request.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const redirectUrl = `${window.location.origin}${returnUrl}`;
      console.log("Auth: Initiating Google login with redirect:", redirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error("Google Auth Error:", error);
        let description = error.message;

        if (error.message.includes("provider") || error.message.includes("not enabled") || error.message.includes("disabled")) {
          description = "Google sign-in is not yet enabled in your Supabase Dashboard.";
        }

        toast({
          title: "Google login failed",
          description: description,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Google Auth Exception:", error);
      toast({
        title: "Google login failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
    setIsLinkedInLoading(true);
    try {
      const redirectUrl = `${window.location.origin}${returnUrl}`;
      console.log("Auth: Initiating LinkedIn login with redirect:", redirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("LinkedIn Auth Error:", error);
        let description = error.message;

        if (error.message.includes("provider") || error.message.includes("not enabled") || error.message.includes("disabled")) {
          description = "LinkedIn sign-in is not yet enabled in your Supabase Dashboard.";
        }

        toast({
          title: "LinkedIn login failed",
          description: description,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("LinkedIn Auth Exception:", error);
      toast({
        title: "LinkedIn login failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLinkedInLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsFacebookLoading(true);
    try {
      const redirectUrl = `${window.location.origin}${returnUrl}`;
      console.log("Auth: Initiating Facebook login with redirect:", redirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("Facebook Auth Error:", error);
        let description = error.message;

        if (error.message.includes("provider") || error.message.includes("not enabled") || error.message.includes("disabled")) {
          description = "Facebook sign-in is not yet enabled in your Supabase Dashboard.";
        }

        toast({
          title: "Facebook login failed",
          description: description,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Facebook Auth Exception:", error);
      toast({
        title: "Facebook login failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFacebookLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  const LinkedInIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="none">
      <path
        fill="#0A66C2"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );

  const FacebookIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="none">
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );

  return (
    <div className="h-screen flex bg-black text-white overflow-hidden select-none">
      {/* Left-side Image panel */}
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] xl:w-[45%] relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/auth-hero.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/70" />
        <div className="relative z-10 flex items-center gap-2">
          <img
            src="/favicon.png"
            alt="SmartFit AI"
            className="w-7 h-7 object-contain"
            style={{ filter: "drop-shadow(0 0 8px rgba(0, 255, 156, 0.4))" }}
          />
          <span className="font-extrabold text-base tracking-wider text-white">SmartFit <span className="text-[#00ff9c]">AI</span></span>
        </div>
        <div className="relative z-10 space-y-3 max-w-sm">
          <h2 className="text-2xl lg:text-3xl font-black leading-tight text-white">
            Empowering our <span className="text-[#00ff9c]">global community</span> to build their <span className="text-[#00ff9c]">ultimate physique</span>.
          </h2>
          <p className="text-xs text-gray-400 font-medium leading-relaxed">
            AI-powered workouts, smart tracking, expert guidance and a community that motivates you every step of the way.
          </p>
        </div>
      </div>

      {/* Right-side Form panel */}
      <div className="flex-1 flex flex-col justify-center items-center py-6 px-4 md:py-8 md:px-12 h-screen overflow-y-auto">
        <div className="w-full max-w-md space-y-4">
          
          <div>
            <Link to="/" className="text-xs text-gray-500 hover:text-white font-bold transition-colors inline-flex items-center gap-1.5">
              ← Back to Home
            </Link>
          </div>

          {/* Form Headers */}
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">
              {showForgotPassword 
                ? "Reset Password" 
                : activeTab === "login" 
                  ? "Get Started" 
                  : signupStep === "verify-otp"
                    ? "Verify Account"
                    : "Create Account"
              }
            </h1>
            <p className="text-sm text-gray-400">
              {showForgotPassword 
                ? "Enter your email to receive a password reset link."
                : activeTab === "login" 
                  ? authMethod === "password"
                    ? <>Welcome to <span className="text-[#00ff9c]">SmartFitAI</span></> 
                    : "Sign in with a one-time verification code."
                  : signupStep === "verify-otp"
                    ? `Enter the confirmation code sent to ${pendingSignupData?.email}`
                    : "Create an account to join SmartFitAI"
              }
            </p>
          </div>

          {/* Form Switchers */}
          {showForgotPassword ? (
            // Forgot Password Screen
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reset-email" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="reset-email"
                    name="email"
                    type="email"
                    placeholder="name@smartfitai.in"
                    className="pl-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-[#00ff9c] focus:ring-[#00ff9c] text-white rounded-xl h-11 transition-all"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#00ff9c] hover:bg-[#00e08b] text-black font-black h-11 rounded-xl transition-all uppercase text-xs tracking-wider"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-xs text-gray-400 hover:text-white font-bold rounded-xl"
              >
                Back to Login
              </Button>
            </form>
          ) : activeTab === "login" ? (
            // LOGIN FLOWS
            authMethod === "password" ? (
              // 1. Password Login Form
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="name@smartfitai.in"
                      className="pl-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-[#00ff9c] focus:ring-[#00ff9c] text-white rounded-xl h-11 transition-all"
                      required
                      maxLength={255}
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="login-password" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Password</Label>
                    <button 
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-[10px] font-black uppercase tracking-wider text-[#00ff9c] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-12 pr-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-[#00ff9c] focus:ring-[#00ff9c] text-white rounded-xl h-11 transition-all"
                      required
                      minLength={8}
                      maxLength={100}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    type="submit" 
                    className="w-full bg-[#00ff9c] hover:bg-[#00e08b] text-black font-black h-11 rounded-xl transition-all uppercase text-xs tracking-wider"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <div className="relative w-full flex items-center justify-center">
                        <span>LOGIN</span>
                        <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              // 2. OTP Login Form
              otpStep === "request" ? (
                // 2a. Request OTP
                <form onSubmit={handleSendLoginOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="otp-email" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="otp-email"
                        name="email"
                        type="email"
                        placeholder="name@smartfitai.in"
                        className="pl-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-[#00ff9c] focus:ring-[#00ff9c] text-white rounded-xl h-11 transition-all"
                        required
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button 
                      type="submit" 
                      className="w-full bg-[#00ff9c] hover:bg-[#00e08b] text-black font-black h-11 rounded-xl transition-all uppercase text-xs tracking-wider"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending code...
                        </>
                      ) : (
                        "Send Verification Code"
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                // 2b. Verify OTP Screen
                <form onSubmit={handleVerifyLoginOtp} className="space-y-6">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Label className="text-xs font-black uppercase text-gray-400">Enter 6-digit Login Code</Label>
                    <InputOTP 
                      maxLength={6}
                      value={otpCode}
                      onChange={(val) => setOtpCode(val)}
                      disabled={isLoading}
                    >
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot index={0} className="w-12 h-12 text-lg border-white/10 focus:border-primary" />
                        <InputOTPSlot index={1} className="w-12 h-12 text-lg border-white/10 focus:border-primary" />
                        <InputOTPSlot index={2} className="w-12 h-12 text-lg border-white/10 focus:border-primary" />
                        <InputOTPSlot index={3} className="w-12 h-12 text-lg border-white/10 focus:border-primary" />
                        <InputOTPSlot index={4} className="w-12 h-12 text-lg border-white/10 focus:border-primary" />
                        <InputOTPSlot index={5} className="w-12 h-12 text-lg border-white/10 focus:border-primary" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button 
                      type="submit" 
                      className="w-full bg-[#00ff9c] hover:bg-[#00e08b] text-black font-black h-11 rounded-xl transition-all uppercase text-xs tracking-wider"
                      disabled={isLoading || otpCode.length < 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying code...
                        </>
                      ) : (
                        "Verify & Log In"
                      )}
                    </Button>

                    <div className="flex justify-between items-center px-1">
                      <button
                        type="button"
                        onClick={() => setOtpStep("request")}
                        className="text-xs text-gray-500 hover:text-white transition-colors"
                      >
                        Change Email
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpCode("");
                          supabase.functions.invoke("send-otp", { body: { email: otpEmail, action: "send" } })
                            .then(() => toast({ title: "Code Resent", description: "A fresh login OTP code has been dispatched." }));
                        }}
                        className="text-xs text-[#00ff9c] hover:underline transition-all"
                      >
                        Resend Code
                      </button>
                    </div>
                  </div>
                </form>
              )
            )
          ) : (
            // SIGNUP FLOWS
            signupStep === "form" ? (
              // 1. Signup Form Details
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-username" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Username</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="signup-username"
                      name="username"
                      type="text"
                      placeholder="Your username"
                      className="pl-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-[#00ff9c] focus:ring-[#00ff9c] text-white rounded-xl h-11 transition-all"
                      required
                      minLength={2}
                      maxLength={50}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="name@smartfitai.in"
                      className="pl-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-[#00ff9c] focus:ring-[#00ff9c] text-white rounded-xl h-11 transition-all"
                      required
                      maxLength={255}
                    />
                  </div>
                </div>

                 <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="signup-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-12 pr-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-[#00ff9c] focus:ring-[#00ff9c] text-white rounded-xl h-11 transition-all"
                      required
                      minLength={8}
                      maxLength={100}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 tracking-normal leading-normal">
                    Must include uppercase, lowercase, number, and special character.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-[#00ff9c] hover:bg-[#00e08b] text-black font-black h-11 rounded-xl transition-all uppercase text-xs tracking-wider"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            ) : (
              // 2. Signup OTP Verification Screen
              <form onSubmit={handleVerifySignupOtp} className="space-y-6">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <Label className="text-xs font-black uppercase text-gray-400">Enter 6-digit Verification Code</Label>
                  <InputOTP 
                    maxLength={6}
                    value={otpCode}
                    onChange={(val) => setOtpCode(val)}
                    disabled={isLoading}
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} className="w-12 h-12 text-lg border-white/10 focus:border-primary" />
                      <InputOTPSlot index={1} className="w-12 h-12 text-lg border-white/10 focus:border-primary" />
                      <InputOTPSlot index={2} className="w-12 h-12 text-lg border-white/10 focus:border-primary" />
                      <InputOTPSlot index={3} className="w-12 h-12 text-lg border-white/10 focus:border-primary" />
                      <InputOTPSlot index={4} className="w-12 h-12 text-lg border-white/10 focus:border-primary" />
                      <InputOTPSlot index={5} className="w-12 h-12 text-lg border-white/10 focus:border-primary" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    type="submit" 
                    className="w-full bg-[#00ff9c] hover:bg-[#00e08b] text-black font-black h-11 rounded-xl transition-all uppercase text-xs tracking-wider"
                    disabled={isLoading || otpCode.length < 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirming code...
                      </>
                    ) : (
                      "Confirm & Create Account"
                    )}
                  </Button>

                  <div className="flex justify-between items-center px-1">
                    <button
                      type="button"
                      onClick={() => setSignupStep("form")}
                      className="text-xs text-gray-500 hover:text-white transition-colors"
                    >
                      Change Details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpCode("");
                        supabase.functions.invoke("send-email", { body: { action: "signup-otp", email: pendingSignupData?.email } })
                          .then(() => toast({ title: "Code Resent", description: "Verification OTP code resent." }));
                      }}
                      className="text-xs text-[#00ff9c] hover:underline transition-all"
                    >
                      Resend Code
                    </button>
                  </div>
                </div>
              </form>
            )
          )}

          {/* Divider & OAuth Social Login (Disabled for password reset or OTP verification) */}
          {!showForgotPassword && signupStep === "form" && otpStep === "request" && (
            <>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-gray-500">
                  <span className="bg-black px-3">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center justify-center gap-2.5 h-11 bg-transparent border-white/10 hover:bg-white/5 hover:text-white rounded-xl text-white font-bold transition-all text-xs"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>Google</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center justify-center gap-2.5 h-11 bg-transparent border-white/10 hover:bg-white/5 hover:text-white rounded-xl text-white font-bold transition-all text-xs"
                  onClick={handleLinkedInLogin}
                  disabled={isLinkedInLoading}
                >
                  {isLinkedInLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LinkedInIcon />
                  )}
                  <span>LinkedIn</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center justify-center gap-2.5 h-11 bg-transparent border-white/10 hover:bg-white/5 hover:text-white rounded-xl text-white font-bold transition-all text-xs"
                  onClick={handleFacebookLogin}
                  disabled={isFacebookLoading}
                >
                  {isFacebookLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FacebookIcon />
                  )}
                  <span>Facebook</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center justify-center gap-2.5 h-11 bg-transparent border-white/10 hover:bg-white/5 hover:text-white rounded-xl text-white font-bold transition-all text-xs"
                  onClick={() => {
                    if (authMethod === "password") {
                      setAuthMethod("otp");
                      setOtpStep("request");
                    } else {
                      setAuthMethod("password");
                    }
                  }}
                >
                  {authMethod === "password" ? (
                    <>
                      <Mail className="w-5 h-5 shrink-0 text-gray-400" />
                      <span>Email</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 shrink-0 text-gray-400" />
                      <span>Password</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Tab switcher link */}
          {!showForgotPassword && signupStep === "form" && otpStep === "request" && (
            <div className="text-center text-xs text-gray-400 mt-2">
              {activeTab === "login" ? (
                <span>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    className="text-[#00ff9c] hover:underline font-bold transition-all ml-1"
                  >
                    Sign Up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("login");
                      setAuthMethod("password");
                    }}
                    className="text-[#00ff9c] hover:underline font-bold transition-all ml-1"
                  >
                    Login
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Terms & Privacy disclaimer */}
          {!showForgotPassword && signupStep === "form" && otpStep === "request" && (
            <div className="text-[10px] text-center text-gray-500 mt-4 leading-relaxed max-w-sm mx-auto">
              * By continuing, you agree to the{" "}
              <Link to="/terms" className="text-[#00ff9c] hover:underline font-semibold transition-all">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-[#00ff9c] hover:underline font-semibold transition-all">
                Privacy Policy
              </Link>
              .
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
