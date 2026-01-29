-- Add dashboard tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_workouts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS chat_sessions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress_logs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_calories_target INTEGER DEFAULT 2000,
ADD COLUMN IF NOT EXISTS protein_target INTEGER DEFAULT 150,
ADD COLUMN IF NOT EXISTS carbs_target INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS fats_target INTEGER DEFAULT 65;

-- Create activity_logs table for chart data and history
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'workout', 'nutrition', 'chat', 'progress'
    value FLOAT DEFAULT 0, -- e.g. calories consumed, workout duration
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster weekly activity queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON public.activity_logs(user_id, created_at);

-- Create nutrition_logs for specific calorie tracking
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calories INTEGER DEFAULT 0,
    protein INTEGER DEFAULT 0,
    carbs INTEGER DEFAULT 0,
    fats INTEGER DEFAULT 0,
    logged_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own activity logs') THEN
        CREATE POLICY "Users can view their own activity logs" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own activity logs') THEN
        CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own nutrition logs') THEN
        CREATE POLICY "Users can view their own nutrition logs" ON public.nutrition_logs FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own nutrition logs') THEN
        CREATE POLICY "Users can insert their own nutrition logs" ON public.nutrition_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Update profile stats when activity is logged (optional but good for performance)
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.activity_type = 'workout' THEN
        UPDATE public.profiles SET total_workouts = total_workouts + 1 WHERE id = NEW.user_id;
    ELSIF NEW.activity_type = 'chat' THEN
        UPDATE public.profiles SET chat_sessions = chat_sessions + 1 WHERE id = NEW.user_id;
    ELSIF NEW.activity_type = 'progress' THEN
        UPDATE public.profiles SET progress_logs = progress_logs + 1 WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_profile_stats ON public.activity_logs;
CREATE TRIGGER tr_update_profile_stats
AFTER INSERT ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION update_profile_stats();
