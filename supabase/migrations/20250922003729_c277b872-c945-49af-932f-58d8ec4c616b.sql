-- Fix security definer views by dropping with CASCADE and recreating as standard views
DROP VIEW IF EXISTS public.dispatcher_current_ownership CASCADE;
DROP VIEW IF EXISTS public.dispatcher_current_assignment CASCADE;  
DROP VIEW IF EXISTS public.dispatcher_current_division CASCADE;

-- Recreate as standard views (not security definer)
CREATE VIEW public.dispatcher_current_ownership AS
SELECT 
  d.dispatcher_id,
  div.division_id
FROM public.dispatchers d
LEFT JOIN public.divisions div ON true
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
  div.division_id,
  div.code,
  div.name
FROM public.dispatchers d
LEFT JOIN public.divisions div ON true
WHERE d.status = 'active';