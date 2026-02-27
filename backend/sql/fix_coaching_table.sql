-- Run this SQL in your Supabase SQL Editor to fix the Coaching Application failure

-- 1. Ensure the trainer_clients table has all required columns and correct permissions
CREATE TABLE IF NOT EXISTS public.trainer_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID, 
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp_number TEXT,
    whatsapp_group_link TEXT DEFAULT 'https://chat.whatsapp.com/EiRKjJBISlW2HmtYwpnbxh',
    status TEXT DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    age INTEGER,
    city TEXT,
    country TEXT,
    height_feet NUMERIC,
    current_weight_kg NUMERIC,
    target_weight_kg NUMERIC,
    occupation TEXT,
    primary_goal TEXT,
    prior_experience TEXT,
    training_type TEXT,
    plan_duration TEXT,
    diet_preference TEXT,
    habits TEXT,
    medical_conditions TEXT,
    medications TEXT,
    injuries TEXT,
    is_enrolled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_session TIMESTAMPTZ
);

-- 2. Add any missing columns if the table already existed (Safety check)
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS trainer_id UUID;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS age INTEGER;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS city TEXT;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS country TEXT;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS height_feet NUMERIC;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS current_weight_kg NUMERIC;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS target_weight_kg NUMERIC;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS occupation TEXT;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS primary_goal TEXT;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS prior_experience TEXT;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS training_type TEXT;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS plan_duration TEXT;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS diet_preference TEXT;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS habits TEXT;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS medications TEXT;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS injuries TEXT;
        ALTER TABLE public.trainer_clients ADD COLUMN IF NOT EXISTS is_enrolled BOOLEAN DEFAULT FALSE;
    EXCEPTION WHEN OTHERS THEN 
        NULL;
    END;
END $$;

-- 3. Update Permissions (RLS)
ALTER TABLE public.trainer_clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can submit a coaching application" ON public.trainer_clients;
DROP POLICY IF EXISTS "Users can view own application" ON public.trainer_clients;
DROP POLICY IF EXISTS "Trainers can view their clients" ON public.trainer_clients;
DROP POLICY IF EXISTS "Public can insert applications" ON public.trainer_clients;

-- Policy to allow ANYONE (even non-logged-in) to submit an application
CREATE POLICY "Anyone can submit a coaching application" 
ON public.trainer_clients 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow users to view their own data
CREATE POLICY "Users can view own application" 
ON public.trainer_clients 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy to allow managing own clients for trainers
CREATE POLICY "Trainers can manage their clients" 
ON public.trainer_clients 
FOR ALL
USING (auth.uid() = trainer_id);
