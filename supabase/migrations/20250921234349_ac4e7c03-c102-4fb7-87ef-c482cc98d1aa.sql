-- Add optimistic locking to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create unique constraint to prevent duplicate assignments per trick instance
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_active_trick_instance 
ON public.assignments (trick_instance_id) 
WHERE deleted_at IS NULL;

-- Add missing atw_jobs table if needed for business logic
CREATE TABLE IF NOT EXISTS public.atw_jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  desk_id INTEGER,
  required_rank VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on atw_jobs
ALTER TABLE public.atw_jobs ENABLE ROW LEVEL SECURITY;

-- Create service role policy for atw_jobs
CREATE POLICY "srv_all_atw_jobs" ON public.atw_jobs FOR ALL
  USING (auth.role() = 'service_role');

-- Create trigger for updated_at on atw_jobs
CREATE TRIGGER update_atw_jobs_updated_at
  BEFORE UPDATE ON public.atw_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger to assignments if missing
DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.assignments;
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();