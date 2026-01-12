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

// Loading component with Supabase-style circular spinner
const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden">
    <div className="text-center relative">
      {/* Supabase-style circular spinner ring */}
      <div className="relative w-28 h-28 mx-auto mb-4">
        {/* Rotating border ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '3px solid transparent',
            borderTopColor: '#00FF9C',
            borderRightColor: '#00FF9C',
            animation: 'spin 1s linear infinite',
            filter: 'drop-shadow(0 0 8px rgba(0, 255, 156, 0.5))'
          }}
        />
        {/* Second ring with delay for effect */}
        <div
          className="absolute inset-1 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: 'rgba(0, 255, 156, 0.3)',
            animation: 'spin 1.5s linear infinite reverse'
          }}
        />
        {/* Runner icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/favicon.png"
            alt="SmartFit"
            className="w-16 h-16"
            style={{
              filter: 'drop-shadow(0 0 15px rgba(0, 255, 156, 0.4))'
            }}
          />
        </div>
      </div>

      <p className="text-muted-foreground">Loading SmartFit...</p>

      {/* Custom keyframes */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
