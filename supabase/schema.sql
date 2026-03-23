-- SmartFit AI Hub Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  fitness_goal TEXT,
  age INTEGER,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'athlete')),
  is_premium BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. WORKOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  goal TEXT,
  bmi DECIMAL(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can insert own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can update own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can delete own workouts" ON public.workouts;

-- Policies for workouts
CREATE POLICY "Users can view own workouts" ON public.workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON public.workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON public.workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON public.workouts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. PROGRESS LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own progress" ON public.progress_logs;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.progress_logs;
DROP POLICY IF EXISTS "Users can update own progress" ON public.progress_logs;
DROP POLICY IF EXISTS "Users can delete own progress" ON public.progress_logs;

-- Policies for progress_logs
CREATE POLICY "Users can view own progress" ON public.progress_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.progress_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.progress_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" ON public.progress_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. NUTRITION SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.nutrition_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  activity TEXT CHECK (activity IN ('sedentary', 'light', 'moderate', 'active', 'athlete')),
  goal TEXT CHECK (goal IN ('cut', 'recomp', 'bulk')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.nutrition_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own nutrition" ON public.nutrition_settings;
DROP POLICY IF EXISTS "Users can insert own nutrition" ON public.nutrition_settings;
DROP POLICY IF EXISTS "Users can update own nutrition" ON public.nutrition_settings;

-- Policies for nutrition_settings
CREATE POLICY "Users can view own nutrition" ON public.nutrition_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition" ON public.nutrition_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition" ON public.nutrition_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 5. WORKOUT SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_type TEXT NOT NULL,
  rep_count INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.workout_sessions;

-- Policies for workout_sessions
CREATE POLICY "Users can view own sessions" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON public.workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_logs_user_id ON public.progress_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_logs_date ON public.progress_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON public.workout_sessions(user_id);

-- ============================================
-- SUBSCRIPTION & PAYMENT TABLES
-- ============================================

-- Plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL, -- Price in cents
  price_yearly INTEGER NOT NULL, -- Price in cents
  currency TEXT DEFAULT 'inr',
  features JSONB DEFAULT '[]'::jsonb,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES public.plans(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment history table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'inr',
  status TEXT CHECK (status IN ('succeeded', 'failed', 'pending', 'canceled')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;

-- Plans policies (public read access for active plans)
CREATE POLICY "Anyone can view active plans" ON public.plans
  FOR SELECT USING (is_active = true);

-- Subscriptions policies (users can only see their own)
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Payments policies (users can only see their own)
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Insert default plans
INSERT INTO public.plans (id, name, description, price_monthly, price_yearly, features, stripe_price_id_monthly, stripe_price_id_yearly) VALUES
('free', 'Free', 'Get started with essential fitness tools', 0, 0, '["AI chatbot (limited)", "Training guides access", "Basic workouts", "Email OTP login", "Community access"]'::jsonb, NULL, NULL),
('premium', 'Premium', 'Unlock your full fitness potential', 19900, 199900, '["AI Personal Trainer", "Personalized workouts", "Nutrition calculator", "Progress dashboard", "Unlimited AI chatbot", "Gamification & streaks", "Priority support"]'::jsonb, 'price_1SjCJHCn98QGMABleFu4j9lW', 'price_1SjCJHCn98QGMABleFu4j9lW'),
('gym_partner', 'Gym Partner', 'Complete solution for fitness businesses', 0, 0, '["Member management", "Trainer dashboard", "QR smart attendance", "Class booking system", "Business analytics"]'::jsonb, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Function to get user's current plan
CREATE OR REPLACE FUNCTION public.get_user_plan(user_id UUID)
RETURNS TABLE (
  plan_id TEXT,
  plan_name TEXT,
  status TEXT,
  billing_cycle TEXT,
  current_period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as plan_id,
    p.name as plan_name,
    s.status,
    s.billing_cycle,
    s.current_period_end
  FROM public.subscriptions s
  JOIN public.plans p ON s.plan_id = p.id
  WHERE s.user_id = $1
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has premium access
CREATE OR REPLACE FUNCTION public.has_premium_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
BEGIN
  SELECT plan_id INTO user_plan
  FROM get_user_plan($1);

  RETURN user_plan IN ('premium', 'gym_partner');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STATS FUNCTIONS FOR DASHBOARD
-- ============================================

-- Function to get total active users
CREATE OR REPLACE FUNCTION public.get_total_users()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM auth.users
    WHERE created_at >= NOW() - INTERVAL '30 days'
    OR last_sign_in_at >= NOW() - INTERVAL '30 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total workouts generated
CREATE OR REPLACE FUNCTION public.get_total_workouts()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.workouts
    WHERE created_at >= NOW() - INTERVAL '30 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total workout sessions completed
CREATE OR REPLACE FUNCTION public.get_total_sessions()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.workout_sessions
    WHERE completed_at IS NOT NULL
    AND created_at >= NOW() - INTERVAL '30 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate success rate (users who completed at least 3 workouts)
CREATE OR REPLACE FUNCTION public.get_success_rate()
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_users INTEGER;
  active_users INTEGER;
BEGIN
  -- Get total users
  SELECT COUNT(*) INTO total_users
  FROM auth.users
  WHERE created_at >= NOW() - INTERVAL '30 days';

  -- Get users who completed 3+ workouts
  SELECT COUNT(DISTINCT ws.user_id) INTO active_users
  FROM public.workout_sessions ws
  WHERE ws.completed_at IS NOT NULL
  AND ws.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY ws.user_id
  HAVING COUNT(*) >= 3;

  -- Return success rate as percentage
  IF total_users > 0 THEN
    RETURN ROUND((active_users::DECIMAL / total_users::DECIMAL) * 100, 2);
  ELSE
    RETURN 85.0; -- Default fallback
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;