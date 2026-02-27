-- Add preferences column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "notifications": {
    "email": true,
    "push": true
  },
  "units": "metric",
  "privacy": "public",
  "theme": "dark",
  "language": "english"
}'::JSONB;

-- Comment on column
COMMENT ON COLUMN public.profiles.preferences IS 'User app preferences and settings stored as JSONB';
