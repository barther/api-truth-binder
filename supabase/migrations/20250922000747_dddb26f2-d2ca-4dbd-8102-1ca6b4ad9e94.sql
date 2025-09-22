-- ATW = "Around The World" (third-shift weekly desk map). Do NOT rename or redefine.
-- Update atw_jobs table to match canonical ATW definition

-- Drop and recreate atw_jobs table with correct schema
DROP TABLE IF EXISTS public.atw_jobs CASCADE;

CREATE TABLE public.atw_jobs (
  id INTEGER NOT NULL DEFAULT nextval('atw_jobs_id_seq'::regclass) PRIMARY KEY,
  label VARCHAR NOT NULL,
  policy JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.atw_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "srv_all_atw_jobs" 
ON public.atw_jobs 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_atw_jobs_updated_at
BEFORE UPDATE ON public.atw_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add validation check for policy structure
ALTER TABLE public.atw_jobs 
ADD CONSTRAINT check_policy_structure 
CHECK (
  policy ? 'variant' AND 
  policy ? 'days' AND
  policy->>'variant' = 'third_shift_weekly_map' AND
  policy->'days' ? 'Mon' AND
  policy->'days' ? 'Tue' AND
  policy->'days' ? 'Wed' AND
  policy->'days' ? 'Thu' AND
  policy->'days' ? 'Fri' AND
  policy->'days' ? 'Sat' AND
  policy->'days' ? 'Sun'
);

-- Comment on table for clarity
COMMENT ON TABLE public.atw_jobs IS 'ATW (Around The World) jobs - third-shift relief positions with weekly desk rotation map';