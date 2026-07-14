import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Container } from "@/components/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Crown } from "lucide-react";
import { toast } from "sonner";

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("We are verifying your transaction...");
    const [expiryDate, setExpiryDate] = useState<string | null>(null);

    useEffect(() => {
        const processPaymentVerification = async () => {
            try {
                const paymentId = searchParams.get("payment_id");
                const paymentStatus = searchParams.get("payment_status");
                const paymentRequestId = searchParams.get("payment_request_id");

                console.log("Payment redirect params:", { paymentId, paymentStatus, paymentRequestId });

                // Check basic Instamojo redirection parameters
                if (paymentStatus && paymentStatus !== "Credit") {
                    setStatus("error");
                    setMessage("Payment was not successful. Please try checking your banking details or contact support.");
                    return;
                }

                if (!paymentId) {
                    setStatus("error");
                    setMessage("No transaction information found. If you believe this is an error, please verify your bank records.");
                    return;
                }

                // Retrieve authenticated user
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) {
                    setStatus("error");
                    setMessage("Unable to locate user credentials. Please sign in to access your dashboard.");
                    return;
                }

                // Poll database for subscription activation status (driven by backend webhook)
                let attempts = 0;
                const maxAttempts = 12; // 18 seconds total
                const delayMs = 1500;
                let activeSubscription = null;

                while (attempts < maxAttempts) {
                    attempts++;
                    console.log(`[PaymentSuccess] Checking database for subscription (Attempt ${attempts}/${maxAttempts})...`);
                    
                    const { data: sub, error: subError } = await supabase
                        .from("subscriptions")
                        .select("id, status, current_period_end")
                        .eq("user_id", user.id)
                        .eq("status", "active")
                        .order("current_period_end", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (sub && new Date(sub.current_period_end) > new Date()) {
                        activeSubscription = sub;
                        break;
                    }

                    // Wait for webhook execution
                    await new Promise((resolve) => setTimeout(resolve, delayMs));
                }

                if (activeSubscription) {
                    const formattedDate = new Date(activeSubscription.current_period_end).toLocaleDateString();
                    setExpiryDate(formattedDate);
                    setStatus("success");
                    setMessage(`Your Pro subscription has been verified and is active until ${formattedDate}!`);
                    toast.success("🎉 Pro subscription activated successfully!");
                } else {
                    setStatus("error");
                    setMessage("Your payment is being processed. It may take a moment to update your profile. Please refresh this page in a minute or contact support.");
                }

            } catch (error: any) {
                console.error("PaymentSuccess verification error:", error);
                setStatus("error");
                setMessage(error.message || "An unexpected error occurred during receipt verification.");
            }
        };

        processPaymentVerification();
    }, [searchParams]);

    return (
        <div className="min-h-screen py-20 gradient-bg flex items-center justify-center text-white">
            <Container className="max-w-md">
                <Card className="glass border-primary/20 bg-zinc-950/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
                    <CardHeader className="text-center">
                        {status === "loading" && (
                            <>
                                <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
                                <CardTitle className="text-xl font-bold tracking-tight">Verifying Payment...</CardTitle>
                            </>
                        )}
                        {status === "success" && (
                            <>
                                <div className="w-20 h-20 mx-auto mb-4 bg-green-500/10 border border-green-500/25 rounded-full flex items-center justify-center text-green-500">
                                    <CheckCircle className="w-12 h-12" />
                                </div>
                                <CardTitle className="text-green-500 flex items-center justify-center gap-2 text-2xl font-black">
                                    <Crown className="w-6 h-6 text-yellow-500 animate-bounce" />
                                    Payment Verified!
                                </CardTitle>
                            </>
                        )}
                        {status === "error" && (
                            <>
                                <div className="w-20 h-20 mx-auto mb-4 bg-red-500/10 border border-red-500/25 rounded-full flex items-center justify-center text-red-500">
                                    <XCircle className="w-12 h-12" />
                                </div>
                                <CardTitle className="text-red-500 text-2xl font-black">Payment Pending / Failed</CardTitle>
                            </>
                        )}
                    </CardHeader>
                    <CardContent className="text-center space-y-6">
                        <p className="text-sm text-gray-400 leading-relaxed">{message}</p>

                        {status === "success" && (
                            <div className="space-y-3">
                                <p className="text-xs text-primary font-bold uppercase tracking-wider">
                                    Full Pro features unlocked
                                </p>
                                <Button
                                    onClick={() => navigate("/dashboard")}
                                    className="w-full bg-[#00ff9c] hover:bg-[#00e08b] text-black font-black h-11 rounded-xl uppercase text-xs tracking-wider transition-all"
                                >
                                    Go to Dashboard
                                </Button>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="space-y-3">
                                <Button
                                    onClick={() => navigate("/pricing")}
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold h-11 rounded-xl text-xs uppercase tracking-wider transition-all"
                                >
                                    Retry Subscription
                                </Button>
                                <Button
                                    onClick={() => navigate("/dashboard")}
                                    variant="ghost"
                                    className="w-full text-xs text-gray-500 hover:text-white"
                                >
                                    Go to Dashboard
                                </Button>
                                <p className="text-xs text-zinc-600">
                                    Questions? Contact support at founder@smartfitai.in
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </div>
    );
}
