import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { Footer } from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Loader2 } from "lucide-react";
import { InstallPrompt } from "@/components/InstallPrompt";
import CookieConsent from "@/components/CookieConsent";
import { MotionConfig } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

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
const BecomeCoach = lazy(() => import("./pages/BecomeCoach"));
const GymFinder = lazy(() => import("./pages/GymFinder"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const DeleteAccount = lazy(() => import("./pages/DeleteAccount"));
const BusinessLanding = lazy(() => import("./pages/business/BusinessLanding"));
const PaymentSolutions = lazy(() => import("./pages/business/PaymentSolutions"));
const SecurityAccess = lazy(() => import("./pages/business/SecurityAccess"));
const EquipmentIntegration = lazy(() => import("./pages/business/EquipmentIntegration"));
const RoadToICN = lazy(() => import("./pages/RoadToICN"));
const WorkoutSession = lazy(() => import("./pages/WorkoutSession"));
const Giveaway = lazy(() => import("./pages/Giveaway"));
const NotFound = lazy(() => import("./pages/NotFound"));

import { SplashScreen } from "@/components/SplashScreen";
import { BottomNavigation } from "@/components/BottomNavigation";

const queryClient = new QueryClient();

const AppContent = () => {
  const prefersReducedMotion = useReducedMotion();
  const location = useLocation();

  const isAuthPage = location.pathname === "/auth";
  const isWorkoutSessionPage = location.pathname === "/workout-session";
  const hideLayout = isAuthPage || isWorkoutSessionPage;

  const isConfigMissing = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co';

  if (isConfigMissing) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-[#111111]/85 backdrop-blur-md p-8 rounded-3xl border border-red-500/20 space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-500 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Supabase Configuration Required</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            The application is missing database credentials. Please configure the environment variables on your hosting platform (Vercel, Netlify, etc.):
          </p>
          <div className="bg-black/50 p-4 rounded-xl font-mono text-xs text-left space-y-2 border border-white/5">
            <div className="text-gray-500"># Add these to environment settings:</div>
            <div><span className="text-[#00FF9C]">VITE_SUPABASE_URL</span>=your_supabase_url</div>
            <div><span className="text-[#00FF9C]">VITE_SUPABASE_ANON_KEY</span>=your_supabase_anon_key</div>
          </div>
          <p className="text-xs text-zinc-500 leading-normal">
            Note: After adding them to your deployment dashboard, you must trigger a new deploy/build for the bundler to embed them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "user"}>
      <Toaster />
      <Sonner />
      <InstallPrompt />
      <ScrollToTop />
      <CookieConsent />
      <ErrorBoundary>
        {!hideLayout && <FloatingChatbot />}
        {!hideLayout && <Header />}
        <Suspense fallback={<SplashScreen />}>
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
            <Route path="/become-a-coach" element={<BecomeCoach />} />
            <Route path="/gyms/*" element={<GymFinder />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/refund" element={<RefundPolicy />} />
            <Route path="/shipping" element={<ShippingPolicy />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/upgrade" element={<VerifyPayment />} />
            <Route path="/road-to-icn" element={<RoadToICN />} />
            <Route path="/workout-session" element={<WorkoutSession />} />
            <Route path="/giveaway" element={<Giveaway />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        {!hideLayout && <BottomNavigation />}
        {!hideLayout && <Footer />}
      </ErrorBoundary>
    </MotionConfig>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
