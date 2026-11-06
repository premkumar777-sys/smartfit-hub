CREATE TABLE IF NOT EXISTS public.nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fats NUMERIC NOT NULL DEFAULT 0,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_calories_target INTEGER NOT NULL DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS protein_target INTEGER NOT NULL DEFAULT 150,
  ADD COLUMN IF NOT EXISTS carbs_target INTEGER NOT NULL DEFAULT 200,
  ADD COLUMN IF NOT EXISTS fats_target INTEGER NOT NULL DEFAULT 65;

ALTER TABLE public.nutrition_logs
  ADD COLUMN IF NOT EXISTS meal_name TEXT NOT NULL DEFAULT 'Meal',
  ADD COLUMN IF NOT EXISTS meal_category TEXT NOT NULL DEFAULT 'Snacks',
  ADD COLUMN IF NOT EXISTS food_weight_grams NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS food_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS food_image_path TEXT,
  ADD COLUMN IF NOT EXISTS user_context TEXT,
  ADD COLUMN IF NOT EXISTS analysis_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS fiber NUMERIC,
  ADD COLUMN IF NOT EXISTS sugar NUMERIC,
  ADD COLUMN IF NOT EXISTS sodium_mg NUMERIC,
  ADD COLUMN IF NOT EXISTS client_submission_id UUID,
  ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.nutrition_logs
  DROP CONSTRAINT IF EXISTS nutrition_logs_meal_category_check;
ALTER TABLE public.nutrition_logs
  ADD CONSTRAINT nutrition_logs_meal_category_check
  CHECK (meal_category IN ('Breakfast', 'Lunch', 'Snacks', 'Dinner'));

ALTER TABLE public.nutrition_logs
  ALTER COLUMN calories TYPE NUMERIC USING calories::numeric,
  ALTER COLUMN protein TYPE NUMERIC USING protein::numeric,
  ALTER COLUMN carbs TYPE NUMERIC USING carbs::numeric,
  ALTER COLUMN fats TYPE NUMERIC USING fats::numeric;

CREATE UNIQUE INDEX IF NOT EXISTS nutrition_logs_user_submission_id_key
  ON public.nutrition_logs(user_id, client_submission_id);
CREATE INDEX IF NOT EXISTS nutrition_logs_user_logged_at_idx
  ON public.nutrition_logs(user_id, logged_at DESC);

ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own nutrition logs" ON public.nutrition_logs;
CREATE POLICY "Users can view their own nutrition logs"
  ON public.nutrition_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own nutrition logs" ON public.nutrition_logs;
CREATE POLICY "Users can insert their own nutrition logs"
  ON public.nutrition_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own nutrition logs" ON public.nutrition_logs;
CREATE POLICY "Users can update their own nutrition logs"
  ON public.nutrition_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own nutrition logs" ON public.nutrition_logs;
CREATE POLICY "Users can delete their own nutrition logs"
  ON public.nutrition_logs FOR DELETE USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nutrition-images',
  'nutrition-images',
  false,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 8388608,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Users can upload their own nutrition images" ON storage.objects;
CREATE POLICY "Users can upload their own nutrition images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'nutrition-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can view their own nutrition images" ON storage.objects;
CREATE POLICY "Users can view their own nutrition images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'nutrition-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own nutrition images" ON storage.objects;
CREATE POLICY "Users can delete their own nutrition images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'nutrition-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
