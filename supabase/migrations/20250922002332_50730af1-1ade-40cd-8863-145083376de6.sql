-- NOC Dispatch Scheduling System - Complete Schema Refactor
-- Implement exactly as specified in the requirements

BEGIN;

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS public.atw_jobs CASCADE;
DROP TABLE IF EXISTS public.qualifications CASCADE;
DROP TABLE IF EXISTS public.seniority CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.trick_instances CASCADE;
DROP TABLE IF EXISTS public.tricks CASCADE;
DROP TABLE IF EXISTS public.desks CASCADE;
DROP TABLE IF EXISTS public.dispatchers CASCADE;

-- Enable btree_gist extension for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Divisions (reference table)
CREATE TABLE divisions (
  division_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL CHECK (char_length(code) >= 2),
  name text UNIQUE NOT NULL
);

INSERT INTO divisions (code, name) VALUES
 ('CST','Coastal'),
 ('GLF','Gulf'),
 ('BLR','Blue Ridge'),
 ('MWD','Midwest'),
 ('GLK','Great Lakes'),
 ('KEY','Keystone');

-- Desks (immutable backbone)
CREATE TABLE desks (
  desk_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  desk_code text UNIQUE NOT NULL,        -- e.g., "BT2"
  desk_name text NOT NULL,               -- human label
  division_id uuid NOT NULL REFERENCES divisions(division_id) ON UPDATE CASCADE,
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX desks_division_idx ON desks(division_id);

-- Shifts
CREATE TABLE shifts (
  shift_id smallserial PRIMARY KEY,
  code text UNIQUE NOT NULL,             -- e.g., "1st","2nd","3rd"
  starts_at time NOT NULL,
  ends_at time NOT NULL
);

-- Insert standard shifts
INSERT INTO shifts (code, starts_at, ends_at) VALUES
  ('1st', '06:00', '14:00'),
  ('2nd', '14:00', '22:00'),
  ('3rd', '22:00', '06:00');

-- Tricks (desk × shift slot that is schedulable)
CREATE TABLE tricks (
  trick_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  desk_id uuid NOT NULL REFERENCES desks(desk_id) ON UPDATE CASCADE,
  shift_id smallint NOT NULL REFERENCES shifts(shift_id),
  title text NOT NULL,                   -- e.g., "BT2 – 3rd"
  UNIQUE (desk_id, shift_id)
);

CREATE INDEX tricks_desk_idx  ON tricks(desk_id);
CREATE INDEX tricks_shift_idx ON tricks(shift_id);

-- Dispatchers (no division column; it's derived)
CREATE TABLE dispatchers (
  dispatcher_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_id text UNIQUE NOT NULL,
  last_name text NOT NULL,
  first_name text NOT NULL,
  seniority_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('active','inactive','retired','terminated'))
);

-- Job ownership (bid/hold-down/perm/ATW)
CREATE TABLE job_awards (
  job_award_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trick_id uuid NOT NULL REFERENCES tricks(trick_id) ON UPDATE CASCADE,
  dispatcher_id uuid NOT NULL REFERENCES dispatchers(dispatcher_id) ON UPDATE CASCADE,
  start_date date NOT NULL,
  end_date   date,
  kind text NOT NULL CHECK (kind IN ('permanent','hold_down','atw')),
  UNIQUE (trick_id, start_date)
);

CREATE INDEX job_awards_active_idx ON job_awards(trick_id, dispatcher_id, start_date, end_date);

-- Assignments (who is scheduled for a given day)
CREATE TABLE assignments (
  assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trick_id uuid NOT NULL REFERENCES tricks(trick_id) ON UPDATE CASCADE,
  dispatcher_id uuid NOT NULL REFERENCES dispatchers(dispatcher_id) ON UPDATE CASCADE,
  work_date date NOT NULL,
  source text NOT NULL CHECK (source IN ('owner','relief','vacancy','swap','overtime')),
  UNIQUE (trick_id, work_date)
);

CREATE INDEX assignments_by_date_idx ON assignments(work_date);
CREATE INDEX assignments_by_dispatcher_idx ON assignments(dispatcher_id, work_date);

-- Exclusion constraint to prevent overlapping awards on the same trick
ALTER TABLE job_awards
  ADD CONSTRAINT no_overlap_per_trick
  EXCLUDE USING gist (
    trick_id WITH =,
    daterange(start_date, COALESCE(end_date, '9999-12-31')) WITH &&
  );

-- VIEWS (to derive current division)

-- Dispatcher ownership today
CREATE OR REPLACE VIEW dispatcher_current_ownership AS
SELECT
  d.dispatcher_id,
  dk.division_id
FROM job_awards ja
JOIN tricks t  ON t.trick_id = ja.trick_id
JOIN desks dk  ON dk.desk_id = t.desk_id
JOIN dispatchers d ON d.dispatcher_id = ja.dispatcher_id
WHERE (ja.start_date <= CURRENT_DATE)
  AND (ja.end_date IS NULL OR ja.end_date >= CURRENT_DATE);

-- Dispatcher assignments today
CREATE OR REPLACE VIEW dispatcher_current_assignment AS
SELECT
  a.dispatcher_id,
  dk.division_id
FROM assignments a
JOIN tricks t ON t.trick_id = a.trick_id
JOIN desks dk ON dk.desk_id = t.desk_id
WHERE a.work_date = CURRENT_DATE;

-- Final resolver: prefer ownership, else assignment
CREATE OR REPLACE VIEW dispatcher_current_division AS
SELECT
  disp.dispatcher_id,
  COALESCE(own.division_id, asn.division_id) AS division_id
FROM dispatchers disp
LEFT JOIN dispatcher_current_ownership own  ON own.dispatcher_id = disp.dispatcher_id
LEFT JOIN dispatcher_current_assignment asn ON asn.dispatcher_id = disp.dispatcher_id;

-- Enable RLS on all tables
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE desks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tricks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create service role policies for all tables
CREATE POLICY "srv_all_divisions" ON divisions FOR ALL USING (auth.role() = 'service_role'::text);
CREATE POLICY "srv_all_desks" ON desks FOR ALL USING (auth.role() = 'service_role'::text);
CREATE POLICY "srv_all_shifts" ON shifts FOR ALL USING (auth.role() = 'service_role'::text);
CREATE POLICY "srv_all_tricks" ON tricks FOR ALL USING (auth.role() = 'service_role'::text);
CREATE POLICY "srv_all_dispatchers" ON dispatchers FOR ALL USING (auth.role() = 'service_role'::text);
CREATE POLICY "srv_all_job_awards" ON job_awards FOR ALL USING (auth.role() = 'service_role'::text);
CREATE POLICY "srv_all_assignments" ON assignments FOR ALL USING (auth.role() = 'service_role'::text);

-- Insert sample data
INSERT INTO desks (desk_code, desk_name, division_id) 
SELECT 'BT', 'Birmingham Terminal', division_id FROM divisions WHERE code = 'GLF';

INSERT INTO tricks (desk_id, shift_id, title)
SELECT d.desk_id, s.shift_id, d.desk_code || ' – ' || s.code
FROM desks d, shifts s
WHERE d.desk_code = 'BT';

COMMIT;