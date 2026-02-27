-- =====================================================
-- COMPREHENSIVE FIX: PROFILES & SUBSCRIPTIONS
-- =====================================================
-- This script fixes the missing 'subscriptions' table error
-- and ensures 'profiles' has all columns and correct RLS.
-- =====================================================

-- 1. Create subscriptions table if missing
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    plan_id TEXT DEFAULT 'free',
    plan_name TEXT DEFAULT 'Free',
    status TEXT DEFAULT 'active',
    billing_cycle TEXT DEFAULT 'free',
    payment_provider TEXT,
    payment_id TEXT,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions RLS Policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions 
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Sync Profiles Table Columns
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

    -- user_id (Consistency check)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='user_id') THEN
        ALTER TABLE public.profiles ADD COLUMN user_id UUID;
        UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
    END IF;
END $$;

-- 3. Update Profiles RLS Policies (Crucial for UPSERT)
-- UPSERT requires both INSERT and UPDATE permissions

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow leaderboard viewing for authenticated users
DROP POLICY IF EXISTS "Users can view leaderboard info" ON public.profiles;
CREATE POLICY "Users can view leaderboard info" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- 4. Ensure updated_at trigger exists
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

DO $$ 
BEGIN 
    RAISE NOTICE 'Database schema synchronized: Subscriptions table created and Profiles policies updated!';
END $$;
