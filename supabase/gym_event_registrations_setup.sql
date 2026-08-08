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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert to registrations" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Allow public select of registrations" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Allow public update of registrations" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Allow public delete of registrations" ON public.gym_event_registrations;

-- Policies
CREATE POLICY "Allow public insert to registrations" ON public.gym_event_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select of registrations" ON public.gym_event_registrations
  FOR SELECT USING (true);

CREATE POLICY "Allow public update of registrations" ON public.gym_event_registrations
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete of registrations" ON public.gym_event_registrations
  FOR DELETE USING (true);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_gym_event_registrations_challenge_type ON public.gym_event_registrations(challenge_type);
CREATE INDEX IF NOT EXISTS idx_gym_event_registrations_score ON public.gym_event_registrations(score DESC);
