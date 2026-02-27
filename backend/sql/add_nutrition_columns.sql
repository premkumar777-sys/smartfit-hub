-- =====================================================
-- NUTRITION & PHYSIOLOGY SYNC FIX
-- =====================================================
-- This script adds missing columns to the 'profiles' table 
-- to ensure biological data syncs across devices.

DO $$ 
BEGIN 
    -- Biological / Physiological Data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='age') THEN
        ALTER TABLE public.profiles ADD COLUMN age INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='weight') THEN
        ALTER TABLE public.profiles ADD COLUMN weight FLOAT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='height') THEN
        ALTER TABLE public.profiles ADD COLUMN height FLOAT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='activity_level') THEN
        ALTER TABLE public.profiles ADD COLUMN activity_level TEXT;
    END IF;

    -- Ensure fitness_goal exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='fitness_goal') THEN
        ALTER TABLE public.profiles ADD COLUMN fitness_goal TEXT;
    END IF;

END $$;

RAISE NOTICE 'Profiles table updated with nutrition and physiological columns!';
