-- =========================
-- Order of Call with Board Rotation & Step 4.7
-- Complete deterministic coverage algorithm
-- =========================

BEGIN;

-- Drop and recreate with rotation logic
DROP FUNCTION IF EXISTS get_candidates_for_vacancy(bigint);

CREATE OR REPLACE FUNCTION get_candidates_for_vacancy(_slot_id bigint)
RETURNS TABLE(
  employee_id bigint,
  emp_no text,
  first_name text,
  last_name text,
  seniority_rank bigint,
  step_number integer,
  step_name text,
  source assignment_source,
  pay_basis pay_basis,
  is_diversion boolean,
  is_qualified boolean,
  is_hos_ok boolean,
  rest_hours numeric,
  is_available boolean,
  on_rest_day boolean,
  currently_assigned_slot_id bigint,
  eb_can_backfill boolean,
  rotation_position integer,
  board_calls integer,
  ot_cost numeric
) LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_slot record;
  v_desk_id bigint;
  v_shift_id bigint;
  v_division_id bigint;
  v_incumbent_id bigint;
  v_board_id bigint;
BEGIN
  -- Get slot info
  SELECT
    s.*,
    dt.desk_id,
    dt.shift_id,
    d.division_id
  INTO v_slot
  FROM schedule_slots s
  JOIN desk_tricks dt ON dt.id = s.desk_trick_id
  JOIN desks d ON d.id = dt.desk_id
  WHERE s.id = _slot_id;

  v_desk_id := v_slot.desk_id;
  v_shift_id := v_slot.shift_id;
  v_division_id := v_slot.division_id;

  -- Get incumbent for this slot
  SELECT jo.employee_id INTO v_incumbent_id
  FROM job_ownerships jo
  WHERE jo.desk_trick_id = v_slot.desk_trick_id
    AND jo.end_date IS NULL
  LIMIT 1;

  -- Get board for this division/shift
  SELECT b.id INTO v_board_id
  FROM boards b
  WHERE b.division_id = v_division_id
    AND b.shift_id = v_shift_id
    AND b.active = TRUE
  LIMIT 1;

  RETURN QUERY
  WITH
  -- Check EB strength
  eb_status AS (
    SELECT
      get_current_eb_strength(v_division_id, v_shift_id, v_slot.local_date) AS current_strength,
      get_eb_baseline() AS baseline,
      is_eb_below_baseline(v_division_id, v_shift_id, v_slot.local_date) AS below_baseline
  ),

  -- Get all current assignments for the same day (to detect diversions)
  current_assignments AS (
    SELECT
      a.employee_id,
      a.schedule_slot_id,
      ss.desk_trick_id,
      dt.shift_id,
      dt.desk_id
    FROM assignments a
    JOIN schedule_slots ss ON ss.id = a.schedule_slot_id
    JOIN desk_tricks dt ON dt.id = ss.desk_trick_id
    WHERE ss.local_date = v_slot.local_date
      AND a.role = 'PRIMARY'
  ),

  -- Step 4.1: GAD/EB - Check FIRST with rotation logic
  step_1_eb AS (
    SELECT
      e.id,
      e.emp_no,
      e.first_name,
      e.last_name,
      sr.seniority_rank,
      1 AS step_number,
      'Step 4.1: Extra Board (GAD)' AS step_name,
      'BOARD'::assignment_source AS source,
      CASE
        WHEN (SELECT below_baseline FROM eb_status) THEN 'OVERTIME'::pay_basis
        ELSE 'STRAIGHT_TIME'::pay_basis
      END AS pay_basis,
      FALSE AS is_diversion,
      NULL::bigint AS currently_assigned_slot_id,
      NULL::boolean AS eb_can_backfill,
      bm.rotation_position,
      bm.total_calls AS board_calls,
      0::numeric AS ot_cost  -- EB is cheapest option
    FROM board_memberships bm
    JOIN boards b ON b.id = bm.board_id
    JOIN employees e ON e.id = bm.employee_id
    JOIN v_seniority_rank sr ON sr.employee_id = e.id
    WHERE b.id = v_board_id
      AND bm.end_date IS NULL
      AND e.status = 'ACTIVE'
      AND e.is_board_eligible = TRUE
      AND e.is_qualifying = FALSE
      -- Not already assigned that day
      AND NOT EXISTS (
        SELECT 1 FROM current_assignments ca
        WHERE ca.employee_id = e.id
      )
  ),

  -- Step 4.2: Incumbent on Rest Day (Overtime)
  step_2_incumbent_rest AS (
    SELECT
      e.id,
      e.emp_no,
      e.first_name,
      e.last_name,
      sr.seniority_rank,
      2 AS step_number,
      'Step 4.2: Incumbent on Rest Day (OT)' AS step_name,
      'OVERTIME'::assignment_source AS source,
      'OVERTIME'::pay_basis AS pay_basis,
      FALSE AS is_diversion,
      NULL::bigint AS currently_assigned_slot_id,
      NULL::boolean AS eb_can_backfill,
      NULL::integer AS rotation_position,
      0::integer AS board_calls,
      calculate_overtime_cost(e.id, _slot_id) AS ot_cost
    FROM employees e
    JOIN v_seniority_rank sr ON sr.employee_id = e.id
    WHERE e.id = v_incumbent_id
      AND e.status = 'ACTIVE'
      AND e.is_qualifying = FALSE
      AND is_on_rest_day(e.id, _slot_id) = TRUE
  ),

  -- Step 4.3: Senior Available on Rest Day (Overtime)
  step_3_senior_rest AS (
    SELECT
      e.id,
      e.emp_no,
      e.first_name,
      e.last_name,
      sr.seniority_rank,
      3 AS step_number,
      'Step 4.3: Senior on Rest Day (OT)' AS step_name,
      'OVERTIME'::assignment_source AS source,
      'OVERTIME'::pay_basis AS pay_basis,
      FALSE AS is_diversion,
      NULL::bigint AS currently_assigned_slot_id,
      NULL::boolean AS eb_can_backfill,
      NULL::integer AS rotation_position,
      0::integer AS board_calls,
      calculate_overtime_cost(e.id, _slot_id) AS ot_cost
    FROM employees e
    JOIN v_seniority_rank sr ON sr.employee_id = e.id
    WHERE e.status = 'ACTIVE'
      AND e.is_qualifying = FALSE
      AND e.id <> COALESCE(v_incumbent_id, -1)
      -- On a rest day for one of their jobs
      AND EXISTS (
        SELECT 1
        FROM job_ownerships jo
        JOIN desk_tricks dt ON dt.id = jo.desk_trick_id
        WHERE jo.employee_id = e.id
          AND jo.end_date IS NULL
          AND EXTRACT(ISODOW FROM v_slot.local_date)::smallint IN (dt.rest_day1, dt.rest_day2)
      )
  ),

  -- Step 4.4 & 4.5: Junior Diversion - Same Shift
  step_4_5_junior_diversion AS (
    SELECT
      e.id,
      e.emp_no,
      e.first_name,
      e.last_name,
      sr.seniority_rank,
      CASE
        WHEN (SELECT current_strength FROM eb_status) > 0 THEN 4
        ELSE 5
      END AS step_number,
      CASE
        WHEN (SELECT current_strength FROM eb_status) > 0
        THEN 'Step 4.4: Junior Diversion Same Shift (EB Backfill)'
        ELSE 'Step 4.5: Junior Diversion Same Shift (No EB)'
      END AS step_name,
      'DIVERSION'::assignment_source AS source,
      CASE
        WHEN (SELECT below_baseline FROM eb_status) THEN 'OVERTIME'::pay_basis
        ELSE 'STRAIGHT_TIME'::pay_basis
      END AS pay_basis,
      TRUE AS is_diversion,
      ca.schedule_slot_id AS currently_assigned_slot_id,
      CASE
        WHEN (SELECT current_strength FROM eb_status) > 0 THEN TRUE
        ELSE FALSE
      END AS eb_can_backfill,
      NULL::integer AS rotation_position,
      0::integer AS board_calls,
      CASE
        WHEN (SELECT below_baseline FROM eb_status)
        THEN calculate_overtime_cost(e.id, _slot_id)
        ELSE 0::numeric
      END AS ot_cost
    FROM current_assignments ca
    JOIN employees e ON e.id = ca.employee_id
    JOIN v_seniority_rank sr ON sr.employee_id = e.id
    WHERE ca.shift_id = v_shift_id
      AND e.status = 'ACTIVE'
      AND e.is_qualifying = FALSE
      AND ca.employee_id <> COALESCE(v_incumbent_id, -1)
  ),

  -- Step 4.6: Senior Diversion - Off Shift (requires EB backfill)
  step_6_senior_off_shift AS (
    SELECT
      e.id,
      e.emp_no,
      e.first_name,
      e.last_name,
      sr.seniority_rank,
      6 AS step_number,
      'Step 4.6: Senior Diversion Off Shift (OT)' AS step_name,
      'DIVERSION'::assignment_source AS source,
      'OVERTIME'::pay_basis AS pay_basis,
      TRUE AS is_diversion,
      ca.schedule_slot_id AS currently_assigned_slot_id,
      TRUE AS eb_can_backfill,
      NULL::integer AS rotation_position,
      0::integer AS board_calls,
      calculate_overtime_cost(e.id, _slot_id) AS ot_cost
    FROM current_assignments ca
    JOIN employees e ON e.id = ca.employee_id
    JOIN v_seniority_rank sr ON sr.employee_id = e.id
    WHERE ca.shift_id <> v_shift_id
      AND e.status = 'ACTIVE'
      AND e.is_qualifying = FALSE
      AND (SELECT current_strength FROM eb_status) > 0
  ),

  -- Step 4.7: Least OT Cost Fallback
  -- Anyone qualified who isn't already working that day
  step_7_fallback AS (
    SELECT
      e.id,
      e.emp_no,
      e.first_name,
      e.last_name,
      sr.seniority_rank,
      7 AS step_number,
      'Step 4.7: Least OT Cost Fallback' AS step_name,
      'OVERTIME'::assignment_source AS source,
      'OVERTIME'::pay_basis AS pay_basis,
      FALSE AS is_diversion,
      NULL::bigint AS currently_assigned_slot_id,
      NULL::boolean AS eb_can_backfill,
      NULL::integer AS rotation_position,
      0::integer AS board_calls,
      calculate_overtime_cost(e.id, _slot_id) AS ot_cost
    FROM employees e
    JOIN v_seniority_rank sr ON sr.employee_id = e.id
    WHERE e.status = 'ACTIVE'
      AND e.is_qualifying = FALSE
      -- Not already assigned that day
      AND NOT EXISTS (
        SELECT 1 FROM current_assignments ca
        WHERE ca.employee_id = e.id
      )
      -- Not in any of the previous steps
      AND e.id NOT IN (
        SELECT id FROM step_1_eb
        UNION SELECT id FROM step_2_incumbent_rest
        UNION SELECT id FROM step_3_senior_rest
      )
  ),

  -- Combine all steps
  all_candidates AS (
    SELECT * FROM step_1_eb
    UNION ALL
    SELECT * FROM step_2_incumbent_rest
    UNION ALL
    SELECT * FROM step_3_senior_rest
    UNION ALL
    SELECT * FROM step_4_5_junior_diversion
    UNION ALL
    SELECT * FROM step_6_senior_off_shift
    UNION ALL
    SELECT * FROM step_7_fallback
  )

  -- Return with eligibility checks
  SELECT DISTINCT
    c.id AS employee_id,
    c.emp_no,
    c.first_name,
    c.last_name,
    c.seniority_rank,
    c.step_number,
    c.step_name,
    c.source,
    c.pay_basis,
    c.is_diversion,
    is_qualified(c.id, v_desk_id) AS is_qualified,
    hos_ok(c.id, v_slot.start_utc) AS is_hos_ok,
    rest_hours(c.id, v_slot.start_utc) AS rest_hours,
    NOT EXISTS (
      SELECT 1 FROM mark_offs m
      WHERE m.employee_id = c.id AND m.the_date = v_slot.local_date
    ) AND NOT EXISTS (
      SELECT 1 FROM leaves l
      WHERE l.employee_id = c.id AND v_slot.local_date BETWEEN l.start_date AND l.end_date
    ) AS is_available,
    is_on_rest_day(c.id, _slot_id) AS on_rest_day,
    c.currently_assigned_slot_id,
    c.eb_can_backfill,
    c.rotation_position,
    c.board_calls,
    c.ot_cost
  FROM all_candidates c
  ORDER BY
    c.step_number,
    -- Within step 1 (EB): rotation position, then least calls, then seniority
    CASE WHEN c.step_number = 1 THEN c.rotation_position ELSE 999999 END,
    CASE WHEN c.step_number = 1 THEN c.board_calls ELSE 999999 END,
    -- Within steps 2-3 (rest day OT): most senior first
    CASE WHEN c.step_number IN (2, 3) THEN c.seniority_rank ELSE 999999 END,
    -- Within steps 4-5 (same shift diversion): junior-most first
    CASE WHEN c.step_number IN (4, 5) THEN -c.seniority_rank ELSE -999999 END,
    -- Within step 6 (off-shift): most senior first
    CASE WHEN c.step_number = 6 THEN c.seniority_rank ELSE 999999 END,
    -- Within step 7 (fallback): least OT cost, then seniority
    CASE WHEN c.step_number = 7 THEN c.ot_cost ELSE 999999 END,
    CASE WHEN c.step_number = 7 THEN c.seniority_rank ELSE 999999 END,
    c.emp_no;
END$$;

COMMIT;
