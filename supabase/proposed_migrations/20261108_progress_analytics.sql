-- REVIEW ONLY: proposed analytics schema, not applied to Supabase.
-- Confirm the deployed schema and review this file before running it.
-- Existing completed_workouts.date values include locale-formatted text, so
-- workout_date remains nullable rather than guessing dates during backfill.

ALTER TABLE public.completed_workouts
  ADD COLUMN IF NOT EXISTS workout_date DATE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_completed_workouts_id_user
  ON public.completed_workouts (id, user_id);

CREATE INDEX IF NOT EXISTS idx_completed_workouts_user_workout_date
  ON public.completed_workouts (user_id, workout_date DESC);

-- Measurements and goals currently live in browser localStorage.
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_on DATE NOT NULL DEFAULT CURRENT_DATE,
  chest_cm NUMERIC(6, 2),
  waist_cm NUMERIC(6, 2),
  hips_cm NUMERIC(6, 2),
  arms_cm NUMERIC(6, 2),
  thighs_cm NUMERIC(6, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT body_measurements_nonempty CHECK (
    chest_cm IS NOT NULL OR waist_cm IS NOT NULL OR hips_cm IS NOT NULL
    OR arms_cm IS NOT NULL OR thighs_cm IS NOT NULL
  ),
  CONSTRAINT body_measurements_positive CHECK (
    (chest_cm IS NULL OR chest_cm > 0) AND (waist_cm IS NULL OR waist_cm > 0)
    AND (hips_cm IS NULL OR hips_cm > 0) AND (arms_cm IS NULL OR arms_cm > 0)
    AND (thighs_cm IS NULL OR thighs_cm > 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date
  ON public.body_measurements (user_id, recorded_on DESC);

CREATE TABLE IF NOT EXISTS public.fitness_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  start_value NUMERIC(10, 2),
  target_value NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fitness_goals_user_status
  ON public.fitness_goals (user_id, status, target_date);

-- Normalized set-level records; legacy exercises JSON does not consistently
-- contain reps or unit-qualified loads and is intentionally not backfilled.
CREATE TABLE IF NOT EXISTS public.exercise_performances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL,
  exercise_name TEXT NOT NULL CHECK (length(trim(exercise_name)) > 0),
  performed_on DATE NOT NULL,
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  reps INTEGER CHECK (reps > 0),
  load_kg NUMERIC(8, 2) CHECK (load_kg IS NULL OR load_kg >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT exercise_performances_workout_owner_fk
    FOREIGN KEY (workout_id, user_id)
    REFERENCES public.completed_workouts (id, user_id)
    ON DELETE CASCADE,
  CONSTRAINT exercise_performances_set_unique
    UNIQUE (workout_id, exercise_name, set_number)
);

CREATE INDEX IF NOT EXISTS idx_exercise_performances_user_date
  ON public.exercise_performances (user_id, performed_on DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_performances_user_exercise_date
  ON public.exercise_performances (user_id, exercise_name, performed_on DESC);

-- Existing achievement IDs are held by the client gamification hook and have
-- no unlock timestamp. A trusted server-side writer should populate this table.
CREATE TABLE IF NOT EXISTS public.achievement_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT achievement_unlocks_user_key_unique UNIQUE (user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_achievement_unlocks_user_date
  ON public.achievement_unlocks (user_id, unlocked_at DESC);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_unlocks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'body_measurements' AND policyname = 'Users manage own body measurements') THEN
    CREATE POLICY "Users manage own body measurements" ON public.body_measurements
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fitness_goals' AND policyname = 'Users manage own fitness goals') THEN
    CREATE POLICY "Users manage own fitness goals" ON public.fitness_goals
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exercise_performances' AND policyname = 'Users manage own exercise performances') THEN
    CREATE POLICY "Users manage own exercise performances" ON public.exercise_performances
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'achievement_unlocks' AND policyname = 'Users can view own achievement unlocks') THEN
    CREATE POLICY "Users can view own achievement unlocks" ON public.achievement_unlocks
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Rollback is intentionally not automatic. After backing up any newly written
-- data and confirming dependencies, these new tables may be dropped manually.
-- The workout_date column/indexes can be removed separately if no longer used.
