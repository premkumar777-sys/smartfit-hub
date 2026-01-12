import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import AIWorkout from "./pages/AIWorkout";
import WorkoutSession from "./pages/WorkoutSession";
import Nutrition from "./pages/Nutrition";
import Progress from "./pages/Progress";
import Guides from "./pages/Guides";
import HomeWorkouts from "./pages/HomeWorkouts";
import AITrainer from "./pages/AITrainer";
import Gamification from "./pages/Gamification";
import CameraOffWorkout from "./pages/CameraOffWorkout";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import GymAnalytics from "./pages/GymAnalytics";
import NotFound from "./pages/NotFound";
import { FitnessCursor } from "@/components/FitnessCursor";
import { FloatingChatbot } from "@/components/FloatingChatbot";

const queryClient = new QueryClient();

// Loading component with running animation
const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden">
    <div className="text-center relative">
      {/* Glowing trail effect behind the runner */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-24 h-24 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(0,255,156,0.4) 0%, transparent 70%)',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        />
      </div>

      {/* Runner icon with running animation */}
      <img
        src="/favicon.png"
        alt="SmartFit"
        className="w-24 h-24 mx-auto mb-4 relative z-10"
        style={{
          filter: 'drop-shadow(0 0 20px rgba(0, 255, 156, 0.6))',
          animation: 'runBounce 0.6s ease-in-out infinite'
        }}
      />

      {/* Running track line */}
      <div className="w-32 h-1 mx-auto mb-4 rounded-full overflow-hidden bg-muted">
        <div
          className="h-full bg-primary rounded-full"
          style={{
            animation: 'runTrack 1s ease-in-out infinite'
          }}
        />
      </div>

      <p className="text-muted-foreground">Loading SmartFit...</p>

      {/* Custom keyframes */}
      <style>{`
        @keyframes runBounce {
          0%, 100% { transform: translateY(0) translateX(-3px); }
          50% { transform: translateY(-8px) translateX(3px); }
        }
        @keyframes runTrack {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 0.5; }
        }
      `}</style>
    </div>
  </div>
);

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time to show the loading screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <FitnessCursor />
            <FloatingChatbot />
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/ai-workout" element={<AIWorkout />} />
              <Route path="/workout-session" element={<WorkoutSession />} />
              <Route path="/nutrition" element={<Nutrition />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/home-workouts" element={<HomeWorkouts />} />
              <Route path="/ai-trainer" element={<AITrainer />} />
              <Route path="/gamification" element={<Gamification />} />
              <Route path="/3d-trainer" element={<CameraOffWorkout />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/product/:handle" element={<ProductDetail />} />
              <Route path="/gym-analytics" element={<GymAnalytics />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
