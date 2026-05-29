-- SmartFit Security Audit Remediation
-- 1. Create a secure view for the leaderboard to solve RLS profiles query limitations without exposing private details
CREATE OR REPLACE VIEW public.leaderboard AS
  SELECT id, username, xp, level, streak, avatar_emoji, avatar_url
  FROM public.profiles;

-- Grant permissions to access the view
GRANT SELECT ON public.leaderboard TO authenticated, anon;

-- 2. Restrict giveaway submissions to authenticated users only
DROP POLICY IF EXISTS "Anyone can submit a giveaway entry" ON public.giveaway_entries;

CREATE POLICY "Anyone can submit a giveaway entry"
  ON public.giveaway_entries FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
