
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fgndvazoastvtpmqtvhx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnbmR2YXpvYXN0dnRwbXF0dmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxODQ0MzgsImV4cCI6MjA3ODc2MDQzOH0.Ddwj72W75tfmXVqokzoqYwAJreSbugiYWrGB0q0wLD8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);