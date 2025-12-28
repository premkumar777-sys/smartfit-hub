
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qziimtjhbnpwwbjmjlcf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6aWltdGpoYm5wd3diam1qbGNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzM1OTYsImV4cCI6MjA4MTEwOTU5Nn0.XGEUFsYzqNy20f8EJUaoNbrysclCdgoKu4JabZPvnJA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);