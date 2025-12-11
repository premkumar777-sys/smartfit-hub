import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // For now, just return unauthenticated state to prevent crashes
  // TODO: Set up proper Supabase environment variables
  console.log("Auth hook: Supabase not configured, using fallback");

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
  };
}
