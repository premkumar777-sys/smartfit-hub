-- Migration: Create email logs and password resets tables, and configure system crons
-- Created At: 2026-07-14

-- 1. Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 2. Create password_resets table
CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on password_resets
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- 3. Add welcome_sent to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_sent BOOLEAN DEFAULT false;

-- 4. Helper function to get service role key safely
CREATE OR REPLACE FUNCTION public.get_service_role_key()
RETURNS TEXT AS $$
DECLARE
  key TEXT;
BEGIN
  -- Try to get the decrypted secret from vault
  BEGIN
    SELECT decrypted_secret INTO key FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback if vault is not accessible
    key := NULL;
  END;

  IF key IS NOT NULL THEN
    RETURN key;
  END IF;
  
  RETURN '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Cron trigger functions
CREATE OR REPLACE FUNCTION public.trigger_weekly_progress_reports()
RETURNS VOID AS $$
DECLARE
  role_key TEXT;
  project_id TEXT := 'qziimtjhbnpwwbjmjlcf'; -- From config.toml
BEGIN
  role_key := public.get_service_role_key();
  IF role_key <> '' THEN
    PERFORM net.http_post(
      url := 'https://' || project_id || '.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || role_key
      ),
      body := '{"action": "send-weekly-reports"}'::text,
      timeout_ms := 30000
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_trial_expiry_reminders()
RETURNS VOID AS $$
DECLARE
  role_key TEXT;
  project_id TEXT := 'qziimtjhbnpwwbjmjlcf'; -- From config.toml
BEGIN
  role_key := public.get_service_role_key();
  IF role_key <> '' THEN
    PERFORM net.http_post(
      url := 'https://' || project_id || '.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || role_key
      ),
      body := '{"action": "send-trial-expiry-reminders"}'::text,
      timeout_ms := 30000
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Schedule cron jobs (if pg_cron extension is active)
-- We run these inside a block so it doesn't fail if pg_cron is not enabled locally or on some tiers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule first to avoid duplicate schedules if re-run
    PERFORM cron.unschedule('weekly-progress-report');
    PERFORM cron.unschedule('trial-expiry-check');
    
    -- Schedule weekly report every Sunday at 9:00 AM UTC
    PERFORM cron.schedule(
      'weekly-progress-report',
      '0 9 * * 0',
      'SELECT public.trigger_weekly_progress_reports();'
    );
    
    -- Schedule trial expiry check every day at 8:00 AM UTC
    PERFORM cron.schedule(
      'trial-expiry-check',
      '0 8 * * *',
      'SELECT public.trigger_trial_expiry_reminders();'
    );
  END IF;
END;
$$;
