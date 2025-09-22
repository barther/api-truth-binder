-- Fix security linter issues

BEGIN;

-- Fix 1: Move btree_gist extension to extensions schema
DROP EXTENSION IF EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS btree_gist SCHEMA extensions;

-- Fix 2: Recreate views without SECURITY DEFINER (they were implicitly created as such)
-- Drop and recreate views as standard views
DROP VIEW IF EXISTS dispatcher_current_division CASCADE;
DROP VIEW IF EXISTS dispatcher_current_assignment CASCADE;
DROP VIEW IF EXISTS dispatcher_current_ownership CASCADE;

-- Recreate views as standard (non-security definer) views
CREATE VIEW dispatcher_current_ownership AS
SELECT
  d.dispatcher_id,
  dk.division_id
FROM job_awards ja
JOIN tricks t  ON t.trick_id = ja.trick_id
JOIN desks dk  ON dk.desk_id = t.desk_id
JOIN dispatchers d ON d.dispatcher_id = ja.dispatcher_id
WHERE (ja.start_date <= CURRENT_DATE)
  AND (ja.end_date IS NULL OR ja.end_date >= CURRENT_DATE);

CREATE VIEW dispatcher_current_assignment AS
SELECT
  a.dispatcher_id,
  dk.division_id
FROM assignments a
JOIN tricks t ON t.trick_id = a.trick_id
JOIN desks dk ON dk.desk_id = t.desk_id
WHERE a.work_date = CURRENT_DATE;

CREATE VIEW dispatcher_current_division AS
SELECT
  disp.dispatcher_id,
  COALESCE(own.division_id, asn.division_id) AS division_id
FROM dispatchers disp
LEFT JOIN dispatcher_current_ownership own  ON own.dispatcher_id = disp.dispatcher_id
LEFT JOIN dispatcher_current_assignment asn ON asn.dispatcher_id = disp.dispatcher_id;

COMMIT;