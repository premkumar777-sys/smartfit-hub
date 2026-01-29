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
import Profile from "./pages/Profile";
import PaymentSuccess from "./pages/PaymentSuccess";
import VerifyPayment from "./pages/VerifyPayment";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";

import GymAnalytics from "./pages/GymAnalytics";
import TrainerTools from "./pages/TrainerTools";
import OnlineCoaching from "./pages/OnlineCoaching";
import GymFinder from "./pages/GymFinder";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import BMICalculator from "./pages/BMICalculator";
import ShippingPolicy from "./pages/ShippingPolicy";
import ContactUs from "./pages/ContactUs";
import NotFound from "./pages/NotFound";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { Footer } from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

// Loading component with Supabase-style circular spinner
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center overflow-hidden" style={{ background: '#0a0a0a' }}>
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
    }, 500);

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
            <ErrorBoundary>
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
                <Route path="/bmi-calculator" element={<BMICalculator />} />
                <Route path="/3d-trainer" element={<CameraOffWorkout />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/pricing" element={<Pricing />} />

                <Route path="/gym-analytics" element={<GymAnalytics />} />
                <Route path="/gym-analytics/ai" element={<GymAnalytics />} />
                <Route path="/trainer-tools" element={<TrainerTools />} />
                <Route path="/online-coaching" element={<OnlineCoaching />} />
                <Route path="/gyms/*" element={<GymFinder />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/refund" element={<RefundPolicy />} />
                <Route path="/shipping" element={<ShippingPolicy />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/upgrade" element={<VerifyPayment />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Footer />
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
