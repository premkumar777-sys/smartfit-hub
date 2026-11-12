-- Migration: Real User Cookie Consent & Privacy Preferences
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "notifications": {
    "email": true,
    "push": true
  },
  "units": "metric",
  "privacy": "public",
  "theme": "dark",
  "cookies": {
    "necessary": true,
    "functional": true,
    "analytics": true,
    "marketing": false,
    "version": "2026.1",
    "source": "default"
  }
}'::JSONB;

CREATE TABLE IF NOT EXISTS public.cookie_consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    necessary BOOLEAN NOT NULL DEFAULT true,
    functional BOOLEAN NOT NULL DEFAULT false,
    analytics BOOLEAN NOT NULL DEFAULT false,
    marketing BOOLEAN NOT NULL DEFAULT false,
    consent_version TEXT NOT NULL DEFAULT '2026.1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cookie_consent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cookie consent logs" ON public.cookie_consent_logs;
CREATE POLICY "Users can view own cookie consent logs"
    ON public.cookie_consent_logs
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cookie consent logs" ON public.cookie_consent_logs;
CREATE POLICY "Users can insert own cookie consent logs"
    ON public.cookie_consent_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cookie_consent_logs_user_id ON public.cookie_consent_logs(user_id);
