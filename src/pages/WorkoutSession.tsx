import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/Container";
import PoseDetector from "@/components/PoseDetector";
import { PremiumLock } from "@/components/PremiumLock";

export default function WorkoutSession() {
  return (
    <div className="min-h-screen bg-background py-20">
      <Container>
        <div className="mb-6">
          <Button asChild variant="ghost">
            <Link to="/dashboard" aria-label="Back to dashboard">
              <ArrowLeft className="mr-2" aria-hidden="true" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-2">Workout Session</h1>
            <p className="text-lg md:text-xl leading-relaxed text-gray-300">
              AI-powered pose detection for real-time form tracking
            </p>
          </div>

          <PremiumLock
            title="Unlock Real-Time Form Correction"
            description="Get instant AI feedback on your form to prevent injury and maximize results."
            features={[
              "Live Camera Form Detection",
              "Rep Counting & Analysis",
              "Imbalance Detection",
              "Post-Workout Stats"
            ]}
            plans={[
              {
                id: "monthly",
                name: "Monthly",
                price: "₹299",
                period: "per month",
                priceId: "price_1SpGzZCn98QGMABluEiI28C8",
                badge: "Popular"
              },
              {
                id: "yearly",
                name: "Yearly",
                price: "₹2999",
                period: "per year",
                priceId: "price_1SpH0cCn98QGMABlV6mQUbFO"
              }
            ]}
          >
            <PoseDetector />
          </PremiumLock>
        </div>
      </Container>
    </div>
  );
}
