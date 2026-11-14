-- SmartFit AI: User Push Subscriptions & Background Notifications Schema
CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    preferred_time TEXT DEFAULT '18:30',
    timezone TEXT DEFAULT 'UTC',
    streak_reminders_enabled BOOLEAN DEFAULT true,
    days_inactive INTEGER DEFAULT 0,
    last_notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_push_subscription UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view and manage their own push subscription
CREATE POLICY "Users can view their own push subscription"
    ON public.user_push_subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update their own push subscription"
    ON public.user_push_subscriptions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow service role full access for cron jobs and notification dispatcher
CREATE POLICY "Service role full access to push subscriptions"
    ON public.user_push_subscriptions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Index for cron lookup by reminder time
CREATE INDEX IF NOT EXISTS idx_user_push_preferred_time
    ON public.user_push_subscriptions(preferred_time);

CREATE INDEX IF NOT EXISTS idx_user_push_user_id
    ON public.user_push_subscriptions(user_id);
