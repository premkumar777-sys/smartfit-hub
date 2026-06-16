import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Loader2, Mail, Lock, User } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

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

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;

    try {
      const validated = authSchema.parse({ email, password, username });
      const redirectUrl = `${window.location.origin}/dashboard`;

      const { error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: validated.username,
          },
        },
      });

      if (error) {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Account created!",
        description: "You've successfully signed up.",
      });
      navigate(returnUrl);
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
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
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
          description = "Google sign-in is not yet enabled in your Supabase Dashboard. Please follow the implementation plan to enable it.";
        } else if (error.message.includes("client_id") || error.message.includes("client_secret")) {
          description = "Invalid Google Client ID or Secret in Supabase settings. Please check your Dashboard.";
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

  const GoogleIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#ffffff"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#ffffff"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#ffffff"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#ffffff"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  const AppleIcon = () => (
    <svg className="w-5 h-5 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.64.73-1.2 1.87-1.05 2.98 1.11.09 2.27-.58 2.98-1.43z"/>
    </svg>
  );

  return (
    <div className="min-h-screen flex bg-black text-white">
      {/* Left-side Image panel - matching target mock */}
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] xl:w-[45%] relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/auth-hero.png')` }}
        />
        {/* Dark radial and gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/70" />
        
        {/* Top Branding Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <img src="/favicon.png" alt="SmartFitAI Logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-black uppercase tracking-wider text-white">SmartFitAI</span>
        </div>

        {/* Bottom Tagline */}
        <div className="relative z-10 space-y-4 max-w-sm">
          <h2 className="text-2xl lg:text-3xl font-black leading-tight text-white">
            Empowering our <span className="text-red-500">global community</span> to build their <span className="text-red-500">ultimate physique</span>.
          </h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">SmartFitAI Platform</p>
        </div>
      </div>

      {/* Right-side Form panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          
          {/* Form Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Get Started</h1>
            <p className="text-sm text-gray-400">
              {activeTab === "login" ? "Welcome to SmartFitAI — Let's get started" : "Create an account to join SmartFitAI"}
            </p>
          </div>

          {/* Form Tabs Trigger */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "login" ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "signup" ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Inputs Container */}
          {activeTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="name@smartfitai.in"
                    className="pl-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-red-600 focus:ring-red-600 text-white rounded-xl h-12 transition-all"
                    required
                    maxLength={255}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-red-600 focus:ring-red-600 text-white rounded-xl h-12 transition-all"
                    required
                    minLength={8}
                    maxLength={100}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black h-12 rounded-xl transition-all uppercase text-xs tracking-wider"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="signup-username" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Username</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="signup-username"
                    name="username"
                    type="text"
                    placeholder="Your username"
                    className="pl-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-red-600 focus:ring-red-600 text-white rounded-xl h-12 transition-all"
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="name@smartfitai.in"
                    className="pl-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-red-600 focus:ring-red-600 text-white rounded-xl h-12 transition-all"
                    required
                    maxLength={255}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-red-600 focus:ring-red-600 text-white rounded-xl h-12 transition-all"
                    required
                    minLength={8}
                    maxLength={100}
                  />
                </div>
                <p className="text-[10px] text-gray-500 tracking-normal leading-normal">
                  Must include uppercase, lowercase, number, and special character.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black h-12 rounded-xl transition-all uppercase text-xs tracking-wider"
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
          )}

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-gray-500">
              <span className="bg-black px-3">Or continue with</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2.5 h-12 bg-transparent border-white/10 hover:bg-white/5 hover:text-white rounded-xl text-white font-bold transition-all text-xs"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span>Login with Google</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2.5 h-12 bg-transparent border-white/10 hover:bg-white/5 hover:text-white rounded-xl text-white font-bold transition-all text-xs"
              onClick={() => toast({ title: "Apple Auth", description: "Apple authentication is currently being configured." })}
            >
              <AppleIcon />
              <span>Login with Apple</span>
            </Button>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center text-xs text-gray-500 font-bold pt-4 border-t border-white/5">
            <Link to="/auth" onClick={() => toast({ title: "Reset Password", description: "Password reset link sent to your registered email address." })} className="hover:text-white transition-colors">
              Forgot password?
            </Link>
            <Link to="/" className="hover:text-white transition-colors flex items-center gap-1.5">
              ← Back to Home
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
