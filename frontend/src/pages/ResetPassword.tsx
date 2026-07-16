import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Container } from "@/components/Container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, ShieldCheck, CheckCircle } from "lucide-react";
import { z } from "zod";

const passwordSchema = z.string()
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
  });

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !token) {
      toast({
        title: "Invalid reset request",
        description: "Missing email or token parameters in URL.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords mismatch",
        description: "Your passwords do not match. Please verify them.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Validate password strength
      passwordSchema.parse(password);

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          action: "reset-password",
          email: email.trim(),
          data: {
            token: token,
            password: password
          }
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setIsSuccess(true);
      toast({
        title: "Success",
        description: "Your password has been successfully reset.",
      });
    } catch (err: any) {
      console.error("Reset password error:", err);
      toast({
        title: "Password reset failed",
        description: err.message || "Could not update password. Token might be invalid or expired.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <div className="min-h-screen py-20 bg-black flex flex-col items-center justify-center p-6 text-white text-center">
        <Card className="max-w-md w-full bg-[#111111]/85 backdrop-blur-md border-red-500/20 p-8 rounded-3xl space-y-4">
          <CardHeader>
            <CardTitle className="text-red-500 text-xl font-bold">Invalid or Expired Request</CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              The reset link you followed is invalid or missing critical tokens. Please request a new link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/auth">
              <Button className="w-full bg-[#00ff9c] hover:bg-[#00e08b] text-black font-bold h-11 rounded-xl">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white relative overflow-hidden bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -right-48 w-[500px] h-[500px] bg-[#00ff9c]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-48 w-[500px] h-[500px] bg-[#00b8ff]/5 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      <Container className="max-w-md relative z-10">
        <Card className="bg-zinc-900/40 border border-white/[0.06] backdrop-blur-2xl p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-300">
              <ShieldCheck className="w-6 h-6 text-[#00ff9c] drop-shadow-[0_0_10px_rgba(0,255,156,0.3)]" />
              Reset Password
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs mt-1">
              Enter your new secure password for <span className="text-[#00ff9c]">{email}</span>.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isSuccess ? (
              <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Password Updated</h3>
                <p className="text-xs text-muted-foreground leading-normal max-w-xs mx-auto">
                  Your password has been changed. You can now log into your account with your new password.
                </p>
                <Button 
                  onClick={() => navigate("/auth")}
                  className="w-full bg-gradient-to-r from-[#00ff9c] to-[#00b8ff] hover:from-[#00e08b] hover:to-[#00a3e0] text-black font-extrabold h-11 rounded-xl transition-all duration-300 uppercase text-xs tracking-wider shadow-[0_0_15px_rgba(0,255,156,0.15)] hover:shadow-[0_0_20px_rgba(0,255,156,0.3)] hover:-translate-y-[1px]"
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-[10px] font-black uppercase tracking-wider text-gray-400">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-[#00ff9c] focus:ring-1 focus:ring-[#00ff9c] focus:shadow-[0_0_15px_rgba(0,255,156,0.1)] text-white rounded-xl h-11 transition-all duration-300"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-[10px] font-black uppercase tracking-wider text-gray-400">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-[#00ff9c] focus:ring-1 focus:ring-[#00ff9c] focus:shadow-[0_0_15px_rgba(0,255,156,0.1)] text-white rounded-xl h-11 transition-all duration-300"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <p className="text-[10px] text-gray-500 tracking-normal leading-normal">
                  Password criteria: minimum 8 characters, must include uppercase, lowercase, digit, and special character.
                </p>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#00ff9c] to-[#00b8ff] hover:from-[#00e08b] hover:to-[#00a3e0] text-black font-extrabold h-11 rounded-xl transition-all duration-300 uppercase text-xs tracking-wider shadow-[0_0_15px_rgba(0,255,156,0.15)] hover:shadow-[0_0_20px_rgba(0,255,156,0.3)] hover:-translate-y-[1px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
