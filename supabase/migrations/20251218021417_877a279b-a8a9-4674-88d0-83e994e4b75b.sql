-- Create phone_otps table for SMS OTP storage
CREATE TABLE IF NOT EXISTS public.phone_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false
);

-- Create index for phone lookup
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone ON public.phone_otps(phone);

-- Enable RLS
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- No public policies - only edge functions with service role can access
-- This ensures OTPs are only managed server-side

-- Function to cleanup expired phone OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_phone_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.phone_otps WHERE expires_at < now();
END;
$$;