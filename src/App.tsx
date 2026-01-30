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

import BusinessLanding from "./pages/business/BusinessLanding";
import PaymentSolutions from "./pages/business/PaymentSolutions";
import SecurityAccess from "./pages/business/SecurityAccess";
import EquipmentIntegration from "./pages/business/EquipmentIntegration";

import NotFound from "./pages/NotFound";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { Footer } from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
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

                <Route path="/business" element={<BusinessLanding />} />
                <Route path="/business/payments" element={<PaymentSolutions />} />
                <Route path="/business/security" element={<SecurityAccess />} />
                <Route path="/business/equipment" element={<EquipmentIntegration />} />

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
