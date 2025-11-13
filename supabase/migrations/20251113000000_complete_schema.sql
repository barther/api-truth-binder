-- =========================
-- NOC Dispatch Scheduling DB (PostgreSQL)
-- Complete schema for union accountability tool
-- =========================

-- Drop existing tables if any (clean slate)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

BEGIN;

-- ---------- Enums ----------
CREATE TYPE employee_status AS ENUM ('ACTIVE','LEAVE','SUSPENDED','RETIRED','RESIGNED','TERMINATED');
CREATE TYPE assignment_role AS ENUM ('PRIMARY','TRAINER','TRAINEE');
CREATE TYPE assignment_source AS ENUM ('INCUMBENT','HOLD_DOWN','ATW','RELIEF_LINE','BOARD','OVERTIME','DIVERSION');
CREATE TYPE posting_status AS ENUM ('OPEN','CLOSED','AWARDED','CANCELLED');
CREATE TYPE award_status AS ENUM ('PENDING','CONFIRMED','DISQUALIFIED','DECLINED');
CREATE TYPE leave_type AS ENUM ('VACATION','FMLA','MEDICAL','INJURY','JURY','MILITARY','DISCIPLINE','OTHER');
CREATE TYPE markoff_reason AS ENUM ('SICK','PERSONAL','EMERGENCY','WEATHER','TRANSPORT','OTHER');
CREATE TYPE training_status AS ENUM ('PLANNED','IN_PROGRESS','COMPLETED','FAILED');
CREATE TYPE call_result AS ENUM ('CALLED','ACCEPTED','DECLINED','NO_ANSWER','VOICEMAIL','DISCONNECTED');
CREATE TYPE notification_kind AS ENUM ('ASSIGNMENT_ADDED','ASSIGNMENT_CHANGED','MARK_OFF_APPROVED','ENGINE_APPLIED','WARNING');
CREATE TYPE delivery_channel AS ENUM ('IN_APP','EMAIL','SMS');
CREATE TYPE app_role AS ENUM ('ADMIN','SUPERVISOR','DISPATCHER','READONLY');

-- ---------- Reference Tables ----------
CREATE TABLE divisions (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE shifts (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  start_local TIME NOT NULL,
  duration_hours NUMERIC(4,2) NOT NULL,
  crosses_midnight BOOLEAN NOT NULL DEFAULT FALSE,
  tz TEXT NOT NULL DEFAULT 'America/New_York'
);

CREATE TABLE weekdays (
  id SMALLINT PRIMARY KEY CHECK (id BETWEEN 1 AND 7),
  name TEXT NOT NULL UNIQUE
);

-- ---------- Core Static (desks & tricks) ----------
CREATE TABLE desks (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  division_id BIGINT NOT NULL REFERENCES divisions(id),
  territory_notes TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE desk_tricks (
  id BIGSERIAL PRIMARY KEY,
  desk_id BIGINT NOT NULL REFERENCES desks(id) ON DELETE CASCADE,
  shift_id BIGINT NOT NULL REFERENCES shifts(id),
  code TEXT NOT NULL UNIQUE,
  rest_day1 SMALLINT NOT NULL REFERENCES weekdays(id),
  rest_day2 SMALLINT NOT NULL REFERENCES weekdays(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (rest_day1 <> rest_day2)
);

CREATE INDEX idx_desk_tricks_desk ON desk_tricks(desk_id);
CREATE INDEX idx_desk_tricks_shift ON desk_tricks(shift_id);

-- ---------- People & Qualifications ----------
CREATE TABLE employees (
  id BIGSERIAL PRIMARY KEY,
  emp_no TEXT NOT NULL UNIQUE,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  suffix TEXT,
  seniority_date DATE NOT NULL,
  hire_date DATE,
  status employee_status NOT NULL DEFAULT 'ACTIVE',
  email TEXT,
  phone TEXT,
  is_board_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_employees_seniority ON employees(seniority_date, hire_date, emp_no);

CREATE TABLE employee_qualifications (
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  desk_id BIGINT NOT NULL REFERENCES desks(id) ON DELETE CASCADE,
  qualified BOOLEAN NOT NULL DEFAULT FALSE,
  qualified_on DATE,
  last_worked DATE,
  notes TEXT,
  PRIMARY KEY (employee_id, desk_id)
);

CREATE INDEX idx_qual_employee ON employee_qualifications(employee_id);
CREATE INDEX idx_qual_desk ON employee_qualifications(desk_id);

-- ---------- Job Ownership & Postings ----------
CREATE TABLE job_ownerships (
  id BIGSERIAL PRIMARY KEY,
  desk_trick_id BIGINT NOT NULL REFERENCES desk_tricks(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES employees(id),
  start_date DATE NOT NULL,
  end_date DATE,
  is_incumbent BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX uq_active_owner_per_trick
  ON job_ownerships(desk_trick_id)
  WHERE end_date IS NULL AND is_incumbent = TRUE;

CREATE TABLE job_postings (
  id BIGSERIAL PRIMARY KEY,
  desk_trick_id BIGINT NOT NULL REFERENCES desk_tricks(id) ON DELETE CASCADE,
  posted_on DATE NOT NULL,
  close_on DATE,
  reason TEXT,
  status posting_status NOT NULL DEFAULT 'OPEN'
);

CREATE TABLE job_awards (
  id BIGSERIAL PRIMARY KEY,
  posting_id BIGINT NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES employees(id),
  award_date DATE NOT NULL,
  effective_date DATE NOT NULL,
  status award_status NOT NULL DEFAULT 'PENDING',
  notes TEXT
);

-- ---------- Relief Lines ----------
CREATE TABLE relief_lines (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  division_id BIGINT NOT NULL REFERENCES divisions(id),
  shift_id BIGINT NOT NULL REFERENCES shifts(id),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE relief_line_patterns (
  relief_line_id BIGINT NOT NULL REFERENCES relief_lines(id) ON DELETE CASCADE,
  dow SMALLINT NOT NULL REFERENCES weekdays(id),
  desk_trick_id BIGINT NOT NULL REFERENCES desk_tricks(id),
  PRIMARY KEY (relief_line_id, dow)
);

CREATE TABLE relief_line_ownerships (
  id BIGSERIAL PRIMARY KEY,
  relief_line_id BIGINT NOT NULL REFERENCES relief_lines(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES employees(id),
  start_date DATE NOT NULL,
  end_date DATE
);

CREATE UNIQUE INDEX uq_active_owner_per_relief_line
  ON relief_line_ownerships(relief_line_id)
  WHERE end_date IS NULL;

-- ---------- ATW (Around-The-World) ----------
CREATE TABLE atw_roles (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_id BIGINT NOT NULL REFERENCES shifts(id),
  start_date DATE NOT NULL,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE atw_patterns (
  atw_role_id BIGINT NOT NULL REFERENCES atw_roles(id) ON DELETE CASCADE,
  dow SMALLINT NOT NULL REFERENCES weekdays(id),
  desk_id BIGINT NOT NULL REFERENCES desks(id),
  PRIMARY KEY (atw_role_id, dow)
);

-- ---------- Hold Downs ----------
CREATE TABLE hold_downs (
  id BIGSERIAL PRIMARY KEY,
  desk_trick_id BIGINT NOT NULL REFERENCES desk_tricks(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES employees(id),
  start_date DATE NOT NULL,
  end_date DATE,
  reason_type leave_type,
  notes TEXT,
  awarded_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  awarded_by BIGINT,
  locked BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX uq_hold_down_window
  ON hold_downs(desk_trick_id, start_date, COALESCE(end_date,'9999-12-31'::date));

-- ---------- Absences ----------
CREATE TABLE mark_offs (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  the_date DATE NOT NULL,
  reason markoff_reason NOT NULL DEFAULT 'OTHER',
  board_skip BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, the_date)
);

CREATE INDEX idx_markoffs_employee_date ON mark_offs(employee_id, the_date);

CREATE TABLE leaves (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type leave_type NOT NULL,
  note TEXT
);

-- ---------- Training ----------
CREATE TABLE training_pairs (
  id BIGSERIAL PRIMARY KEY,
  trainee_id BIGINT NOT NULL REFERENCES employees(id),
  trainer_id BIGINT NOT NULL REFERENCES employees(id),
  desk_id BIGINT NOT NULL REFERENCES desks(id),
  start_date DATE NOT NULL,
  end_date DATE,
  status training_status NOT NULL DEFAULT 'PLANNED',
  is_qualified_after BOOLEAN,
  qualified_on DATE,
  notes TEXT,
  CHECK (trainee_id <> trainer_id)
);

CREATE TABLE training_sessions (
  id BIGSERIAL PRIMARY KEY,
  training_pair_id BIGINT NOT NULL REFERENCES training_pairs(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  shift_id BIGINT NOT NULL REFERENCES shifts(id),
  hours NUMERIC(4,2) NOT NULL CHECK (hours > 0)
);

ALTER TABLE training_sessions
  ADD CONSTRAINT unique_trainer_slot UNIQUE (training_pair_id, session_date, shift_id);

-- ---------- Schedule & Assignments ----------
CREATE TABLE schedule_slots (
  id BIGSERIAL PRIMARY KEY,
  local_date DATE NOT NULL,
  desk_trick_id BIGINT NOT NULL REFERENCES desk_tricks(id) ON DELETE CASCADE,
  shift_id BIGINT NOT NULL REFERENCES shifts(id),
  start_utc TIMESTAMPTZ NOT NULL,
  end_utc TIMESTAMPTZ NOT NULL,
  generated_by TEXT,
  UNIQUE (local_date, desk_trick_id)
);

CREATE INDEX idx_schedule_slots_date ON schedule_slots(local_date);
CREATE INDEX idx_schedule_slots_trick ON schedule_slots(desk_trick_id);

CREATE TABLE assignments (
  id BIGSERIAL PRIMARY KEY,
  schedule_slot_id BIGINT NOT NULL REFERENCES schedule_slots(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES employees(id),
  role assignment_role NOT NULL DEFAULT 'PRIMARY',
  source assignment_source NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by BIGINT,
  notes TEXT
);

CREATE UNIQUE INDEX uq_primary_per_slot
  ON assignments(schedule_slot_id)
  WHERE role = 'PRIMARY';

CREATE UNIQUE INDEX uq_trainer_per_slot
  ON assignments(schedule_slot_id)
  WHERE role = 'TRAINER';

CREATE UNIQUE INDEX uq_trainee_per_slot
  ON assignments(schedule_slot_id)
  WHERE role = 'TRAINEE';

CREATE INDEX idx_assignments_employee ON assignments(employee_id);
CREATE INDEX idx_assignments_slot ON assignments(schedule_slot_id);

-- ---------- Diversions ----------
CREATE TABLE diversions (
  id BIGSERIAL PRIMARY KEY,
  from_slot_id BIGINT NOT NULL REFERENCES schedule_slots(id) ON DELETE CASCADE,
  to_slot_id BIGINT NOT NULL REFERENCES schedule_slots(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES employees(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Extraboard ----------
CREATE TABLE boards (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  division_id BIGINT NOT NULL REFERENCES divisions(id),
  shift_id BIGINT NOT NULL REFERENCES shifts(id),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE board_memberships (
  id BIGSERIAL PRIMARY KEY,
  board_id BIGINT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES employees(id),
  start_date DATE NOT NULL,
  end_date DATE
);

CREATE INDEX idx_board_membership_active
  ON board_memberships(board_id)
  WHERE end_date IS NULL;

CREATE TABLE board_call_log (
  id BIGSERIAL PRIMARY KEY,
  slot_id BIGINT NOT NULL REFERENCES schedule_slots(id) ON DELETE CASCADE,
  board_id BIGINT NOT NULL REFERENCES boards(id),
  employee_id BIGINT NOT NULL REFERENCES employees(id),
  called_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result call_result NOT NULL,
  notes TEXT
);

-- ---------- Configuration ----------
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ---------- Coverage Engine ----------
CREATE TABLE coverage_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  params JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE coverage_proposals (
  id BIGSERIAL PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES coverage_runs(id) ON DELETE CASCADE,
  vacancy_id BIGINT,
  schedule_slot_id BIGINT,
  trick_id BIGINT NOT NULL,
  local_date DATE NOT NULL,
  best_choice JSONB,
  alternatives JSONB NOT NULL DEFAULT '[]'
);

-- ---------- Audit Log ----------
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_user UUID,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  rule_trace JSONB,
  request_id TEXT,
  client_ip TEXT
);

-- ---------- Seed Data ----------
INSERT INTO divisions(code,name) VALUES
  ('COA','Coastal'),
  ('GLF','Gulf'),
  ('BR','Blue Ridge'),
  ('MW','Midwest'),
  ('GL','Great Lakes'),
  ('KEY','Keystone')
ON CONFLICT DO NOTHING;

INSERT INTO shifts(code,name,start_local,duration_hours,crosses_midnight)
VALUES
  ('1ST','First','07:00',8.00,false),
  ('2ND','Second','15:00',8.00,false),
  ('3RD','Third','23:00',8.00,true)
ON CONFLICT DO NOTHING;

INSERT INTO weekdays(id,name) VALUES
  (1,'Mon'),(2,'Tue'),(3,'Wed'),(4,'Thu'),(5,'Fri'),(6,'Sat'),(7,'Sun')
ON CONFLICT DO NOTHING;

INSERT INTO config(key,value) VALUES
  ('hos_min_rest_hours','15'),
  ('engine_w_avoid_second_vacancy','5'),
  ('engine_w_minimize_ot','3'),
  ('engine_w_cross_division','2'),
  ('engine_w_training_penalty','1'),
  ('engine_w_relief_preference','2')
ON CONFLICT (key) DO NOTHING;

COMMIT;
