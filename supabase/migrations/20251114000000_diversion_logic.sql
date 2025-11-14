-- =========================
-- Diversion Logic & Order of Call Enhancements
-- Adds qualifying status, pay basis tracking, EB baseline
-- =========================

BEGIN;

-- Add qualifying status to employees
ALTER TABLE employees
ADD COLUMN is_qualifying BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN employees.is_qualifying IS 'True if dispatcher is currently qualifying (training) and should be excluded from most coverage';

-- Add pay basis enum
CREATE TYPE pay_basis AS ENUM ('STRAIGHT_TIME', 'OVERTIME');

-- Add pay basis and more detail to assignments
ALTER TABLE assignments
ADD COLUMN pay_basis pay_basis NOT NULL DEFAULT 'STRAIGHT_TIME',
ADD COLUMN is_diversion BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN diverted_from_slot_id BIGINT REFERENCES schedule_slots(id),
ADD COLUMN eb_backfill_available BOOLEAN,
ADD COLUMN decision_path TEXT;

COMMENT ON COLUMN assignments.pay_basis IS 'Straight time or overtime pay';
COMMENT ON COLUMN assignments.is_diversion IS 'True if this is a diversion from another job';
COMMENT ON COLUMN assignments.diverted_from_slot_id IS 'If diversion, the original slot they were diverted from';
COMMENT ON COLUMN assignments.eb_backfill_available IS 'For diversions: was EB available to backfill their original job';
COMMENT ON COLUMN assignments.decision_path IS 'Audit trail: which step in order of call was used';

-- Add EB baseline configuration
INSERT INTO config (key, value) VALUES ('eb_baseline_strength', '10')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE config IS 'System configuration. eb_baseline_strength = minimum EB members needed';

-- Create function to check if dispatcher is on their rest day for a given slot
CREATE OR REPLACE FUNCTION is_on_rest_day(
  _employee_id BIGINT,
  _slot_id BIGINT
) RETURNS BOOLEAN
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_is_rest_day BOOLEAN;
BEGIN
  -- Check if the slot date is a rest day for any job they own
  SELECT EXISTS (
    SELECT 1
    FROM job_ownerships jo
    JOIN desk_tricks dt ON dt.id = jo.desk_trick_id
    JOIN schedule_slots s ON s.id = _slot_id
    WHERE jo.employee_id = _employee_id
      AND jo.end_date IS NULL
      AND EXTRACT(ISODOW FROM s.local_date)::smallint IN (dt.rest_day1, dt.rest_day2)
  ) INTO v_is_rest_day;

  RETURN v_is_rest_day;
END;
$$;

-- Create function to check current EB strength
CREATE OR REPLACE FUNCTION get_current_eb_strength(
  _division_id BIGINT,
  _shift_id BIGINT,
  _date DATE
) RETURNS INTEGER
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count active EB members who are available (not marked off, not on leave)
  SELECT COUNT(DISTINCT bm.employee_id)
  INTO v_count
  FROM board_memberships bm
  JOIN boards b ON b.id = bm.board_id
  JOIN employees e ON e.id = bm.employee_id
  WHERE b.division_id = _division_id
    AND b.shift_id = _shift_id
    AND b.active = TRUE
    AND bm.end_date IS NULL
    AND e.status = 'ACTIVE'
    AND e.is_board_eligible = TRUE
    AND e.is_qualifying = FALSE
    AND NOT EXISTS (
      SELECT 1 FROM mark_offs m
      WHERE m.employee_id = e.id AND m.the_date = _date
    )
    AND NOT EXISTS (
      SELECT 1 FROM leaves l
      WHERE l.employee_id = e.id AND _date BETWEEN l.start_date AND l.end_date
    );

  RETURN COALESCE(v_count, 0);
END;
$$;

-- Create function to get EB baseline from config
CREATE OR REPLACE FUNCTION get_eb_baseline() RETURNS INTEGER
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_baseline INTEGER;
BEGIN
  SELECT value::integer INTO v_baseline
  FROM config
  WHERE key = 'eb_baseline_strength';

  RETURN COALESCE(v_baseline, 10);
END;
$$;

-- Create function to check if EB is below baseline
CREATE OR REPLACE FUNCTION is_eb_below_baseline(
  _division_id BIGINT,
  _shift_id BIGINT,
  _date DATE
) RETURNS BOOLEAN
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN get_current_eb_strength(_division_id, _shift_id, _date) < get_eb_baseline();
END;
$$;

-- Create view to show current EB strength by division/shift
CREATE OR REPLACE VIEW v_eb_strength AS
SELECT
  d.id AS division_id,
  d.name AS division_name,
  s.id AS shift_id,
  s.name AS shift_name,
  b.id AS board_id,
  b.name AS board_name,
  COUNT(DISTINCT bm.employee_id) FILTER (
    WHERE e.status = 'ACTIVE'
    AND e.is_board_eligible = TRUE
    AND e.is_qualifying = FALSE
    AND bm.end_date IS NULL
  ) AS current_strength,
  get_eb_baseline() AS baseline_strength
FROM divisions d
CROSS JOIN shifts s
LEFT JOIN boards b ON b.division_id = d.id AND b.shift_id = s.id AND b.active = TRUE
LEFT JOIN board_memberships bm ON bm.board_id = b.id
LEFT JOIN employees e ON e.id = bm.employee_id
GROUP BY d.id, d.name, s.id, s.name, b.id, b.name;

COMMIT;
