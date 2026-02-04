import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Container } from "@/components/Container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Crown, CreditCard, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PRO_PLANS, openPaymentLink } from "@/config/payments";

export default function VerifyPayment() {
    const navigate = useNavigate();
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [paymentId, setPaymentId] = useState("");
    const [selectedPlan, setSelectedPlan] = useState(PRO_PLANS[0]);

    const handlePayNow = () => {
        // Open payment link in new tab
        openPaymentLink(selectedPlan.link);
        toast.info("Complete payment in the new tab, then come back and click 'Verify Payment'");
    };

    const handleVerifyPayment = async () => {
        if (!paymentId.trim()) {
            toast.error("Please enter your Payment ID from Instamojo");
            return;
        }

        // Basic validation - Instamojo payment IDs start with MOJO
        const trimmedPaymentId = paymentId.trim().toUpperCase();
        if (!trimmedPaymentId.startsWith("MOJO") || trimmedPaymentId.length < 10) {
            toast.error("Invalid Payment ID format. It should start with 'MOJO'");
            return;
        }

        setIsVerifying(true);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error("Please log in first");
                navigate("/auth");
                return;
            }

            // Check if this payment ID has already been used
            const { data: existingPayment, error: checkError } = await supabase
                .from("used_payments")
                .select("id, user_id")
                .eq("payment_id", trimmedPaymentId)
                .maybeSingle();

            if (checkError && checkError.code !== "42P01") {
                console.error("Error checking payment:", checkError);
            }

            if (existingPayment) {
                if (existingPayment.user_id === user.id) {
                    toast.error("You have already used this payment ID");
                } else {
                    toast.error("This payment ID has already been used by another account");
                }
                setIsVerifying(false);
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

            // Determine duration based on selected plan
            let durationDays = 30;
            if (selectedPlan.price === "₹399") durationDays = 180;
            if (selectedPlan.price === "₹699") durationDays = 365;

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

            // Save the payment ID to prevent reuse
            const { error: paymentError } = await supabase
                .from("used_payments")
                .insert({
                    payment_id: trimmedPaymentId,
                    user_id: user.id,
                    amount: parseFloat(selectedPlan.price.replace("₹", "")),
                    plan_name: selectedPlan.name,
                });
            
            if (paymentError) {
                console.log("Could not save payment ID:", paymentError);
            }

            setIsSuccess(true);
            toast.success("🎉 Pro subscription activated!");

        } catch (error: any) {
            console.error("Verification error:", error);
            toast.error(error.message || "Verification failed. Please contact support.");
        } finally {
            setIsVerifying(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen py-20 gradient-bg">
                <Container className="max-w-md">
                    <Card className="glass border-green-500/30">
                        <CardHeader className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                            <CardTitle className="text-green-500 flex items-center justify-center gap-2">
                                <Crown className="w-6 h-6 text-yellow-500" />
                                Pro Access Activated!
                            </CardTitle>
                            <CardDescription>
                                You now have access to all premium features
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <Button
                                onClick={() => navigate("/dashboard")}
                                className="w-full bg-primary"
                            >
                                Go to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                </Container>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-20 gradient-bg">
            <Container className="max-w-lg">
                <Card className="glass border-primary/20">
                    <CardHeader className="text-center">
                        <CreditCard className="w-12 h-12 mx-auto mb-4 text-primary" />
                        <CardTitle className="text-2xl">Upgrade to Pro</CardTitle>
                        <CardDescription>
                            Complete payment and verify to activate your subscription
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Step 1: Select Plan */}
                        <div className="space-y-3">
                            <Label className="text-lg font-semibold">Step 1: Select Plan</Label>
                            <div className="grid gap-2">
                                {PRO_PLANS.map((plan) => (
                                    <div
                                        key={plan.id}
                                        onClick={() => setSelectedPlan(plan)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedPlan.id === plan.id
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="font-semibold">{plan.name}</span>
                                                <span className="text-muted-foreground ml-2">({plan.period})</span>
                                            </div>
                                            <span className="text-xl font-bold text-primary">{plan.price}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Pay */}
                        <div className="space-y-3">
                            <Label className="text-lg font-semibold">Step 2: Pay on Instamojo</Label>
                            <Button
                                onClick={handlePayNow}
                                className="w-full bg-green-600 hover:bg-green-700"
                                size="lg"
                            >
                                Pay {selectedPlan.price} Now
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Opens Instamojo in a new tab. After payment, come back here.
                            </p>
                        </div>

                        {/* Step 3: Verify */}
                        <div className="space-y-3 pt-4 border-t">
                            <Label className="text-lg font-semibold">Step 3: Verify Payment</Label>
                            <p className="text-sm text-muted-foreground">
                                After paying, enter your Payment ID from the Instamojo receipt/email:
                            </p>
                            <Input
                                placeholder="Enter Payment ID (e.g., MOJO12345...)"
                                value={paymentId}
                                onChange={(e) => setPaymentId(e.target.value)}
                            />
                            <Button
                                onClick={handleVerifyPayment}
                                disabled={isVerifying || !paymentId.trim()}
                                className="w-full"
                                size="lg"
                            >
                                {isVerifying ? (
                                    <>
                                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify & Activate Pro"
                                )}
                            </Button>
                        </div>

                        {/* Note */}
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm">
                            <p className="text-yellow-400">
                                <strong>Note:</strong> If you face any issues, email your payment receipt to{" "}
                                <a href="mailto:smartfitai77@gmail.com" className="underline">
                                    smartfitai77@gmail.com
                                </a>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </Container>
        </div>
    );
}
