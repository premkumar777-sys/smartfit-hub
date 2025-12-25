import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import { FitnessCursor } from "@/components/FitnessCursor";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { performanceMonitor } from "@/lib/utils";

// Lazy load all page components for code splitting
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const AIWorkout = lazy(() => import("./pages/AIWorkout"));
const WorkoutSession = lazy(() => import("./pages/WorkoutSession"));
const Nutrition = lazy(() => import("./pages/Nutrition"));
const Progress = lazy(() => import("./pages/Progress"));
const Guides = lazy(() => import("./pages/Guides"));
const HomeWorkouts = lazy(() => import("./pages/HomeWorkouts"));
const AITrainer = lazy(() => import("./pages/AITrainer"));
const Gamification = lazy(() => import("./pages/Gamification"));
const Pricing = lazy(() => import("./pages/Pricing"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Don't refetch on window focus for better performance
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect for better performance
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const App = () => {
  // Initialize performance monitoring
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      performanceMonitor.trackWebVitals();
      // Log initial memory usage
      setTimeout(() => performanceMonitor.logMemoryUsage(), 1000);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <FitnessCursor />
          <FloatingChatbot />
          <Header />
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/pricing" element={<Pricing />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        {/* React Query DevTools for performance monitoring */}
        <ReactQueryDevtools initialIsOpen={false} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
