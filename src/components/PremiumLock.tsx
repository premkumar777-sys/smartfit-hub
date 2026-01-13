import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface PremiumLockProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    price?: string;
}

export function PremiumLock({
    children,
    title = "Unlock AI Insights",
    description = "Get deep learning predictions and churn analysis with our Pro plan.",
    price = "$49/mo"
}: PremiumLockProps) {
    return (
        <div className="relative w-full h-full">
            {/* Blurred Content */}
            <div className="filter blur-sm select-none pointer-events-none opacity-50 transition-all duration-500">
                {children}
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-2 border-[#00FF9C]/30 bg-black/80 backdrop-blur-md shadow-[0_0_40px_rgba(0,255,156,0.1)]">
                    <CardContent className="flex flex-col items-center text-center p-8 space-y-6">
                        <div className="p-4 rounded-full bg-[#00FF9C]/10 ring-1 ring-[#00FF9C]/40">
                            <Lock className="w-8 h-8 text-[#00FF9C]" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                {title} <Sparkles className="w-5 h-5 text-yellow-400" />
                            </h3>
                            <p className="text-gray-400">{description}</p>
                        </div>

                        <div className="w-full space-y-3">
                            <div className="text-3xl font-bold text-white">
                                {price}
                                <span className="text-sm font-normal text-gray-500 ml-1">/ billed annually</span>
                            </div>

                            <Button
                                onClick={() => {
                                    toast.success("Redirecting to Secure Checkout...", {
                                        description: "Initiating Stripe payment session for Pro Plan."
                                    });
                                }}
                                className="w-full bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black font-bold h-12 text-lg shadow-[0_0_20px_rgba(0,255,156,0.4)] transition-all hover:scale-[1.02]"
                            >
                                Upgrade to Pro
                            </Button>

                            <p className="text-xs text-gray-500">
                                Includes 7-day free trial. Cancel anytime.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
