import { Shield, Eye, Lock, QrCode, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SecurityAccess() {
    const features = [
        "QR Based Contactless Entry",
        "Real-time Access Logs",
        "Automated Attendance",
        "Visitor Management System"
    ];

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="container mx-auto px-6 py-12">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold text-white">Security & Access</h1>
                        <p className="text-xl text-gray-400">Complete control over your fitness facility</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="bg-white/5 border-white/10 overflow-hidden">
                            <CardContent className="p-8 space-y-4">
                                <QrCode className="w-12 h-12 text-[#00FF9C]" />
                                <h2 className="text-2xl font-bold text-white">Smart Entry</h2>
                                <p className="text-gray-400">Contactless QR code scanner for seamless member check-ins and verified access.</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10 overflow-hidden">
                            <CardContent className="p-8 space-y-4">
                                <Shield className="w-12 h-12 text-[#4CC9F0]" />
                                <h2 className="text-2xl font-bold text-white">24/7 Security</h2>
                                <p className="text-gray-400">Monitor your gym anywhere with cloud-based logs and instant alerts for unauthorized attempts.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 space-y-8">
                        <h2 className="text-3xl font-bold text-white text-center">Security Features</h2>
                        <div className="grid sm:grid-cols-2 gap-6">
                            {features.map((feature, i) => (
                                <div key={i} className="flex items-center space-x-3 text-gray-300">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4CC9F0]/20 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-[#4CC9F0]" />
                                    </div>
                                    <span className="text-lg">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
