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
-- =========================
-- Helper Views and Functions
-- These implement the business rules and algorithms
-- =========================

BEGIN;

-- ========== VIEWS ==========

-- Active job owners (incumbents)
CREATE OR REPLACE VIEW v_active_job_owners AS
SELECT jo.desk_trick_id, jo.employee_id, e.first_name, e.last_name, e.emp_no
FROM job_ownerships jo
JOIN employees e ON e.id = jo.employee_id
WHERE jo.is_incumbent = TRUE AND jo.end_date IS NULL;

-- Seniority ranking with deterministic tie-breakers
CREATE OR REPLACE VIEW v_seniority_rank AS
SELECT e.id AS employee_id,
       e.emp_no,
       e.first_name,
       e.last_name,
       e.seniority_date,
       e.hire_date,
       DENSE_RANK() OVER (
         ORDER BY e.seniority_date ASC, e.hire_date ASC, e.emp_no ASC
       ) AS seniority_rank
FROM employees e
WHERE e.status = 'ACTIVE';

-- Duty periods for HOS calculations
CREATE OR REPLACE VIEW v_employee_duty AS
SELECT a.employee_id,
       s.local_date,
       MIN(s.start_utc) AS duty_start_utc,
       MAX(s.end_utc) AS duty_end_utc,
       COUNT(*) AS segments
FROM assignments a
JOIN schedule_slots s ON s.id = a.schedule_slot_id
GROUP BY a.employee_id, s.local_date;

-- Vacancy detection
CREATE OR REPLACE VIEW v_vacancies AS
WITH primary_asg AS (
  SELECT a.schedule_slot_id, a.employee_id
  FROM assignments a
  WHERE a.role = 'PRIMARY'
)
SELECT s.id AS schedule_slot_id,
       s.local_date,
       s.desk_trick_id,
       dt.code AS trick_code,
       d.name AS desk_name,
       d.code AS desk_code,
       sh.name AS shift_name,
       div.name AS division_name,
       p.employee_id AS primary_employee_id,
       CASE
         WHEN p.schedule_slot_id IS NULL THEN 'NO_PRIMARY'
         WHEN EXISTS (
            SELECT 1 FROM mark_offs m
             WHERE m.employee_id = p.employee_id
               AND m.the_date = s.local_date
         ) THEN 'PRIMARY_MARKED_OFF'
         WHEN EXISTS (
            SELECT 1 FROM leaves l
             WHERE l.employee_id = p.employee_id
               AND s.local_date BETWEEN l.start_date AND l.end_date
         ) THEN 'PRIMARY_ON_LEAVE'
         ELSE NULL
       END AS vacancy_reason
FROM schedule_slots s
JOIN desk_tricks dt ON dt.id = s.desk_trick_id
JOIN desks d ON d.id = dt.desk_id
JOIN divisions div ON div.id = d.division_id
JOIN shifts sh ON sh.id = dt.shift_id
LEFT JOIN primary_asg p ON p.schedule_slot_id = s.id
WHERE p.schedule_slot_id IS NULL
   OR EXISTS (SELECT 1 FROM mark_offs m WHERE m.employee_id = p.employee_id AND m.the_date = s.local_date)
   OR EXISTS (SELECT 1 FROM leaves l WHERE l.employee_id = p.employee_id AND s.local_date BETWEEN l.start_date AND l.end_date);

-- ========== FUNCTIONS ==========

-- Compute slot UTC times from trick and local date
CREATE OR REPLACE FUNCTION compute_slot_window(_desk_trick_id bigint, _local_date date)
RETURNS TABLE(start_utc timestamptz, end_utc timestamptz)
LANGUAGE sql STABLE AS $$
  SELECT
    ((_local_date::timestamp + s.start_local) AT TIME ZONE s.tz) AT TIME ZONE 'UTC',
    ((_local_date::timestamp + s.start_local + make_interval(hours => s.duration_hours::int)) AT TIME ZONE s.tz) AT TIME ZONE 'UTC'
  FROM desk_tricks dt
  JOIN shifts s ON s.id = dt.shift_id
  WHERE dt.id = _desk_trick_id;
$$;

-- Check if dispatcher is qualified for desk
CREATE OR REPLACE FUNCTION is_qualified(_dispatcher bigint, _desk bigint)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM employee_qualifications q
    WHERE q.employee_id = _dispatcher AND q.desk_id = _desk AND q.qualified = TRUE
  );
$$ LANGUAGE sql STABLE;

-- Check HOS compliance (15-hour minimum rest)
CREATE OR REPLACE FUNCTION hos_ok(_dispatcher bigint, _start timestamptz)
RETURNS boolean AS $$
  WITH last_duty AS (
    SELECT MAX(dp.duty_end_utc) AS last_end
    FROM v_employee_duty dp
    WHERE dp.employee_id = _dispatcher
      AND dp.duty_end_utc < _start
  )
  SELECT COALESCE(
    (_start >= last_end + make_interval(hours => (SELECT value::int FROM config WHERE key = 'hos_min_rest_hours'))),
    true
  )
  FROM last_duty;
$$ LANGUAGE sql STABLE;

-- Get hours of rest since last duty
CREATE OR REPLACE FUNCTION rest_hours(_dispatcher bigint, _start timestamptz)
RETURNS numeric AS $$
  WITH last_duty AS (
    SELECT MAX(dp.duty_end_utc) AS last_end
    FROM v_employee_duty dp
    WHERE dp.employee_id = _dispatcher
      AND dp.duty_end_utc < _start
  )
  SELECT COALESCE(
    EXTRACT(EPOCH FROM (_start - last_end)) / 3600.0,
    999
  )::numeric(10,2)
  FROM last_duty;
$$ LANGUAGE sql STABLE;

-- Generate schedule slots for date range
CREATE OR REPLACE FUNCTION gen_schedule_slots(_from date, _to date, _generated_by text DEFAULT 'TEMPLATE')
RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  d date;
  t record;
  v_start timestamptz;
  v_end timestamptz;
  n int := 0;
BEGIN
  FOR d IN SELECT generate_series(_from, _to, interval '1 day')::date LOOP
    FOR t IN SELECT id, shift_id FROM desk_tricks WHERE active = TRUE LOOP
      SELECT start_utc, end_utc INTO v_start, v_end FROM compute_slot_window(t.id, d);
      INSERT INTO schedule_slots(local_date, desk_trick_id, shift_id, start_utc, end_utc, generated_by)
      VALUES (d, t.id, t.shift_id, v_start, v_end, _generated_by)
      ON CONFLICT (local_date, desk_trick_id) DO NOTHING;
      n := n + 1;
    END LOOP;
  END LOOP;
  RETURN n;
END$$;

-- Backfill expected assignments from ownership patterns
CREATE OR REPLACE FUNCTION backfill_expected_assignments(_from date, _to date)
RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE r record; n int := 0;
BEGIN
  FOR r IN
    WITH base AS (
      SELECT s.id AS slot_id, s.local_date, s.desk_trick_id
      FROM schedule_slots s
      WHERE s.local_date BETWEEN _from AND _to
    ),
    incumbent AS (
      SELECT b.slot_id, jo.employee_id, 'INCUMBENT'::assignment_source AS source
      FROM base b
      JOIN v_active_job_owners jo ON jo.desk_trick_id = b.desk_trick_id
    ),
    hold_down AS (
      SELECT b.slot_id, h.employee_id, 'HOLD_DOWN'::assignment_source
      FROM base b
      JOIN hold_downs h
        ON h.desk_trick_id = b.desk_trick_id
       AND (b.local_date BETWEEN h.start_date AND COALESCE(h.end_date,'9999-12-31'))
    ),
    relief AS (
      SELECT b.slot_id, rlo.employee_id, 'RELIEF_LINE'::assignment_source
      FROM base b
      JOIN relief_line_patterns rlp ON rlp.desk_trick_id = b.desk_trick_id
      JOIN relief_line_ownerships rlo
        ON rlo.relief_line_id = rlp.relief_line_id AND rlo.end_date IS NULL
      WHERE rlp.dow = EXTRACT(ISODOW FROM b.local_date)::smallint
    ),
    atw AS (
      SELECT b.slot_id, ar.employee_id, 'ATW'::assignment_source
      FROM base b
      JOIN desk_tricks dt ON dt.id = b.desk_trick_id
      JOIN atw_roles ar ON ar.shift_id = dt.shift_id AND ar.active = TRUE
      JOIN atw_patterns ap ON ap.atw_role_id = ar.id
      JOIN desks d ON d.id = dt.desk_id AND d.id = ap.desk_id
      WHERE EXTRACT(ISODOW FROM b.local_date)::smallint = ap.dow
    ),
    picks AS (
      SELECT * FROM incumbent
      UNION ALL SELECT * FROM hold_down
      UNION ALL SELECT * FROM relief
      UNION ALL SELECT * FROM atw
    ),
    ranked AS (
      SELECT p.*, ROW_NUMBER() OVER (PARTITION BY slot_id ORDER BY
        CASE p.source WHEN 'INCUMBENT' THEN 1 WHEN 'HOLD_DOWN' THEN 2
                      WHEN 'RELIEF_LINE' THEN 3 ELSE 4 END) AS rn
      FROM picks p
    )
    SELECT slot_id, employee_id, source FROM ranked WHERE rn = 1
  LOOP
    IF NOT EXISTS (SELECT 1 FROM assignments a WHERE a.schedule_slot_id = r.slot_id AND a.role='PRIMARY') THEN
      INSERT INTO assignments(schedule_slot_id, employee_id, role, source)
      SELECT r.slot_id, r.employee_id, 'PRIMARY', r.source
      WHERE NOT EXISTS (
        SELECT 1 FROM schedule_slots s
        JOIN mark_offs m ON m.employee_id = r.employee_id AND m.the_date = s.local_date
        WHERE s.id = r.slot_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM schedule_slots s
        JOIN leaves l ON l.employee_id = r.employee_id
        WHERE s.id = r.slot_id AND s.local_date BETWEEN l.start_date AND l.end_date
      )
      ON CONFLICT DO NOTHING;
      n := n + 1;
    END IF;
  END LOOP;
  RETURN n;
END$$;

-- Get candidate employees for a vacancy
CREATE OR REPLACE FUNCTION get_candidates_for_vacancy(_slot_id bigint)
RETURNS TABLE(
  employee_id bigint,
  emp_no text,
  first_name text,
  last_name text,
  seniority_rank bigint,
  band text,
  source assignment_source,
  is_qualified boolean,
  is_hos_ok boolean,
  rest_hours numeric,
  is_available boolean
) LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_slot record;
  v_desk_id bigint;
BEGIN
  -- Get slot info
  SELECT s.*, dt.desk_id INTO v_slot
  FROM schedule_slots s
  JOIN desk_tricks dt ON dt.id = s.desk_trick_id
  WHERE s.id = _slot_id;

  v_desk_id := v_slot.desk_id;

  -- Return candidates in priority order
  RETURN QUERY
  WITH candidates AS (
    -- Band 0: Incumbent
    SELECT
      e.id,
      e.emp_no,
      e.first_name,
      e.last_name,
      sr.seniority_rank,
      'INCUMBENT' AS band,
      'INCUMBENT'::assignment_source AS source,
      0 AS band_order
    FROM v_active_job_owners jo
    JOIN employees e ON e.id = jo.employee_id
    JOIN v_seniority_rank sr ON sr.employee_id = e.id
    WHERE jo.desk_trick_id = v_slot.desk_trick_id

    UNION ALL

    -- Band 1: Hold-down
    SELECT
      e.id,
      e.emp_no,
      e.first_name,
      e.last_name,
      sr.seniority_rank,
      'HOLD_DOWN' AS band,
      'HOLD_DOWN'::assignment_source AS source,
      1 AS band_order
    FROM hold_downs hd
    JOIN employees e ON e.id = hd.employee_id
    JOIN v_seniority_rank sr ON sr.employee_id = e.id
    WHERE hd.desk_trick_id = v_slot.desk_trick_id
      AND v_slot.local_date BETWEEN hd.start_date AND COALESCE(hd.end_date, '9999-12-31'::date)

    UNION ALL

    -- Band 2: Relief Line
    SELECT
      e.id,
      e.emp_no,
      e.first_name,
      e.last_name,
      sr.seniority_rank,
      'RELIEF_LINE' AS band,
      'RELIEF_LINE'::assignment_source AS source,
      2 AS band_order
    FROM relief_line_patterns rlp
    JOIN relief_line_ownerships rlo ON rlo.relief_line_id = rlp.relief_line_id
    JOIN employees e ON e.id = rlo.employee_id
    JOIN v_seniority_rank sr ON sr.employee_id = e.id
    WHERE rlp.desk_trick_id = v_slot.desk_trick_id
      AND rlp.dow = EXTRACT(ISODOW FROM v_slot.local_date)::smallint
      AND rlo.end_date IS NULL

    UNION ALL

    -- Band 3: ATW (third shift only)
    SELECT
      e.id,
      e.emp_no,
      e.first_name,
      e.last_name,
      sr.seniority_rank,
      'ATW' AS band,
      'ATW'::assignment_source AS source,
      3 AS band_order
    FROM atw_roles ar
    JOIN atw_patterns ap ON ap.atw_role_id = ar.id
    JOIN employees e ON e.id = ar.employee_id
    JOIN v_seniority_rank sr ON sr.employee_id = e.id
    JOIN desk_tricks dt ON dt.id = v_slot.desk_trick_id
    WHERE ap.desk_id = v_desk_id
      AND ap.dow = EXTRACT(ISODOW FROM v_slot.local_date)::smallint
      AND ar.shift_id = dt.shift_id
      AND ar.active = TRUE

    UNION ALL

    -- Band 4: Board members (overtime pool)
    SELECT
      e.id,
      e.emp_no,
      e.first_name,
      e.last_name,
      sr.seniority_rank,
      'BOARD' AS band,
      'BOARD'::assignment_source AS source,
      4 AS band_order
    FROM board_memberships bm
    JOIN boards b ON b.id = bm.board_id
    JOIN employees e ON e.id = bm.employee_id
    JOIN v_seniority_rank sr ON sr.employee_id = e.id
    JOIN desk_tricks dt ON dt.id = v_slot.desk_trick_id
    JOIN desks d ON d.id = dt.desk_id
    WHERE b.division_id = d.division_id
      AND b.shift_id = dt.shift_id
      AND bm.end_date IS NULL
      AND b.active = TRUE
      AND e.is_board_eligible = TRUE
  )
  SELECT DISTINCT
    c.id AS employee_id,
    c.emp_no,
    c.first_name,
    c.last_name,
    c.seniority_rank,
    c.band,
    c.source,
    is_qualified(c.id, v_desk_id) AS is_qualified,
    hos_ok(c.id, v_slot.start_utc) AS is_hos_ok,
    rest_hours(c.id, v_slot.start_utc) AS rest_hours,
    NOT EXISTS (
      SELECT 1 FROM mark_offs m
      WHERE m.employee_id = c.id AND m.the_date = v_slot.local_date
    ) AND NOT EXISTS (
      SELECT 1 FROM leaves l
      WHERE l.employee_id = c.id AND v_slot.local_date BETWEEN l.start_date AND l.end_date
    ) AS is_available
  FROM candidates c
  ORDER BY c.band_order, c.seniority_rank, c.emp_no;
END$$;

COMMIT;
-- =========================
-- Sample Data for Testing
-- Real-world scenario with dispatchers, desks, and assignments
-- =========================

BEGIN;

-- Sample desks for Coastal division (Norfolk Southern)
INSERT INTO desks(code, name, division_id, active)
SELECT 'EE3', 'East End 3', id, TRUE FROM divisions WHERE code='COA'
UNION ALL
SELECT 'CN3', 'Central North 3', id, TRUE FROM divisions WHERE code='COA'
UNION ALL
SELECT 'BT2', 'Belt Two', id, TRUE FROM divisions WHERE code='COA'
UNION ALL
SELECT 'WS1', 'West Side 1', id, TRUE FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

-- Create tricks (desk × shift combinations)
-- EE3 and CN3 work 3rd shift with Sat/Sun rest
-- BT2 and WS1 work 1st shift with Sat/Sun rest
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, d.code || '-3RD', 6, 7, TRUE
FROM desks d
CROSS JOIN shifts s
WHERE d.code IN ('EE3','CN3') AND s.code='3RD'
UNION ALL
SELECT d.id, s.id, d.code || '-1ST', 6, 7, TRUE
FROM desks d
CROSS JOIN shifts s
WHERE d.code IN ('BT2','WS1') AND s.code='1ST'
ON CONFLICT (code) DO NOTHING;

-- Sample employees with realistic seniority
INSERT INTO employees(emp_no, last_name, first_name, seniority_date, hire_date, status, email, is_board_eligible)
VALUES
  -- Senior dispatchers
  ('1001', 'Anderson', 'James', '2010-03-15', '2009-08-01', 'ACTIVE', 'james.anderson@ns.com', true),
  ('1002', 'Baker', 'Maria', '2012-06-20', '2011-10-12', 'ACTIVE', 'maria.baker@ns.com', true),
  ('1003', 'Chen', 'David', '2014-01-10', '2013-05-01', 'ACTIVE', 'david.chen@ns.com', true),
  ('1004', 'Davis', 'Sarah', '2015-11-05', '2015-02-14', 'ACTIVE', 'sarah.davis@ns.com', true),

  -- Mid-level dispatchers
  ('1005', 'Evans', 'Michael', '2017-04-22', '2016-09-30', 'ACTIVE', 'michael.evans@ns.com', true),
  ('1006', 'Foster', 'Jennifer', '2018-08-15', '2018-01-20', 'ACTIVE', 'jennifer.foster@ns.com', true),
  ('1007', 'Garcia', 'Robert', '2019-02-28', '2018-07-15', 'ACTIVE', 'robert.garcia@ns.com', true),
  ('1008', 'Harris', 'Lisa', '2020-05-10', '2019-11-01', 'ACTIVE', 'lisa.harris@ns.com', true),

  -- Junior dispatchers
  ('1009', 'Ingram', 'Thomas', '2021-09-01', '2021-03-15', 'ACTIVE', 'thomas.ingram@ns.com', true),
  ('1010', 'Johnson', 'Emily', '2022-12-15', '2022-06-01', 'ACTIVE', 'emily.johnson@ns.com', true),
  ('1011', 'Kim', 'Andrew', '2023-07-20', '2023-01-10', 'ACTIVE', 'andrew.kim@ns.com', true),
  ('1012', 'Lee', 'Michelle', '2024-03-05', '2023-09-20', 'ACTIVE', 'michelle.lee@ns.com', true)
ON CONFLICT (emp_no) DO NOTHING;

-- Qualifications (who can work which desks)
-- Senior people qualified on all desks
INSERT INTO employee_qualifications(employee_id, desk_id, qualified, qualified_on)
SELECT e.id, d.id, TRUE, '2020-01-01'
FROM employees e
CROSS JOIN desks d
WHERE e.emp_no IN ('1001','1002','1003','1004')
  AND d.code IN ('EE3','CN3','BT2','WS1')
ON CONFLICT DO NOTHING;

-- Mid-level qualified on most desks
INSERT INTO employee_qualifications(employee_id, desk_id, qualified, qualified_on)
SELECT e.id, d.id, TRUE, '2022-01-01'
FROM employees e
CROSS JOIN desks d
WHERE e.emp_no IN ('1005','1006','1007')
  AND d.code IN ('EE3','CN3','BT2')
ON CONFLICT DO NOTHING;

-- Junior qualified on 1-2 desks
INSERT INTO employee_qualifications(employee_id, desk_id, qualified, qualified_on)
SELECT e.id, d.id, TRUE, '2023-06-01'
FROM employees e
CROSS JOIN desks d
WHERE e.emp_no = '1008' AND d.code IN ('EE3','BT2')
UNION ALL
SELECT e.id, d.id, TRUE, '2024-01-01'
FROM employees e
CROSS JOIN desks d
WHERE e.emp_no = '1009' AND d.code = 'EE3'
UNION ALL
SELECT e.id, d.id, TRUE, '2024-06-01'
FROM employees e
CROSS JOIN desks d
WHERE e.emp_no = '1010' AND d.code = 'CN3'
ON CONFLICT DO NOTHING;

-- Job ownership (who "owns" which trick as their regular assignment)
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2024-01-01', TRUE
FROM desk_tricks dt
JOIN employees e ON e.emp_no = '1002'
WHERE dt.code = 'EE3-3RD'
UNION ALL
SELECT dt.id, e.id, '2024-01-01', TRUE
FROM desk_tricks dt
JOIN employees e ON e.emp_no = '1001'
WHERE dt.code = 'CN3-3RD'
UNION ALL
SELECT dt.id, e.id, '2024-01-01', TRUE
FROM desk_tricks dt
JOIN employees e ON e.emp_no = '1004'
WHERE dt.code = 'BT2-1ST'
UNION ALL
SELECT dt.id, e.id, '2024-01-01', TRUE
FROM desk_tricks dt
JOIN employees e ON e.emp_no = '1003'
WHERE dt.code = 'WS1-1ST'
ON CONFLICT DO NOTHING;

-- Create a board for the Coastal 3rd shift
INSERT INTO boards(code, name, division_id, shift_id, active)
SELECT 'COA-3RD-XB', 'Coastal Third Shift Extra Board',
       div.id, s.id, TRUE
FROM divisions div
CROSS JOIN shifts s
WHERE div.code = 'COA' AND s.code = '3RD'
ON CONFLICT (code) DO NOTHING;

-- Add board members (the pool of people available for overtime)
INSERT INTO board_memberships(board_id, employee_id, start_date)
SELECT b.id, e.id, '2024-01-01'
FROM boards b
CROSS JOIN employees e
WHERE b.code = 'COA-3RD-XB'
  AND e.emp_no IN ('1005','1006','1007','1008','1009')
  AND e.is_board_eligible = TRUE
ON CONFLICT DO NOTHING;

-- Generate schedule slots for next 14 days
SELECT gen_schedule_slots(CURRENT_DATE, CURRENT_DATE + 13);

-- Backfill expected assignments (applies incumbents)
SELECT backfill_expected_assignments(CURRENT_DATE, CURRENT_DATE + 13);

COMMIT;

-- Show what we created
SELECT 'Sample data loaded successfully!' AS status;
SELECT COUNT(*) AS employee_count FROM employees;
SELECT COUNT(*) AS desk_count FROM desks;
SELECT COUNT(*) AS trick_count FROM desk_tricks;
SELECT COUNT(*) AS slot_count FROM schedule_slots;
SELECT COUNT(*) AS assignment_count FROM assignments;
SELECT COUNT(*) AS vacancy_count FROM v_vacancies WHERE local_date >= CURRENT_DATE;
