-- =====================================================
-- PRODUCTION-READY SUBSCRIPTION AUTOMATION
-- =====================================================
-- IMPORTANT: Run this in your Supabase Project: fgndvazoastvtpmqtvhx
-- Go to: https://supabase.com/dashboard/project/fgndvazoastvtpmqtvhx/sql
-- =====================================================

-- 1. Ensure profiles has the email column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- 2. Update the signup trigger to AUTOMATICALLY save email
-- This is critical for the Instamojo webhook to find new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure the trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Standardize Subscriptions table
DO $$ 
BEGIN 
    -- current_period_end (Primary for code)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='current_period_end') THEN
        ALTER TABLE public.subscriptions ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- expires_at (Backup/Legacy)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='expires_at') THEN
        ALTER TABLE public.subscriptions ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- plan_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='plan_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN plan_id TEXT DEFAULT 'premium';
    END IF;

    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='status') THEN
        ALTER TABLE public.subscriptions ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- 5. Sync existing data
UPDATE public.subscriptions 
SET current_period_end = expires_at 
WHERE current_period_end IS NULL AND expires_at IS NOT NULL;

UPDATE public.subscriptions 
SET expires_at = current_period_end 
WHERE expires_at IS NULL AND current_period_end IS NOT NULL;

-- 6. Grant current user Pro status (Fail-safe for you)
UPDATE public.subscriptions
SET status = 'active', 
    current_period_end = NOW() + INTERVAL '30 days',
    expires_at = NOW() + INTERVAL '30 days',
    plan_id = 'premium'
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE LOWER(email) IN (
        'eslavathpremkumar17@gmail.com', 
        '24r01a66t7@cmrithyderabad.edu.in',
        '24r01a66t7@cmrithyderbad.edu.in'
    )
);

-- 7. Log results
RAISE NOTICE 'Production Reliability Patch Applied Successfully';
