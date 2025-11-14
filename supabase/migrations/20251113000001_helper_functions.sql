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
