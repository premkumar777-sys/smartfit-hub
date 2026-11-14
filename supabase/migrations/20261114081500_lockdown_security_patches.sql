-- ==============================================================================
-- Security Lockdown Patch: Subscriptions Privilege Escalation & Gym Registrations
-- Migration: 20261114081500_lockdown_security_patches.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Helper function to identify verified admins
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (
      LOWER(email) IN (
        'eslavathpremkumar17@gmail.com', 
        'psainik92@gmail.com',
        'admin@smartfitai.in'
      )
      OR raw_user_meta_data->>'role' = 'admin'
    )
  );
$$;

-- ------------------------------------------------------------------------------
-- 2. Lock down public.subscriptions
-- Prevent unauthorized privilege escalation where users could insert 'premium' status
-- ------------------------------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop insecure policies
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role full access to subscriptions" ON public.subscriptions;

-- Users may ONLY read their own subscription
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Only backend service role (Stripe/Instamojo/Google Play webhooks) can insert, update, delete
CREATE POLICY "Service role full access to subscriptions" ON public.subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. Secure Trial Activation Function
-- Allows users to activate the 7-day trial safely without direct table write permission
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_trial()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_already_used BOOLEAN;
  v_trial_end TIMESTAMPTZ := NOW() + INTERVAL '7 days';
  v_sub_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to activate trial';
  END IF;

  -- Check if user has already used a trial or holds an active subscription
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = v_user_id
  ) INTO v_already_used;

  IF v_already_used THEN
    RAISE EXCEPTION 'Trial has already been claimed or an active subscription exists for this account';
  END IF;

  INSERT INTO public.subscriptions (
    user_id,
    plan_id,
    plan_name,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    cancel_at_period_end
  ) VALUES (
    v_user_id,
    'trial',
    '7-Day Trial',
    'active',
    'trial',
    NOW(),
    v_trial_end,
    false
  )
  RETURNING id INTO v_sub_id;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_sub_id,
    'plan_id', 'trial',
    'status', 'active',
    'trial_end', v_trial_end
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.activate_trial() TO authenticated;

-- ------------------------------------------------------------------------------
-- 4. Lock down public.gym_event_registrations
-- Eliminate public delete/update vulnerabilities
-- ------------------------------------------------------------------------------
ALTER TABLE public.gym_event_registrations ENABLE ROW LEVEL SECURITY;

-- Drop legacy wide-open policies
DROP POLICY IF EXISTS "Allow public insert to registrations" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Allow public select of registrations" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Allow public update of registrations" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Allow public delete of registrations" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Public read gym registrations" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Allow registration insert" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Users update own registration" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Admins delete registrations" ON public.gym_event_registrations;
DROP POLICY IF EXISTS "Service role full access registrations" ON public.gym_event_registrations;

-- Read: Public can view leaderboard & event entries
CREATE POLICY "Public read gym registrations" ON public.gym_event_registrations
  FOR SELECT USING (true);

-- Insert: Users can register themselves or submit as guest
CREATE POLICY "Allow registration insert" ON public.gym_event_registrations
  FOR INSERT WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL) OR (auth.uid() = user_id) OR public.is_admin()
  );

-- Update: Users can only update their own registration record, or admin can update any
CREATE POLICY "Users update own registration" ON public.gym_event_registrations
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Delete: Strictly restricted to Admins and Service Role
CREATE POLICY "Admins delete registrations" ON public.gym_event_registrations
  FOR DELETE USING (public.is_admin());

CREATE POLICY "Service role full access registrations" ON public.gym_event_registrations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
