-- =====================================================
-- COMPREHENSIVE PROFILES TABLE FIX
-- =====================================================
-- This script ensures the profiles table has EVERY SINGLE COLUMN
-- used across the entire application, including gamification,
-- nutrition, and profile/settings pages.
-- =====================================================

-- 1. Ensure all columns exist in public.profiles
DO $$ 
BEGIN 
    -- Basic Profile Info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='location') THEN
        ALTER TABLE public.profiles ADD COLUMN location TEXT;
    END IF;

    -- Dashboard / Stat Tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='total_workouts') THEN
        ALTER TABLE public.profiles ADD COLUMN total_workouts INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='chat_sessions') THEN
        ALTER TABLE public.profiles ADD COLUMN chat_sessions INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='progress_logs') THEN
        ALTER TABLE public.profiles ADD COLUMN progress_logs INTEGER DEFAULT 0;
    END IF;

    -- Nutrition Targets
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='daily_calories_target') THEN
        ALTER TABLE public.profiles ADD COLUMN daily_calories_target INTEGER DEFAULT 2000;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='protein_target') THEN
        ALTER TABLE public.profiles ADD COLUMN protein_target INTEGER DEFAULT 150;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='carbs_target') THEN
        ALTER TABLE public.profiles ADD COLUMN carbs_target INTEGER DEFAULT 200;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='fats_target') THEN
        ALTER TABLE public.profiles ADD COLUMN fats_target INTEGER DEFAULT 65;
    END IF;

    -- Gamification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='xp') THEN
        ALTER TABLE public.profiles ADD COLUMN xp INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='level') THEN
        ALTER TABLE public.profiles ADD COLUMN level INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='streak') THEN
        ALTER TABLE public.profiles ADD COLUMN streak INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_emoji') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_emoji TEXT DEFAULT '⭐';
    END IF;

    -- Preferences JSONB
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='preferences') THEN
        ALTER TABLE public.profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- user_id (Backwards compatibility / Linkage)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='user_id') THEN
        ALTER TABLE public.profiles ADD COLUMN user_id UUID;
        UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
    END IF;
END $$;

-- 2. Update RLS policies to be robust and allow leaderboard viewing
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow all authenticated users to see leaderboard stats for others
DROP POLICY IF EXISTS "Users can view leaderboard info" ON public.profiles;
CREATE POLICY "Users can view leaderboard info" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- 3. Ensure trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

RAISE NOTICE 'Profiles table schema fully synchronized!';
