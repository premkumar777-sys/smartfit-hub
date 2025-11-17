import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PoseDetector from "@/components/PoseDetector";

export default function WorkoutSession() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <Button asChild variant="ghost">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Workout Session</h1>
            <p className="text-muted-foreground">
              AI-powered pose detection for real-time form tracking
            </p>
          </div>

          <PoseDetector />
        </div>
      </div>
    </div>
  );
}
