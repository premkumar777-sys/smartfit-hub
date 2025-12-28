
import { createClient } from '@supabase/supabase-js';

// Temporary fallback for testing - replace with real credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not configured - some features will not work');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);