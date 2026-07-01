-- Create table for completed workouts
CREATE TABLE IF NOT EXISTS public.completed_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    routine_name TEXT NOT NULL,
    date TEXT NOT NULL,
    duration TEXT NOT NULL,
    sets INTEGER NOT NULL DEFAULT 0,
    volume TEXT NOT NULL,
    kcal INTEGER NOT NULL DEFAULT 0,
    muscle_groups TEXT[] NOT NULL DEFAULT '{}',
    exercises JSONB NOT NULL DEFAULT '[]',
    personal_records_count INTEGER NOT NULL DEFAULT 0,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.completed_workouts ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can create their own completed workouts" 
ON public.completed_workouts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own completed workouts" 
ON public.completed_workouts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own completed workouts" 
ON public.completed_workouts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completed workouts" 
ON public.completed_workouts 
FOR DELETE 
USING (auth.uid() = user_id);
