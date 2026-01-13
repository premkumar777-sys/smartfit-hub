import { Container } from "@/components/Container";
import { ComingSoon } from "@/components/ComingSoon";
import { Laptop } from "lucide-react";

export default function OnlineCoaching() {
    return (
        <div className="min-h-screen py-20 relative overflow-hidden">
            <Container className="relative z-10">
                <ComingSoon
                    feature="Online Video Coaching"
                    description="Connect with certified trainers for 1-on-1 remote video sessions, form correction, and personalized guidance."
                >
                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
                        <div className="p-6 rounded-full bg-[#00FF9C]/10 ring-1 ring-[#00FF9C]/20">
                            <Laptop className="w-16 h-16 text-[#00FF9C]" />
                        </div>
                        <h2 className="text-3xl font-bold text-white">Find Your Perfect Coach</h2>
                        <p className="text-gray-400 max-w-lg">
                            Browse expert trainers by specialization, schedule live video calls, and get real-time feedback from the comfort of your home.
                        </p>
                    </div>
                </ComingSoon>
            </Container>
        </div>
    );
}
