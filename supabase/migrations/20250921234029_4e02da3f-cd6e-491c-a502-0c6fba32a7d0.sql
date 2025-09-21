-- Fix RLS policies to allow service role access
-- First, update all existing policies to allow service role

-- Update desks policies
DROP POLICY IF EXISTS "Allow read access to desks" ON public.desks;
CREATE POLICY "srv_all_desks" ON public.desks FOR ALL
  USING (auth.role() = 'service_role');

-- Update dispatchers policies  
DROP POLICY IF EXISTS "Allow read access to dispatchers" ON public.dispatchers;
CREATE POLICY "srv_all_dispatchers" ON public.dispatchers FOR ALL
  USING (auth.role() = 'service_role');

-- Update tricks policies
DROP POLICY IF EXISTS "Allow read access to tricks" ON public.tricks;
CREATE POLICY "srv_all_tricks" ON public.tricks FOR ALL
  USING (auth.role() = 'service_role');

-- Update trick_instances policies
DROP POLICY IF EXISTS "Allow read access to trick_instances" ON public.trick_instances;
CREATE POLICY "srv_all_trick_instances" ON public.trick_instances FOR ALL
  USING (auth.role() = 'service_role');

-- Update assignments policies
DROP POLICY IF EXISTS "Allow full access to assignments" ON public.assignments;
CREATE POLICY "srv_all_assignments" ON public.assignments FOR ALL
  USING (auth.role() = 'service_role');

-- Update qualifications policies
DROP POLICY IF EXISTS "Allow read access to qualifications" ON public.qualifications;
CREATE POLICY "srv_all_qualifications" ON public.qualifications FOR ALL
  USING (auth.role() = 'service_role');

-- Update seniority policies
DROP POLICY IF EXISTS "Allow read access to seniority" ON public.seniority;
CREATE POLICY "srv_all_seniority" ON public.seniority FOR ALL
  USING (auth.role() = 'service_role');

-- Update absences policies
DROP POLICY IF EXISTS "Allow full access to absences" ON public.absences;
CREATE POLICY "srv_all_absences" ON public.absences FOR ALL
  USING (auth.role() = 'service_role');

-- Update hold_downs policies
DROP POLICY IF EXISTS "Allow full access to hold_downs" ON public.hold_downs;
CREATE POLICY "srv_all_hold_downs" ON public.hold_downs FOR ALL
  USING (auth.role() = 'service_role');

-- Update audit_logs policies
DROP POLICY IF EXISTS "Allow read access to audit_logs" ON public.audit_logs;
CREATE POLICY "srv_all_audit_logs" ON public.audit_logs FOR ALL
  USING (auth.role() = 'service_role');