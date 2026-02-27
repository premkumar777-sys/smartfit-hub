-- =====================================================
-- SMARTFIT HUB - CONSOLIDATED PROFILES SCHEMA FIX
-- =====================================================
-- This script ensures the 'profiles' table has all columns
-- required by the frontend (Profile, Nutrition, and Dashboard).

DO $$ 
BEGIN 
    -- 1. Physiological / Nutrition Data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='age') THEN
        ALTER TABLE public.profiles ADD COLUMN age INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='weight') THEN
        ALTER TABLE public.profiles ADD COLUMN weight FLOAT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='height') THEN
        ALTER TABLE public.profiles ADD COLUMN height FLOAT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='activity_level') THEN
        ALTER TABLE public.profiles ADD COLUMN activity_level TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='daily_calories_target') THEN
        ALTER TABLE public.profiles ADD COLUMN daily_calories_target INTEGER;
    END IF;

    -- 2. Extended Profile Information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='location') THEN
        ALTER TABLE public.profiles ADD COLUMN location TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='fitness_goal') THEN
        ALTER TABLE public.profiles ADD COLUMN fitness_goal TEXT;
    END IF;

    -- 3. Gamification / Activity Metrics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='xp') THEN
        ALTER TABLE public.profiles ADD COLUMN xp INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='level') THEN
        ALTER TABLE public.profiles ADD COLUMN level INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='streak') THEN
        ALTER TABLE public.profiles ADD COLUMN streak INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='total_workouts') THEN
        ALTER TABLE public.profiles ADD COLUMN total_workouts INTEGER DEFAULT 0;
    END IF;

END $$;

COMMENT ON TABLE public.profiles IS 'Consolidated profile table with nutrition, gamification, and identity fields.';
