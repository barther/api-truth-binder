-- =========================
-- Extra Board (GAD) Setup
-- Create boards and assign members with rotation positions
-- =========================

BEGIN;

-- ========================================
-- CREATE BOARDS (one per division/shift)
-- ========================================

-- Example: Create GAD Extra Board for first shift
/*
WITH gad_division AS (
  SELECT id FROM divisions WHERE code = 'GAD' LIMIT 1
),
first_shift AS (
  SELECT id FROM shifts WHERE code = '1ST' OR name LIKE '%First%' LIMIT 1
)
INSERT INTO boards (code, name, division_id, shift_id, active)
SELECT
  'GAD-1ST-EB',
  'GAD First Shift Extra Board',
  gad_division.id,
  first_shift.id,
  TRUE
FROM gad_division, first_shift
ON CONFLICT (code) DO NOTHING;
*/

-- Repeat for each division/shift combination
-- Common combinations:
-- - GAD-1ST-EB (First shift)
-- - GAD-2ST-EB (Second shift)
-- - GAD-3ST-EB (Third shift)
-- - GULF-1ST-EB, GULF-2ST-EB, GULF-3ST-EB
-- - etc.

-- ========================================
-- ASSIGN BOARD MEMBERS
-- ========================================

-- Example: Assign dispatchers to GAD First Shift EB
/*
WITH gad_eb AS (
  SELECT id FROM boards WHERE code = 'GAD-1ST-EB' LIMIT 1
),
eb_members AS (
  -- List of employee numbers who are on this board
  SELECT id FROM employees WHERE emp_no IN (
    '1111111',
    '2222222',
    '3333333',
    '4444444',
    '5555555'
  )
)
INSERT INTO board_memberships (board_id, employee_id, start_date)
SELECT gad_eb.id, eb_members.id, CURRENT_DATE
FROM gad_eb, eb_members
ON CONFLICT DO NOTHING;
*/

-- ========================================
-- INITIALIZE ROTATION POSITIONS
-- ========================================

-- After adding members to each board, initialize their rotation positions
-- This sorts them by seniority and assigns position 1, 2, 3, etc.

/*
-- For GAD First Shift
SELECT initialize_board_rotation(
  (SELECT id FROM boards WHERE code = 'GAD-1ST-EB')
);

-- For GAD Second Shift
SELECT initialize_board_rotation(
  (SELECT id FROM boards WHERE code = 'GAD-2ST-EB')
);

-- For GAD Third Shift
SELECT initialize_board_rotation(
  (SELECT id FROM boards WHERE code = 'GAD-3ST-EB')
);
*/

-- ========================================
-- MARK EMPLOYEES AS BOARD ELIGIBLE
-- ========================================

-- Employees on the board should have is_board_eligible = TRUE
-- Employees with job assignments should have is_board_eligible = FALSE

-- Set board eligible for EB members
/*
UPDATE employees e
SET is_board_eligible = TRUE
WHERE EXISTS (
  SELECT 1 FROM board_memberships bm
  WHERE bm.employee_id = e.id
    AND bm.end_date IS NULL
);
*/

-- Set NOT board eligible for job owners (mutually exclusive)
/*
UPDATE employees e
SET is_board_eligible = FALSE
WHERE EXISTS (
  SELECT 1 FROM job_ownerships jo
  WHERE jo.employee_id = e.id
    AND jo.end_date IS NULL
);
*/

-- ========================================
-- VERIFY SETUP
-- ========================================

-- Check all boards
/*
SELECT
  b.code,
  b.name,
  d.name AS division,
  s.name AS shift,
  COUNT(bm.id) AS member_count
FROM boards b
JOIN divisions d ON d.id = b.division_id
JOIN shifts s ON s.id = b.shift_id
LEFT JOIN board_memberships bm ON bm.board_id = b.id AND bm.end_date IS NULL
WHERE b.active = TRUE
GROUP BY b.code, b.name, d.name, s.name
ORDER BY b.code;
*/

-- Check board rotation order
/*
SELECT
  b.code AS board,
  bm.rotation_position,
  e.emp_no,
  e.last_name,
  e.first_name,
  e.seniority_date,
  bm.total_calls,
  bm.total_assignments
FROM board_memberships bm
JOIN boards b ON b.id = bm.board_id
JOIN employees e ON e.id = bm.employee_id
WHERE bm.end_date IS NULL
ORDER BY b.code, bm.rotation_position;
*/

COMMIT;

-- ========================================
-- USAGE INSTRUCTIONS
-- ========================================

-- STEP 1: Create boards for each division/shift
--   Uncomment the INSERT INTO boards section
--   Modify for your divisions (GAD, GULF, etc.)
--   Run for each shift (1ST, 2ST, 3ST)

-- STEP 2: Determine who's on each board
--   Run this query to see who doesn't own jobs:
--   SELECT emp_no, last_name, first_name, seniority_date
--   FROM employees
--   WHERE NOT EXISTS (
--     SELECT 1 FROM job_ownerships jo
--     WHERE jo.employee_id = employees.id AND jo.end_date IS NULL
--   )
--   ORDER BY seniority_date;

-- STEP 3: Assign board members
--   Uncomment the INSERT INTO board_memberships section
--   List employee numbers for each board
--   Run for each board

-- STEP 4: Initialize rotation positions
--   Uncomment SELECT initialize_board_rotation calls
--   Run for each board

-- STEP 5: Mark eligibility flags
--   Uncomment UPDATE employees sections
--   Run both updates

-- STEP 6: Verify with queries at bottom
