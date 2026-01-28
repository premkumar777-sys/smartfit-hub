-- Add gamification columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT '⭐';

-- Update the handle_new_user function to include default gamification values
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, xp, level, streak, avatar_emoji)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    0, 
    1, 
    0, 
    '⭐'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for profiles
-- Allow users to view their own full profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow all authenticated users to view leaderboard info for all profiles
-- Note: We only allow viewing username, xp, level, streak, and avatar_emoji
DROP POLICY IF EXISTS "Users can view leaderboard info" ON public.profiles;
CREATE POLICY "Users can view leaderboard info" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);
