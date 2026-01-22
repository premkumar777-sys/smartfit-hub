import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Container } from "@/components/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Crown } from "lucide-react";
import { toast } from "sonner";

// Duration mapping for plans based on amount
const PLAN_DURATIONS: Record<string, number> = {
    "99": 30,    // 1 month
    "399": 180,  // 6 months  
    "699": 365,  // 1 year
};

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const processPayment = async () => {
            try {
                // Get payment info from URL params (Instamojo sends these)
                const paymentId = searchParams.get("payment_id");
                const paymentStatus = searchParams.get("payment_status");
                const paymentRequestId = searchParams.get("payment_request_id");

                console.log("Payment params:", { paymentId, paymentStatus, paymentRequestId });

                // Check if payment was successful
                if (paymentStatus !== "Credit") {
                    setStatus("error");
                    setMessage("Payment was not successful. Please try again.");
                    return;
                }

                if (!paymentId) {
                    setStatus("error");
                    setMessage("No payment information found.");
                    return;
                }

                // Get current user
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setStatus("error");
                    setMessage("Please log in to activate your subscription.");
                    return;
                }

                // Get premium plan ID
                const { data: plan } = await supabase
                    .from("plans")
                    .select("id")
                    .ilike("name", "%prem%")
                    .limit(1)
                    .single();

                const planId = plan?.id || "premium";

                // Determine subscription duration (default 30 days for ₹99)
                // In production, you'd verify the amount from Instamojo API
                const durationDays = 30; // Default to 1 month

                const now = new Date();

                // Check if user already has a subscription
                const { data: existingSub } = await supabase
                    .from("subscriptions")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("status", "active")
                    .limit(1)
                    .single();

                let endDate: Date;

                if (existingSub && existingSub.current_period_end) {
                    // Extend existing subscription
                    const currentEnd = new Date(existingSub.current_period_end);
                    const startDate = currentEnd > now ? currentEnd : now;
                    endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + durationDays);

                    const { error } = await supabase
                        .from("subscriptions")
                        .update({
                            current_period_end: endDate.toISOString(),
                            updated_at: now.toISOString(),
                        })
                        .eq("id", existingSub.id);

                    if (error) throw error;
                } else {
                    // Create new subscription
                    endDate = new Date(now);
                    endDate.setDate(endDate.getDate() + durationDays);

                    const { error } = await supabase
                        .from("subscriptions")
                        .insert({
                            user_id: user.id,
                            plan_id: planId,
                            status: "active",
                            billing_cycle: "monthly",
                            current_period_start: now.toISOString(),
                            current_period_end: endDate.toISOString(),
                            cancel_at_period_end: false,
                            created_at: now.toISOString(),
                            updated_at: now.toISOString(),
                        });

                    if (error) throw error;
                }

                setStatus("success");
                setMessage(`Your Pro subscription is now active until ${endDate.toLocaleDateString()}!`);
                toast.success("🎉 Pro subscription activated!");

            } catch (error: any) {
                console.error("Payment processing error:", error);
                setStatus("error");
                setMessage(error.message || "Something went wrong. Please contact support.");
            }
        };

        processPayment();
    }, [searchParams]);

    return (
        <div className="min-h-screen py-20 gradient-bg">
            <Container className="max-w-md">
                <Card className="glass border-primary/20">
                    <CardHeader className="text-center">
                        {status === "loading" && (
                            <>
                                <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
                                <CardTitle>Processing Payment...</CardTitle>
                            </>
                        )}
                        {status === "success" && (
                            <>
                                <div className="w-20 h-20 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-12 h-12 text-green-500" />
                                </div>
                                <CardTitle className="text-green-500 flex items-center justify-center gap-2">
                                    <Crown className="w-6 h-6 text-yellow-500" />
                                    Payment Successful!
                                </CardTitle>
                            </>
                        )}
                        {status === "error" && (
                            <>
                                <div className="w-20 h-20 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                                    <XCircle className="w-12 h-12 text-red-500" />
                                </div>
                                <CardTitle className="text-red-500">Payment Failed</CardTitle>
                            </>
                        )}
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-muted-foreground">{message}</p>

                        {status === "success" && (
                            <div className="space-y-3">
                                <p className="text-sm text-primary">
                                    You now have access to all Pro features!
                                </p>
                                <Button
                                    onClick={() => navigate("/dashboard")}
                                    className="w-full bg-primary"
                                >
                                    Go to Dashboard
                                </Button>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="space-y-3">
                                <Button
                                    onClick={() => navigate("/dashboard")}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Go to Dashboard
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    Need help? Contact us at smartfitai77@gmail.com
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </div>
    );
}
