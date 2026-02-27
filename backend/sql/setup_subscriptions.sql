-- =====================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Go to: https://supabase.com/dashboard/project/qziimtjhbnpwwbjmjlcf/sql
-- =====================================================

-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    plan_name TEXT DEFAULT 'pro',
    plan_price INTEGER DEFAULT 99,
    status TEXT DEFAULT 'active',
    payment_provider TEXT DEFAULT 'instamojo',
    payment_id TEXT,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Create policy to allow users to read their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- 4. Create policy for service role to insert
CREATE POLICY "Service role can manage subscriptions"
ON public.subscriptions FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Mark YOUR subscription as active (eslavathpremkumar17@gmail.com)
INSERT INTO public.subscriptions (user_id, email, plan_name, plan_price, status, expires_at)
SELECT 
    id,
    'eslavathpremkumar17@gmail.com',
    'Pro - 1 Month',
    99,
    'active',
    NOW() + INTERVAL '30 days'
FROM auth.users 
WHERE email = 'eslavathpremkumar17@gmail.com'
LIMIT 1;

-- Done! Your subscription is now active!
