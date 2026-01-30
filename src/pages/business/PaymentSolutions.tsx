import { BusinessPremiumLock } from "@/components/BusinessPremiumLock";
import { CreditCard, Check, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentSolutions() {
    const features = [
        "Integrated Billing System",
        "Subscription Management",
        "Automated Invoicing",
        "Secure Payment Gateway"
    ];

    return (
        <BusinessPremiumLock
            title="Payment Solutions"
            description="Streamline your gym's revenue with our integrated payment platform."
            features={features}
            lockType="business"
        >
            <div className="container mx-auto px-6 py-12">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold text-white">Payment Solutions</h1>
                        <p className="text-xl text-gray-400">Manage memberships and transactions with ease</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="bg-white/5 border-white/10 overflow-hidden">
                            <CardContent className="p-8 space-y-4">
                                <CreditCard className="w-12 h-12 text-[#00FF9C]" />
                                <h2 className="text-2xl font-bold text-white">Unified Billing</h2>
                                <p className="text-gray-400">Accept all major credit cards, UPI, and digital wallets through a single secure interface.</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10 overflow-hidden">
                            <CardContent className="p-8 space-y-4">
                                <ShieldCheck className="w-12 h-12 text-[#4CC9F0]" />
                                <h2 className="text-2xl font-bold text-white">Secure Processing</h2>
                                <p className="text-gray-400">Bank-grade encryption and fraud protection to keep your gym's financial data safe.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 space-y-8">
                        <h2 className="text-3xl font-bold text-white text-center">Core Capabilities</h2>
                        <div className="grid sm:grid-cols-2 gap-6">
                            {features.map((feature, i) => (
                                <div key={i} className="flex items-center space-x-3 text-gray-300">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00FF9C]/20 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-[#00FF9C]" />
                                    </div>
                                    <span className="text-lg">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </BusinessPremiumLock>
    );
}
