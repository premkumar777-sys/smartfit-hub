-- Run this SQL in your Supabase SQL Editor to enable cloud sync for Smart Progress

CREATE TABLE IF NOT EXISTS public.progress_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight DECIMAL(5,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own logs
CREATE POLICY "Users can manage their own progress logs"
ON public.progress_logs
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS progress_logs_user_id_date_idx ON public.progress_logs (user_id, date DESC);
