import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import AIWorkout from "./pages/AIWorkout";
import WorkoutSession from "./pages/WorkoutSession";
import Nutrition from "./pages/Nutrition";
import Progress from "./pages/Progress";
import Guides from "./pages/Guides";
import HomeWorkouts from "./pages/HomeWorkouts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
