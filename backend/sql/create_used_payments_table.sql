-- Run this SQL in Supabase to create the used_payments table
-- This prevents payment ID reuse

CREATE TABLE IF NOT EXISTS public.used_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2),
    plan_name TEXT,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.used_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payments
CREATE POLICY "Users can view own payments"
ON public.used_payments FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Service role can insert
CREATE POLICY "Service can insert payments"
ON public.used_payments FOR INSERT
WITH CHECK (true);

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_used_payments_payment_id ON public.used_payments(payment_id);
