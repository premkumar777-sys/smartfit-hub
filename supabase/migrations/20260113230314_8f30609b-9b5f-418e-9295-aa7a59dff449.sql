-- Create gyms table to establish ownership
CREATE TABLE IF NOT EXISTS public.gyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on gyms table
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

-- Create policy for gym owners to manage their own gyms
CREATE POLICY "Users can manage own gyms" ON public.gyms
    FOR ALL USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Create a security definer function to check gym ownership
-- This avoids recursive RLS issues when checking ownership in policies
CREATE OR REPLACE FUNCTION public.is_gym_owner(_gym_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.gyms
        WHERE id = _gym_id AND owner_id = auth.uid()
    )
$$;

-- Add foreign key constraints to gym tables (if not exists already)
-- Using DO block to handle if constraints already exist
DO $$
BEGIN
    -- For gym_members
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_gym_members_gym') THEN
        ALTER TABLE public.gym_members 
        ADD CONSTRAINT fk_gym_members_gym FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;
    END IF;
    
    -- For gym_check_ins
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_gym_check_ins_gym') THEN
        ALTER TABLE public.gym_check_ins 
        ADD CONSTRAINT fk_gym_check_ins_gym FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;
    END IF;
    
    -- For gym_classes
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_gym_classes_gym') THEN
        ALTER TABLE public.gym_classes 
        ADD CONSTRAINT fk_gym_classes_gym FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;
    END IF;
    
    -- For gym_equipment
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_gym_equipment_gym') THEN
        ALTER TABLE public.gym_equipment 
        ADD CONSTRAINT fk_gym_equipment_gym FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;
    END IF;
    
    -- For gym_insights
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_gym_insights_gym') THEN
        ALTER TABLE public.gym_insights 
        ADD CONSTRAINT fk_gym_insights_gym FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;
    END IF;
    
    -- For gym_revenue
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_gym_revenue_gym') THEN
        ALTER TABLE public.gym_revenue 
        ADD CONSTRAINT fk_gym_revenue_gym FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Gym owners can manage members" ON public.gym_members;
DROP POLICY IF EXISTS "Gym owners can manage check-ins" ON public.gym_check_ins;
DROP POLICY IF EXISTS "Gym owners can manage classes" ON public.gym_classes;
DROP POLICY IF EXISTS "Gym owners can manage equipment" ON public.gym_equipment;
DROP POLICY IF EXISTS "Gym owners can manage insights" ON public.gym_insights;
DROP POLICY IF EXISTS "Gym owners can manage revenue" ON public.gym_revenue;

-- Create new secure RLS policies using the is_gym_owner function

-- gym_members: Only gym owners can manage their members
CREATE POLICY "Gym owners can manage members" ON public.gym_members
    FOR ALL USING (public.is_gym_owner(gym_id))
    WITH CHECK (public.is_gym_owner(gym_id));

-- gym_check_ins: Only gym owners can manage check-ins
CREATE POLICY "Gym owners can manage check-ins" ON public.gym_check_ins
    FOR ALL USING (public.is_gym_owner(gym_id))
    WITH CHECK (public.is_gym_owner(gym_id));

-- gym_classes: Only gym owners can manage classes
CREATE POLICY "Gym owners can manage classes" ON public.gym_classes
    FOR ALL USING (public.is_gym_owner(gym_id))
    WITH CHECK (public.is_gym_owner(gym_id));

-- gym_equipment: Only gym owners can manage equipment
CREATE POLICY "Gym owners can manage equipment" ON public.gym_equipment
    FOR ALL USING (public.is_gym_owner(gym_id))
    WITH CHECK (public.is_gym_owner(gym_id));

-- gym_insights: Only gym owners can manage insights
CREATE POLICY "Gym owners can manage insights" ON public.gym_insights
    FOR ALL USING (public.is_gym_owner(gym_id))
    WITH CHECK (public.is_gym_owner(gym_id));

-- gym_revenue: Only gym owners can manage revenue
CREATE POLICY "Gym owners can manage revenue" ON public.gym_revenue
    FOR ALL USING (public.is_gym_owner(gym_id))
    WITH CHECK (public.is_gym_owner(gym_id));

-- Add trigger for updated_at on gyms table
CREATE TRIGGER update_gyms_updated_at
    BEFORE UPDATE ON public.gyms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();