-- Fix security definer views by recreating them as standard views
DROP VIEW IF EXISTS public.dispatcher_current_ownership;
DROP VIEW IF EXISTS public.dispatcher_current_assignment;  
DROP VIEW IF EXISTS public.dispatcher_current_division;

-- Recreate as standard views (not security definer)
CREATE VIEW public.dispatcher_current_ownership AS
SELECT 
  d.dispatcher_id,
  d.division_id
FROM public.dispatchers d
WHERE d.status = 'active';

CREATE VIEW public.dispatcher_current_assignment AS
SELECT 
  d.dispatcher_id,
  div.division_id
FROM public.dispatchers d
LEFT JOIN public.divisions div ON true
WHERE d.status = 'active';

CREATE VIEW public.dispatcher_current_division AS
SELECT 
  d.dispatcher_id,
  div.division_id
FROM public.dispatchers d
LEFT JOIN public.divisions div ON true
WHERE d.status = 'active';