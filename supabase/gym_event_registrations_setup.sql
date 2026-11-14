-- Migration script for gym_event_registrations table
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

CREATE TABLE IF NOT EXISTS public.gym_event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('pullups', 'deadlifts', 'benchpress')),
  score NUMERIC NOT NULL DEFAULT 0,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  winner_rank INTEGER CHECK (winner_rank IN (1, 2, 3)),
  age INTEGER,
  weight NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gym_event_registrations ENABLE ROW LEVEL SECURITY;

-- Helper function to identify verified admins
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (
      LOWER(email) IN (
        'eslavathpremkumar17@gmail.com', 
        'psainik92@gmail.com',
        'admin@smartfitai.in'
      )
      OR raw_user_meta_data->>'role' = 'admin'
    )
  );
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert to registrations" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Allow public select of registrations" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Allow public update of registrations" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Allow public delete of registrations" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Public read gym registrations" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Allow registration insert" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Users update own registration" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Admins delete registrations" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Service role full access registrations" ON public.gym_event_registrations;

-- Read: Public can view leaderboard & event entries
CREATE POLICY "Public read gym registrations" ON public.gym_event_registrations
  FOR SELECT USING (true);

-- Insert: Users can register themselves or submit as guest
CREATE POLICY "Allow registration insert" ON public.gym_event_registrations
  FOR INSERT WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL) OR (auth.uid() = user_id) OR public.is_admin()
  );

-- Update: Users can only update their own registration record, or admin can update any
CREATE POLICY "Users update own registration" ON public.gym_event_registrations
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Delete: Strictly restricted to Admins and Service Role
CREATE POLICY "Admins delete registrations" ON public.gym_event_registrations
  FOR DELETE USING (public.is_admin());

CREATE POLICY "Service role full access registrations" ON public.gym_event_registrations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_gym_event_registrations_challenge_type ON public.gym_event_registrations(challenge_type);
CREATE INDEX IF NOT EXISTS idx_gym_event_registrations_score ON public.gym_event_registrations(score DESC);
