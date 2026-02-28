import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { Footer } from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Loader2 } from "lucide-react";
import { InstallPrompt } from "@/components/InstallPrompt";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const AIWorkout = lazy(() => import("./pages/AIWorkout"));
const Nutrition = lazy(() => import("./pages/Nutrition"));
const Progress = lazy(() => import("./pages/Progress"));
const Guides = lazy(() => import("./pages/Guides"));
const HomeWorkouts = lazy(() => import("./pages/HomeWorkouts"));
const AITrainer = lazy(() => import("./pages/AITrainer"));
const Gamification = lazy(() => import("./pages/Gamification"));
const CameraOffWorkout = lazy(() => import("./pages/CameraOffWorkout"));
const Profile = lazy(() => import("./pages/Profile"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const VerifyPayment = lazy(() => import("./pages/VerifyPayment"));
const Settings = lazy(() => import("./pages/Settings"));
const Pricing = lazy(() => import("./pages/Pricing"));
const GymAnalytics = lazy(() => import("./pages/GymAnalytics"));
const TrainerTools = lazy(() => import("./pages/TrainerTools"));
const OnlineCoaching = lazy(() => import("./pages/OnlineCoaching"));
const GymFinder = lazy(() => import("./pages/GymFinder"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const BusinessLanding = lazy(() => import("./pages/business/BusinessLanding"));
const PaymentSolutions = lazy(() => import("./pages/business/PaymentSolutions"));
const SecurityAccess = lazy(() => import("./pages/business/SecurityAccess"));
const EquipmentIntegration = lazy(() => import("./pages/business/EquipmentIntegration"));
const RoadToICN = lazy(() => import("./pages/RoadToICN"));
const WorkoutSession = lazy(() => import("./pages/WorkoutSession"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <InstallPrompt />
          <BrowserRouter>
            <ScrollToTop />
            <ErrorBoundary>
              <FloatingChatbot />
              <Header />
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/ai-workout" element={<AIWorkout />} />
                  <Route path="/nutrition" element={<Nutrition />} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/guides" element={<Guides />} />
                  <Route path="/home-workouts" element={<HomeWorkouts />} />
                  <Route path="/ai-trainer" element={<AITrainer />} />
                  <Route path="/gamification" element={<Gamification />} />
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
                  <Route path="/road-to-icn" element={<RoadToICN />} />
                  <Route path="/workout-session" element={<WorkoutSession />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <Footer />
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
