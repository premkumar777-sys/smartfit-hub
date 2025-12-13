-- Create workouts table for storing AI-generated workout plans
CREATE TABLE public.workouts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    goal TEXT,
    bmi NUMERIC(4,1),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Users can view their own workouts
CREATE POLICY "Users can view their own workouts"
ON public.workouts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own workouts
CREATE POLICY "Users can insert their own workouts"
ON public.workouts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own workouts
CREATE POLICY "Users can update their own workouts"
ON public.workouts
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own workouts
CREATE POLICY "Users can delete their own workouts"
ON public.workouts
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_workouts_updated_at
BEFORE UPDATE ON public.workouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();