-- =====================================================
-- FIX SUBSCRIPTIONS SCHEMA (Version 6 - PROJECT CORRECTED)
-- =====================================================
-- IMPORTANT: Run this in your CORRECT Supabase Project!
-- Your .env file says your project is: fgndvazoastvtpmqtvhx
-- Go to: https://supabase.com/dashboard/project/fgndvazoastvtpmqtvhx/sql
-- =====================================================

-- 1. Ensure profiles has the email column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- Populate emails in profiles from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 2. Ensure subscriptions has all required columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='current_period_end') THEN
        ALTER TABLE public.subscriptions ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='current_period_start') THEN
        ALTER TABLE public.subscriptions ADD COLUMN current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='plan_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN plan_id TEXT DEFAULT 'premium';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='billing_cycle') THEN
        ALTER TABLE public.subscriptions ADD COLUMN billing_cycle TEXT DEFAULT 'monthly';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='updated_at') THEN
        ALTER TABLE public.subscriptions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='status') THEN
        ALTER TABLE public.subscriptions ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- 3. Sync columns and set defaults safely
DO $$
BEGIN
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
    target_emails TEXT[] := ARRAY[
        'eslavathpremkumar17@gmail.com', 
        '24r01a66t7@cmrithyderabad.edu.in',
        '24r01a66t7@cmrithyderbad.edu.in'
    ];
    target_email TEXT;
    target_user_id UUID;
    sub_count INTEGER;
BEGIN
    FOR i IN 1..array_length(target_emails, 1) LOOP
        target_email := target_emails[i];
        
        -- Search for the user by email
        SELECT id INTO target_user_id 
        FROM auth.users 
        WHERE LOWER(email) = LOWER(target_email) 
        LIMIT 1;
        
        IF target_user_id IS NOT NULL THEN
            -- Ensure profile exists
            INSERT INTO public.profiles (id, email, username)
            VALUES (target_user_id, LOWER(target_email), split_part(target_email, '@', 1))
            ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

            -- Explicitly delete existing expired or inactive subs to avoid confusion
            DELETE FROM public.subscriptions WHERE user_id = target_user_id;

            -- Insert a fresh active sub
            INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
            VALUES (target_user_id, 'premium', 'active', NOW(), NOW() + INTERVAL '30 days');
            
            RAISE NOTICE '--- SUCCESS ---';
            RAISE NOTICE 'User Email: %', target_email;
            RAISE NOTICE 'User ID:    %', target_user_id;
            RAISE NOTICE 'Status:     ACTIVATED (Pro for 30 days)';
            RAISE NOTICE '---------------';
        ELSE
            RAISE NOTICE '--- WARNING ---';
            RAISE NOTICE 'User Email: %', target_email;
            RAISE NOTICE 'Status:     NOT FOUND in auth.users';
            RAISE NOTICE '---------------';
        END IF;
    END LOOP;
    
    SELECT COUNT(*) INTO sub_count FROM public.subscriptions WHERE status = 'active';
    RAISE NOTICE 'Total Active Subscriptions in Project %: %', 'fgndvazoastvtpmqtvhx', sub_count;
END $$;
