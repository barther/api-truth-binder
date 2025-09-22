-- JOB OWNERSHIP SYSTEM - Complete Schema Rebuild
-- Based on NOC Dispatch Scheduling System flat prompt

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1) DESKS (rebuild with proper divisions)
DROP TABLE IF EXISTS desks CASCADE;
CREATE TABLE desks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  division TEXT NOT NULL CHECK (division IN ('Coastal','Gulf','Blue Ridge','Midwest','Great Lakes','Keystone')),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX desks_division_idx ON desks(division);

-- 2) TRICKS (desk × shift shell)
DROP TABLE IF EXISTS tricks CASCADE;
CREATE TABLE tricks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  desk_id UUID NOT NULL REFERENCES desks(id) ON DELETE CASCADE,
  shift TEXT NOT NULL CHECK (shift IN ('1ST','2ND','3RD')),
  work_days INT[] NOT NULL,  -- Mon=1..Sun=7
  UNIQUE (desk_id, shift)
);

CREATE INDEX tricks_desk_idx ON tricks(desk_id);

-- 3) JOBS (concrete schedulable instances)
DROP TABLE IF EXISTS jobs CASCADE;
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trick_id UUID NOT NULL REFERENCES tricks(id) ON DELETE CASCADE,
  job_code TEXT UNIQUE NOT NULL,
  notes TEXT
);

CREATE INDEX jobs_trick_idx ON jobs(trick_id);

-- 4) DISPATCHERS (rebuild with proper structure)
DROP TABLE IF EXISTS dispatchers CASCADE;
CREATE TABLE dispatchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_id TEXT UNIQUE NOT NULL,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  seniority_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','INACTIVE','ON_LEAVE'))
);

CREATE INDEX dispatchers_status_idx ON dispatchers(status);
CREATE INDEX dispatchers_seniority_idx ON dispatchers(seniority_date);

-- 5) QUALIFICATIONS (who can operate which desk)
DROP TABLE IF EXISTS dispatcher_qualifications CASCADE;
CREATE TABLE dispatcher_qualifications (
  dispatcher_id UUID REFERENCES dispatchers(id) ON DELETE CASCADE,
  desk_id UUID REFERENCES desks(id) ON DELETE CASCADE,
  qualified BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (dispatcher_id, desk_id)
);

CREATE INDEX dq_desk_idx ON dispatcher_qualifications(desk_id) WHERE qualified;

-- 6) JOB OWNERSHIP (long-lived)
DROP TABLE IF EXISTS job_ownerships CASCADE;
CREATE TABLE job_ownerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  dispatcher_id UUID NOT NULL REFERENCES dispatchers(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE,  -- null = still owns
  source TEXT NOT NULL CHECK (source IN ('BID','REBID','FORCE_ASSIGNED')),
  -- One active owner per job per date; use daterange exclusion
  CONSTRAINT one_active_owner_per_job
    EXCLUDE USING gist (
      job_id WITH =,
      daterange(start_date, COALESCE(end_date, 'infinity'::date), '[]') WITH &&
    )
);

CREATE INDEX job_ownerships_job_idx ON job_ownerships(job_id);
CREATE INDEX job_ownerships_dispatcher_idx ON job_ownerships(dispatcher_id);

-- 7) ASSIGNMENTS (daily coverage overrides) - rebuild
DROP TABLE IF EXISTS assignments CASCADE;
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  dispatcher_id UUID REFERENCES dispatchers(id) ON DELETE RESTRICT,
  source TEXT NOT NULL CHECK (source IN ('BASE','HOLD_DOWN','ATW','OVERTIME','TRAINEE')),
  requires_trainer BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  UNIQUE (job_id, service_date)
);

CREATE INDEX assignments_date_idx ON assignments(service_date);
CREATE INDEX assignments_dispatcher_date_idx ON assignments(dispatcher_id, service_date);

-- 8) ATW (3rd shift rotation templates)
DROP TABLE IF EXISTS atw_jobs CASCADE;
CREATE TABLE atw_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  default_shift TEXT NOT NULL CHECK (default_shift IN ('3RD')),
  active BOOLEAN NOT NULL DEFAULT true
);

DROP TABLE IF EXISTS atw_rotation CASCADE;
CREATE TABLE atw_rotation (
  atw_job_id UUID REFERENCES atw_jobs(id) ON DELETE CASCADE,
  dow INT NOT NULL CHECK (dow BETWEEN 1 AND 7), -- 1=Mon..7=Sun
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  PRIMARY KEY (atw_job_id, dow)
);

-- 9) ABSENCES (rebuild)
DROP TABLE IF EXISTS absences CASCADE;
CREATE TABLE absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatcher_id UUID NOT NULL REFERENCES dispatchers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT CHECK (reason IN ('VACATION','SICK','FMLA','OOS','OTHER'))
);

CREATE INDEX absences_dispatcher_range_idx ON absences (dispatcher_id, start_date, end_date);

-- UTILITY FUNCTIONS

-- Active owner for a job on a specific date
CREATE OR REPLACE FUNCTION active_job_owner_on(p_job_id UUID, p_date DATE)
RETURNS TABLE(dispatcher_id UUID, start_date DATE, end_date DATE, source TEXT) 
LANGUAGE SQL STABLE AS $$
  SELECT o.dispatcher_id, o.start_date, o.end_date, o.source
  FROM job_ownerships o
  WHERE o.job_id = p_job_id
    AND o.start_date <= p_date
    AND (o.end_date IS NULL OR o.end_date >= p_date)
  ORDER BY o.start_date DESC
  LIMIT 1
$$;

-- List expected jobs for a date
CREATE OR REPLACE FUNCTION jobs_for_date(p_date DATE)
RETURNS TABLE(job_id UUID, job_code TEXT, desk_id UUID, shift TEXT, explicit_assignment_id UUID) 
LANGUAGE SQL STABLE AS $$
  WITH dow AS (SELECT EXTRACT(isodow FROM p_date)::int AS d)
  SELECT
    j.id AS job_id,
    j.job_code,
    t.desk_id,
    t.shift,
    a.id AS explicit_assignment_id
  FROM jobs j
  JOIN tricks t ON t.id = j.trick_id
  JOIN dow ON true
  LEFT JOIN assignments a
    ON a.job_id = j.id AND a.service_date = p_date
  WHERE dow.d = ANY(t.work_days)
$$;

-- RPC Functions for ownership and assignments

-- Set job owner
CREATE OR REPLACE FUNCTION set_job_owner(p_job_id UUID, p_dispatcher_id UUID, p_start DATE, p_source TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE 
  v_desk UUID;
BEGIN
  -- qualification guard
  SELECT t.desk_id INTO v_desk
  FROM jobs j JOIN tricks t ON t.id = j.trick_id
  WHERE j.id = p_job_id;

  IF NOT EXISTS (
    SELECT 1 FROM dispatcher_qualifications dq
    WHERE dq.dispatcher_id = p_dispatcher_id
      AND dq.desk_id = v_desk
      AND dq.qualified = true
  ) THEN
    RAISE EXCEPTION 'This dispatcher is not qualified for this desk.';
  END IF;

  -- close prior ownership
  UPDATE job_ownerships
     SET end_date = p_start - 1
   WHERE job_id = p_job_id
     AND end_date IS NULL
     AND start_date <= p_start;

  -- insert new
  INSERT INTO job_ownerships(job_id, dispatcher_id, start_date, source)
  VALUES (p_job_id, p_dispatcher_id, p_start, p_source);
END$$;

-- Upsert assignment
CREATE OR REPLACE FUNCTION upsert_assignment(
  p_job_id UUID, p_date DATE, p_dispatcher_id UUID, p_source TEXT, p_requires_trainer BOOLEAN DEFAULT false
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE 
  v_id UUID; 
  v_desk UUID;
BEGIN
  SELECT t.desk_id INTO v_desk FROM jobs j JOIN tricks t ON t.id = j.trick_id WHERE j.id = p_job_id;

  -- Qualification: if not TRAINEE, must be qualified
  IF p_source <> 'TRAINEE' AND NOT EXISTS (
    SELECT 1 FROM dispatcher_qualifications dq
    WHERE dq.dispatcher_id = p_dispatcher_id AND dq.desk_id = v_desk AND dq.qualified
  ) THEN
    RAISE EXCEPTION 'This dispatcher is not qualified for this desk.';
  END IF;

  -- Double-booking check
  IF p_source <> 'TRAINEE' AND EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.service_date = p_date AND a.dispatcher_id = p_dispatcher_id
  ) THEN
    RAISE EXCEPTION 'This dispatcher already has a coverage assignment on that date.';
  END IF;

  INSERT INTO assignments (job_id, service_date, dispatcher_id, source, requires_trainer)
  VALUES (p_job_id, p_date, p_dispatcher_id, p_source, p_requires_trainer)
  ON CONFLICT (job_id, service_date) DO UPDATE
    SET dispatcher_id = EXCLUDED.dispatcher_id,
        source = EXCLUDED.source,
        requires_trainer = EXCLUDED.requires_trainer
  RETURNING id INTO v_id;

  RETURN v_id;
END$$;

-- Clear assignment
CREATE OR REPLACE FUNCTION clear_assignment(p_job_id UUID, p_date DATE)
RETURNS VOID LANGUAGE SQL AS $$
  DELETE FROM assignments WHERE job_id = p_job_id AND service_date = p_date;
$$;

-- SEED DATA
INSERT INTO desks(code,name,division) VALUES
('C1','Coastal 1','Coastal'),
('G1','Gulf 1','Gulf'),
('BR2','Blue Ridge 2','Blue Ridge'),
('MW3','Midwest 3','Midwest'),
('GL1','Great Lakes 1','Great Lakes'),
('KS1','Keystone 1','Keystone');

-- Tricks (Mon–Fri on 1st/2nd/3rd for BR2)
INSERT INTO tricks(desk_id,shift,work_days)
SELECT id,'1ST','{1,2,3,4,5}' FROM desks WHERE code='BR2';
INSERT INTO tricks(desk_id,shift,work_days)
SELECT id,'2ND','{1,2,3,4,5}' FROM desks WHERE code='BR2';
INSERT INTO tricks(desk_id,shift,work_days)
SELECT id,'3RD','{1,2,3,4,5}' FROM desks WHERE code='BR2';

-- Jobs
INSERT INTO jobs(trick_id,job_code)
SELECT t.id,'BR2-1ST' FROM tricks t JOIN desks d ON d.id=t.desk_id WHERE d.code='BR2' AND t.shift='1ST';
INSERT INTO jobs(trick_id,job_code)
SELECT t.id,'BR2-2ND' FROM tricks t JOIN desks d ON d.id=t.desk_id WHERE d.code='BR2' AND t.shift='2ND';
INSERT INTO jobs(trick_id,job_code)
SELECT t.id,'BR2-3RD' FROM tricks t JOIN desks d ON d.id=t.desk_id WHERE d.code='BR2' AND t.shift='3RD';

-- Dispatchers
INSERT INTO dispatchers(emp_id,last_name,first_name,seniority_date,status) VALUES
('1001','Doe','Jane','2018-03-14','ACTIVE'),
('1002','Smith','John','2020-07-22','ACTIVE'),
('1003','Johnson','Bob','2019-05-10','ACTIVE');

-- Qualifications
INSERT INTO dispatcher_qualifications(dispatcher_id,desk_id,qualified)
SELECT d.id, desk.id, true
FROM dispatchers d, desks desk
WHERE d.emp_id IN ('1001','1002','1003') AND desk.code='BR2';

-- Ownership: Jane owns BR2-3RD from 2025-09-12 onward
INSERT INTO job_ownerships(job_id,dispatcher_id,start_date,source)
SELECT j.id, (SELECT id FROM dispatchers WHERE emp_id='1001'),'2025-09-12','BID'
FROM jobs j WHERE j.job_code='BR2-3RD';

-- Enable RLS
ALTER TABLE desks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tricks ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatcher_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_ownerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE atw_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE atw_rotation ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

-- Service role policies (for edge functions)
CREATE POLICY "srv_all_desks" ON desks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_all_tricks" ON tricks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_all_jobs" ON jobs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_all_dispatchers" ON dispatchers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_all_dispatcher_qualifications" ON dispatcher_qualifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_all_job_ownerships" ON job_ownerships FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_all_assignments" ON assignments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_all_atw_jobs" ON atw_jobs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_all_atw_rotation" ON atw_rotation FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_all_absences" ON absences FOR ALL USING (auth.role() = 'service_role');