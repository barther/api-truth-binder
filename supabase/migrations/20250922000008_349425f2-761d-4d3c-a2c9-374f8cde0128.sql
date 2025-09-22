-- Complete the NOC Admin Bundle schema (avoiding conflicts)

-- Drop existing conflicting policies first
DROP POLICY IF EXISTS "srv_all_tricks" ON public.tricks;
DROP POLICY IF EXISTS "srv_all_trick_instances" ON public.trick_instances;

-- Now create the policies
CREATE POLICY "srv_all_tricks" ON public.tricks FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "srv_all_trick_instances" ON public.trick_instances FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Add some sample data to get started
INSERT INTO public.tricks (desk_id, name, shift_start, shift_end, days_mask, timezone) 
SELECT d.id, 'First Shift', '06:00:00', '14:00:00', 127, 'America/New_York'
FROM public.desks d 
WHERE NOT EXISTS (SELECT 1 FROM public.tricks WHERE desk_id = d.id AND name = 'First Shift')
LIMIT 3;

INSERT INTO public.tricks (desk_id, name, shift_start, shift_end, days_mask, timezone) 
SELECT d.id, 'Second Shift', '14:00:00', '22:00:00', 127, 'America/New_York'
FROM public.desks d 
WHERE NOT EXISTS (SELECT 1 FROM public.tricks WHERE desk_id = d.id AND name = 'Second Shift')
LIMIT 3;

INSERT INTO public.tricks (desk_id, name, shift_start, shift_end, days_mask, timezone) 
SELECT d.id, 'Third Shift', '22:00:00', '06:00:00', 127, 'America/New_York'
FROM public.desks d 
WHERE NOT EXISTS (SELECT 1 FROM public.tricks WHERE desk_id = d.id AND name = 'Third Shift')
LIMIT 3;