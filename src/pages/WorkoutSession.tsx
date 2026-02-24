import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/Container";
import PoseDetector from "@/components/PoseDetector";

export default function WorkoutSession() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background py-20">
      <Container>
        <div className="mb-6">
          <Button onClick={() => navigate(-1)} variant="ghost">
            <ArrowLeft className="mr-2" aria-hidden="true" />
            Back
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-2">Workout Session</h1>
            <p className="text-lg md:text-xl leading-relaxed text-gray-300">
              AI-powered pose detection for real-time form tracking
            </p>
          </div>

          <PoseDetector />
        </div>
      </Container>
    </div>
  );
}
