import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import AIWorkout from "./pages/AIWorkout";
import WorkoutSession from "./pages/WorkoutSession";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Quick test - temporarily show simple content
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">SmartFit AI - Test Page</h1>
      <p className="text-lg mb-4">If you can see this, the basic app is working!</p>
      <div className="space-y-4">
        <button
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => window.location.href = '/auth'}
        >
          Go to Auth
        </button>
        <button
          className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 ml-4"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>
      <div className="mt-8 p-4 bg-gray-800 rounded">
        <h2 className="text-xl font-semibold mb-2">Environment Check:</h2>
        <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Loaded' : '❌ Missing'}</p>
        <p>Supabase Key: {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✅ Loaded' : '❌ Missing'}</p>
      </div>
    </div>
  );
};

export default App;
