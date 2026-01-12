-- Add new columns to trainer_clients table
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS height_feet NUMERIC;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS current_weight_kg NUMERIC;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS target_weight_kg NUMERIC;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS primary_goal TEXT;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS prior_experience TEXT;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS training_type TEXT;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS plan_duration TEXT;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS diet_preference TEXT;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS habits TEXT;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS medications TEXT;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS injuries TEXT;
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS is_enrolled BOOLEAN DEFAULT FALSE;
