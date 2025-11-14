-- =========================
-- Cascade Resolution & Board Rotation
-- Makes the algorithm fully deterministic with no wiggle room
-- =========================

BEGIN;

-- ========================================
-- BOARD ROTATION TRACKING
-- ========================================

-- Add rotation tracking to board_memberships
ALTER TABLE board_memberships
ADD COLUMN rotation_position INTEGER,
ADD COLUMN last_called_at TIMESTAMPTZ,
ADD COLUMN last_accepted_at TIMESTAMPTZ,
ADD COLUMN consecutive_declines INTEGER NOT NULL DEFAULT 0,
ADD COLUMN total_calls INTEGER NOT NULL DEFAULT 0,
ADD COLUMN total_assignments INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN board_memberships.rotation_position IS 'Position in fair rotation order (1-based)';
COMMENT ON COLUMN board_memberships.last_called_at IS 'Last time this member was called for a vacancy';
COMMENT ON COLUMN board_memberships.last_accepted_at IS 'Last time they accepted an assignment';
COMMENT ON COLUMN board_memberships.consecutive_declines IS 'Number of consecutive declines (for skip handling)';
COMMENT ON COLUMN board_memberships.total_calls IS 'Total times called (for fair distribution tracking)';
COMMENT ON COLUMN board_memberships.total_assignments IS 'Total assignments accepted (for workload balancing)';

-- Create index for rotation queries
CREATE INDEX idx_board_rotation ON board_memberships(board_id, rotation_position)
WHERE end_date IS NULL;

-- Function to initialize rotation positions for a board
CREATE OR REPLACE FUNCTION initialize_board_rotation(_board_id BIGINT)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  -- Assign rotation positions by seniority (most senior = position 1)
  WITH ranked AS (
    SELECT
      bm.id,
      ROW_NUMBER() OVER (ORDER BY e.seniority_date, e.hire_date, e.emp_no) AS position
    FROM board_memberships bm
    JOIN employees e ON e.id = bm.employee_id
    WHERE bm.board_id = _board_id
      AND bm.end_date IS NULL
  )
  UPDATE board_memberships bm
  SET rotation_position = r.position
  FROM ranked r
  WHERE bm.id = r.id;
END;
$$;

-- Function to get next EB member in rotation
CREATE OR REPLACE FUNCTION get_next_in_rotation(
  _board_id BIGINT,
  _date DATE
) RETURNS BIGINT
LANGUAGE plpgsql AS $$
DECLARE
  v_next_employee_id BIGINT;
BEGIN
  -- Find the next available member in rotation order
  -- Skip those who are marked off or on leave
  SELECT bm.employee_id INTO v_next_employee_id
  FROM board_memberships bm
  JOIN employees e ON e.id = bm.employee_id
  WHERE bm.board_id = _board_id
    AND bm.end_date IS NULL
    AND e.status = 'ACTIVE'
    AND e.is_qualifying = FALSE
    -- Not marked off
    AND NOT EXISTS (
      SELECT 1 FROM mark_offs m
      WHERE m.employee_id = e.id AND m.the_date = _date
    )
    -- Not on leave
    AND NOT EXISTS (
      SELECT 1 FROM leaves l
      WHERE l.employee_id = e.id AND _date BETWEEN l.start_date AND l.end_date
    )
  ORDER BY
    -- Prioritize by rotation position
    bm.rotation_position,
    -- Then by least calls (fair distribution)
    bm.total_calls,
    -- Then by seniority as tiebreaker
    e.seniority_date, e.hire_date, e.emp_no
  LIMIT 1;

  RETURN v_next_employee_id;
END;
$$;

-- ========================================
-- OFFER/DECLINE TRACKING
-- ========================================

-- Add offer/decline tracking to call_result enum if not already there
-- (board_call_log table already exists in schema)

-- Enhance board_call_log with more tracking
ALTER TABLE board_call_log
ADD COLUMN offered_to_employee_id BIGINT REFERENCES employees(id),
ADD COLUMN offer_sequence INTEGER NOT NULL DEFAULT 1,
ADD COLUMN response_time TIMESTAMPTZ,
ADD COLUMN decline_reason TEXT;

COMMENT ON COLUMN board_call_log.offered_to_employee_id IS 'Employee who was offered (may differ from assigned if they declined)';
COMMENT ON COLUMN board_call_log.offer_sequence IS 'Order in which offers were made (1=first offer, 2=second, etc)';
COMMENT ON COLUMN board_call_log.response_time IS 'When they responded to the offer';
COMMENT ON COLUMN board_call_log.decline_reason IS 'Why they declined (if applicable)';

-- ========================================
-- CASCADE TRACKING
-- ========================================

-- Table to track cascade chains when diversions create new vacancies
CREATE TABLE coverage_cascades (
  id BIGSERIAL PRIMARY KEY,
  root_vacancy_slot_id BIGINT NOT NULL REFERENCES schedule_slots(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolution_depth INTEGER NOT NULL DEFAULT 0,
  final_status TEXT CHECK (final_status IN ('RESOLVED', 'PARTIAL', 'FAILED', 'MAX_DEPTH'))
);

COMMENT ON TABLE coverage_cascades IS 'Tracks cascade chains when diversions create new vacancies';
COMMENT ON COLUMN coverage_cascades.root_vacancy_slot_id IS 'The original vacancy that started the cascade';
COMMENT ON COLUMN coverage_cascades.resolution_depth IS 'How many levels deep the cascade went';
COMMENT ON COLUMN coverage_cascades.final_status IS 'RESOLVED=all filled, PARTIAL=some unfilled, FAILED=none filled, MAX_DEPTH=hit recursion limit';

CREATE INDEX idx_cascades_root ON coverage_cascades(root_vacancy_slot_id);
CREATE INDEX idx_cascades_unresolved ON coverage_cascades(resolved) WHERE resolved = FALSE;

-- Table to track individual steps in a cascade
CREATE TABLE cascade_steps (
  id BIGSERIAL PRIMARY KEY,
  cascade_id BIGINT NOT NULL REFERENCES coverage_cascades(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL, -- 1, 2, 3... as cascade deepens
  vacancy_slot_id BIGINT NOT NULL REFERENCES schedule_slots(id),
  filled_by_employee_id BIGINT REFERENCES employees(id),
  source_step TEXT NOT NULL, -- Which order of call step was used
  is_diversion BOOLEAN NOT NULL DEFAULT FALSE,
  diverted_from_slot_id BIGINT REFERENCES schedule_slots(id),
  created_vacancy_slot_id BIGINT REFERENCES schedule_slots(id), -- If this created another vacancy
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT
);

COMMENT ON TABLE cascade_steps IS 'Individual steps in a coverage cascade';
COMMENT ON COLUMN cascade_steps.step_number IS '1=original vacancy, 2=backfill for first diversion, 3=backfill for second diversion, etc';
COMMENT ON COLUMN cascade_steps.created_vacancy_slot_id IS 'If this was a diversion, the slot that became vacant';

CREATE INDEX idx_cascade_steps_cascade ON cascade_steps(cascade_id, step_number);

-- ========================================
-- STEP 4.7 COST TRACKING
-- ========================================

-- Add cost calculation tracking
CREATE TYPE overtime_cost_factor AS (
  employee_id BIGINT,
  base_cost NUMERIC,
  ot_hours NUMERIC,
  ot_rate NUMERIC,
  total_cost NUMERIC,
  explanation TEXT
);

-- Function to calculate least OT cost for Step 4.7
CREATE OR REPLACE FUNCTION calculate_overtime_cost(
  _employee_id BIGINT,
  _slot_id BIGINT
) RETURNS NUMERIC
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_base_rate NUMERIC := 100.00; -- Base hourly rate (can be made configurable)
  v_ot_multiplier NUMERIC := 1.5;
  v_shift_hours NUMERIC := 9.0;
  v_cost NUMERIC;
BEGIN
  -- Simple cost model: straight time for same shift, OT for different shift
  -- This can be enhanced with actual pay rates from employee records

  -- For now, return base cost
  -- In production, this would check shift differences and calculate actual OT
  v_cost := v_base_rate * v_shift_hours * v_ot_multiplier;

  RETURN v_cost;
END;
$$;

-- ========================================
-- CONTRACT BASELINES
-- ========================================

-- Add contract-defined baselines and rules
INSERT INTO config (key, value) VALUES
  ('eb_baseline_strength', '10'),
  ('max_cascade_depth', '5'),
  ('board_rotation_method', 'FAIR_DISTRIBUTION'), -- or 'STRICT_ROTATION'
  ('allow_qualifying_at_discretion', 'true'),
  ('cascade_auto_resolve', 'true')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE config IS 'Contract-defined rules and baselines';

-- ========================================
-- HELPER VIEWS
-- ========================================

-- View of current board rotation status
CREATE OR REPLACE VIEW v_board_rotation_status AS
SELECT
  b.id AS board_id,
  b.name AS board_name,
  d.name AS division_name,
  s.name AS shift_name,
  e.id AS employee_id,
  e.emp_no,
  e.last_name,
  e.first_name,
  bm.rotation_position,
  bm.total_calls,
  bm.total_assignments,
  bm.consecutive_declines,
  bm.last_called_at,
  bm.last_accepted_at,
  CASE
    WHEN bm.last_called_at IS NULL THEN 'NEVER_CALLED'
    WHEN bm.last_accepted_at IS NULL THEN 'NEVER_ACCEPTED'
    WHEN bm.last_accepted_at > bm.last_called_at THEN 'LAST_ACCEPTED'
    ELSE 'LAST_DECLINED'
  END AS last_result
FROM board_memberships bm
JOIN boards b ON b.id = bm.board_id
JOIN divisions d ON d.id = b.division_id
JOIN shifts s ON s.id = b.shift_id
JOIN employees e ON e.id = bm.employee_id
WHERE bm.end_date IS NULL
  AND b.active = TRUE
ORDER BY b.id, bm.rotation_position;

-- View of unresolved cascades
CREATE OR REPLACE VIEW v_unresolved_cascades AS
SELECT
  cc.id AS cascade_id,
  cc.root_vacancy_slot_id,
  ss.local_date,
  dt.code AS trick_code,
  d.name AS desk_name,
  sh.name AS shift_name,
  cc.resolution_depth,
  COUNT(cs.id) AS total_steps,
  COUNT(cs.id) FILTER (WHERE cs.resolved) AS resolved_steps,
  COUNT(cs.id) FILTER (WHERE NOT cs.resolved) AS pending_steps
FROM coverage_cascades cc
JOIN schedule_slots ss ON ss.id = cc.root_vacancy_slot_id
JOIN desk_tricks dt ON dt.id = ss.desk_trick_id
JOIN desks d ON d.id = dt.desk_id
JOIN shifts sh ON sh.id = dt.shift_id
LEFT JOIN cascade_steps cs ON cs.cascade_id = cc.id
WHERE NOT cc.resolved
GROUP BY cc.id, ss.local_date, dt.code, d.name, sh.name, cc.resolution_depth;

COMMIT;
