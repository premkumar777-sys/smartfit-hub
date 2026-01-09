
-- Create gym_members table for member tracking
CREATE TABLE public.gym_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  membership_type TEXT NOT NULL DEFAULT 'basic',
  membership_status TEXT NOT NULL DEFAULT 'active',
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  monthly_fee DECIMAL(10,2) DEFAULT 0,
  check_ins INTEGER DEFAULT 0,
  last_check_in TIMESTAMP WITH TIME ZONE,
  churn_risk_score DECIMAL(3,2) DEFAULT 0,
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create gym_check_ins for attendance tracking
CREATE TABLE public.gym_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL,
  member_id UUID REFERENCES public.gym_members(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  check_out_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  equipment_used TEXT[],
  workout_type TEXT
);

-- Create gym_revenue for financial tracking
CREATE TABLE public.gym_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL,
  revenue_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  member_id UUID REFERENCES public.gym_members(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create gym_equipment for utilization tracking
CREATE TABLE public.gym_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  purchase_date DATE,
  last_maintenance DATE,
  usage_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'operational',
  utilization_rate DECIMAL(5,2) DEFAULT 0
);

-- Create gym_classes for class management
CREATE TABLE public.gym_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL,
  class_name TEXT NOT NULL,
  instructor TEXT,
  capacity INTEGER DEFAULT 20,
  enrolled INTEGER DEFAULT 0,
  schedule JSONB,
  popularity_score DECIMAL(3,2) DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0
);

-- Create gym_insights for AI-generated insights
CREATE TABLE public.gym_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  action_items JSONB,
  potential_impact DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_read BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_insights ENABLE ROW LEVEL SECURITY;

-- Create policies (for authenticated users - gym owners)
CREATE POLICY "Gym owners can manage members" ON public.gym_members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Gym owners can manage check-ins" ON public.gym_check_ins
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Gym owners can manage revenue" ON public.gym_revenue
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Gym owners can manage equipment" ON public.gym_equipment
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Gym owners can manage classes" ON public.gym_classes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Gym owners can manage insights" ON public.gym_insights
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Analytics functions
CREATE OR REPLACE FUNCTION public.get_peak_hours(p_gym_id UUID)
RETURNS TABLE(hour INTEGER, check_in_count BIGINT) 
LANGUAGE sql STABLE
AS $$
  SELECT EXTRACT(HOUR FROM check_in_time)::INTEGER as hour, COUNT(*) as check_in_count
  FROM public.gym_check_ins
  WHERE gym_id = p_gym_id AND check_in_time > NOW() - INTERVAL '30 days'
  GROUP BY hour
  ORDER BY check_in_count DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_member_retention_rate(p_gym_id UUID)
RETURNS DECIMAL
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (COUNT(*) FILTER (WHERE membership_status = 'active')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    0
  )
  FROM public.gym_members
  WHERE gym_id = p_gym_id;
$$;

CREATE OR REPLACE FUNCTION public.get_monthly_revenue_trend(p_gym_id UUID)
RETURNS TABLE(month TEXT, total_revenue DECIMAL)
LANGUAGE sql STABLE
AS $$
  SELECT TO_CHAR(transaction_date, 'Mon YYYY') as month, SUM(amount) as total_revenue
  FROM public.gym_revenue
  WHERE gym_id = p_gym_id AND transaction_date > NOW() - INTERVAL '12 months'
  GROUP BY TO_CHAR(transaction_date, 'Mon YYYY'), DATE_TRUNC('month', transaction_date)
  ORDER BY DATE_TRUNC('month', transaction_date);
$$;
