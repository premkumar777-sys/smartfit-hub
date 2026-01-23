-- =====================================================
-- FIX SUBSCRIPTIONS SCHEMA (Version 4 - STABLE)
-- Run this in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/qziimtjhbnpwwbjmjlcf/sql
-- =====================================================

-- 1. Ensure profiles has the email column (REQUIRED for Instamojo Webhook)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- Populate emails in profiles from auth.users (Webhook needs this to find the user)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 2. Ensure subscriptions has all required columns (resilient to schema versions)
DO $$ 
BEGIN 
    -- Add current_period_end if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='current_period_end') THEN
        ALTER TABLE public.subscriptions ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add current_period_start if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='current_period_start') THEN
        ALTER TABLE public.subscriptions ADD COLUMN current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add plan_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='plan_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN plan_id TEXT DEFAULT 'premium';
    END IF;

    -- Add billing_cycle if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='billing_cycle') THEN
        ALTER TABLE public.subscriptions ADD COLUMN billing_cycle TEXT DEFAULT 'monthly';
    END IF;

    -- Add updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='updated_at') THEN
        ALTER TABLE public.subscriptions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='status') THEN
        ALTER TABLE public.subscriptions ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- 3. Sync columns and set defaults safely
DO $$
BEGIN
    -- Only try to copy from expires_at if it actually exists (legacy support)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='expires_at') THEN
        EXECUTE 'UPDATE public.subscriptions SET current_period_end = expires_at WHERE current_period_end IS NULL AND expires_at IS NOT NULL';
    END IF;
END $$;

UPDATE public.subscriptions 
SET plan_id = 'premium' 
WHERE plan_id IS NULL;

-- 4. Enable RLS and Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can manage subscriptions"
ON public.subscriptions FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Fix specific users (Upgrading your accounts)
DO $$
DECLARE
    target_emails TEXT[] := ARRAY['eslavathpremkumar17@gmail.com', '24r01a66t7@cmrithyderabad.edu.in'];
    target_email TEXT;
    target_user_id UUID;
BEGIN
    FOREACH target_email IN ARRAY target_emails
    LOOP
        -- Find the user ID in auth.users
        SELECT id INTO target_user_id FROM auth.users WHERE email = target_email LIMIT 1;
        
        IF target_user_id IS NOT NULL THEN
            -- Ensure profile exists in profiles table and has the email (for webhook)
            INSERT INTO public.profiles (id, email, username)
            VALUES (target_user_id, target_email, split_part(target_email, '@', 1))
            ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

            -- Ensure active subscription exists in subscriptions table
            -- Note: We use user_id ONLY, as 'email' column might not exist in this table
            IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = target_user_id) THEN
                UPDATE public.subscriptions
                SET status = 'active', 
                    current_period_end = NOW() + INTERVAL '30 days',
                    plan_id = 'premium'
                WHERE user_id = target_user_id;
            ELSE
                INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
                VALUES (target_user_id, 'premium', 'active', NOW(), NOW() + INTERVAL '30 days');
            END IF;
            
            RAISE NOTICE 'SUCCESS: Upgraded user %', target_email;
        ELSE
            RAISE NOTICE 'WARNING: User not found with email %', target_email;
        END IF;
    END LOOP;
END $$;
