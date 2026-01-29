-- =====================================================
-- FIX PROFILES TABLE SCHEMA
-- =====================================================
-- This script ensures the profiles table has all necessary columns
-- used in the Profile and Settings pages.
-- =====================================================

-- 1. Ensure all columns exist in public.profiles
DO $$ 
BEGIN 
    -- Basic info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='location') THEN
        ALTER TABLE public.profiles ADD COLUMN location TEXT;
    END IF;

    -- Preferences JSONB
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='preferences') THEN
        ALTER TABLE public.profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Ensure updated_at exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Ensure user_id exists (as an alias to id for consistency if needed, but we'll prefer using 'id')
    -- If user_id is already in types.ts it might be needed by some generated code
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='user_id') THEN
        ALTER TABLE public.profiles ADD COLUMN user_id UUID;
        UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
    END IF;
END $$;

-- 2. Update RLS policies to be robust
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. Ensure updated_at trigger exists (Optional but recommended)
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

RAISE NOTICE 'Profiles table schema fixed successfully!';
