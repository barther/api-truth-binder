-- Create ATW jobs table
CREATE TABLE public.atw_jobs (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  policy JSONB NOT NULL DEFAULT '{
    "variant": "third_shift_weekly_map",
    "days": {
      "Mon": null,
      "Tue": null,
      "Wed": null,
      "Thu": null,
      "Fri": null,
      "Sat": null,
      "Sun": null
    }
  }'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.atw_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
CREATE POLICY "ATW jobs are viewable by everyone" 
ON public.atw_jobs 
FOR SELECT 
USING (true);

CREATE POLICY "ATW jobs can be created by everyone" 
ON public.atw_jobs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "ATW jobs can be updated by everyone" 
ON public.atw_jobs 
FOR UPDATE 
USING (true);

CREATE POLICY "ATW jobs can be deleted by everyone" 
ON public.atw_jobs 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_atw_jobs_updated_at
  BEFORE UPDATE ON public.atw_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data
INSERT INTO public.atw_jobs (label, policy, is_active) VALUES
('Main ATW Relief', '{
  "variant": "third_shift_weekly_map",
  "days": {
    "Mon": 1,
    "Tue": 2,
    "Wed": 3,
    "Thu": 1,
    "Fri": 2,
    "Sat": null,
    "Sun": null
  }
}'::jsonb, true),
('Backup ATW Coverage', '{
  "variant": "third_shift_weekly_map",
  "days": {
    "Mon": null,
    "Tue": null,
    "Wed": null,
    "Thu": null,
    "Fri": null,
    "Sat": 1,
    "Sun": 1
  }
}'::jsonb, false);