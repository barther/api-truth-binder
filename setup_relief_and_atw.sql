-- =========================
-- Relief and ATW Pattern Setup
-- Configure which dispatchers cover relief lines and ATW rotations
-- =========================

BEGIN;

-- ========================================
-- RELIEF LINE SETUP
-- One relief dispatcher per desk, covers rest days
-- ========================================

-- Create relief lines for each desk that needs one
-- Example: EE desk has a relief dispatcher who covers rest days for EE-1, EE-2, EE-3

-- First, create relief_lines entries (if not already created)
-- Each desk can have one relief line

-- Example for EE desk (you'll need to replace with actual desk IDs and employee IDs)
/*
-- Get EE desk ID
WITH ee_desk AS (
  SELECT id FROM desks WHERE code = 'EE' LIMIT 1
)
-- Create relief line for EE
INSERT INTO relief_lines (desk_id, name, active)
SELECT id, 'EE Relief', TRUE FROM ee_desk
ON CONFLICT DO NOTHING;

-- Assign relief dispatcher (example: employee #1234567)
WITH ee_relief AS (
  SELECT rl.id AS relief_line_id
  FROM relief_lines rl
  JOIN desks d ON d.id = rl.desk_id
  WHERE d.code = 'EE'
),
relief_dispatcher AS (
  SELECT id FROM employees WHERE emp_no = '1234567' LIMIT 1
)
INSERT INTO relief_line_ownerships (relief_line_id, employee_id, start_date)
SELECT ee_relief.relief_line_id, relief_dispatcher.id, CURRENT_DATE
FROM ee_relief, relief_dispatcher
ON CONFLICT DO NOTHING;

-- Define which days relief covers for each trick
-- Relief covers rest days, so we need to find what those are
-- For EE-1 (rest days 2,3 = Tue/Wed), relief works Tue/Wed
WITH ee_relief AS (
  SELECT rl.id AS relief_line_id
  FROM relief_lines rl
  JOIN desks d ON d.id = rl.desk_id
  WHERE d.code = 'EE'
),
ee_tricks AS (
  SELECT dt.id AS trick_id, dt.rest_day1, dt.rest_day2
  FROM desk_tricks dt
  JOIN desks d ON d.id = dt.desk_id
  WHERE d.code = 'EE' AND dt.active = TRUE
)
INSERT INTO relief_line_patterns (relief_line_id, desk_trick_id, dow)
SELECT
  ee_relief.relief_line_id,
  ee_tricks.trick_id,
  rest_day
FROM ee_relief, ee_tricks,
LATERAL (
  SELECT unnest(ARRAY[ee_tricks.rest_day1, ee_tricks.rest_day2]) AS rest_day
) AS rest_days
ON CONFLICT DO NOTHING;
*/

-- ========================================
-- TEMPLATE: Copy and modify for each desk
-- ========================================

-- Step 1: Find your desk code
-- SELECT code, id FROM desks ORDER BY code;

-- Step 2: Find the relief dispatcher employee number
-- SELECT emp_no, id, last_name, first_name FROM employees WHERE last_name LIKE '%name%';

-- Step 3: Use template above, replacing:
--   - 'EE' with your desk code
--   - '1234567' with relief dispatcher emp_no

-- ========================================
-- ATW (Around-the-World) SETUP
-- One dispatcher rotates through 5 desks Mon-Fri (third shift)
-- ========================================

-- Create ATW role
/*
-- Example: ATW dispatcher works specific desks on specific nights

-- Get third shift ID
WITH third_shift AS (
  SELECT id FROM shifts WHERE code = '3ST' OR name LIKE '%Third%' OR name LIKE '%3rd%' LIMIT 1
),
-- Get ATW dispatcher
atw_dispatcher AS (
  SELECT id FROM employees WHERE emp_no = '9876543' LIMIT 1
),
-- Get division (example: GAD)
gad_division AS (
  SELECT id FROM divisions WHERE code = 'GAD' LIMIT 1
)
-- Create ATW role
INSERT INTO atw_roles (employee_id, shift_id, division_id, active)
SELECT atw_dispatcher.id, third_shift.id, gad_division.id, TRUE
FROM atw_dispatcher, third_shift, gad_division
ON CONFLICT DO NOTHING
RETURNING id;

-- Define ATW schedule (example: 5 desks Mon-Fri)
-- Monday (dow=1): EE desk
-- Tuesday (dow=2): QC desk
-- Wednesday (dow=3): LF desk
-- Thursday (dow=4): SW desk
-- Friday (dow=5): SO desk

WITH atw_role AS (
  SELECT ar.id AS atw_role_id
  FROM atw_roles ar
  JOIN employees e ON e.id = ar.employee_id
  WHERE e.emp_no = '9876543'
),
desk_schedule AS (
  SELECT 1 AS dow, (SELECT id FROM desks WHERE code = 'EE') AS desk_id
  UNION ALL
  SELECT 2, (SELECT id FROM desks WHERE code = 'QC')
  UNION ALL
  SELECT 3, (SELECT id FROM desks WHERE code = 'LF')
  UNION ALL
  SELECT 4, (SELECT id FROM desks WHERE code = 'SW')
  UNION ALL
  SELECT 5, (SELECT id FROM desks WHERE code = 'SO')
)
INSERT INTO atw_patterns (atw_role_id, desk_id, dow)
SELECT atw_role.atw_role_id, desk_schedule.desk_id, desk_schedule.dow
FROM atw_role, desk_schedule
WHERE desk_schedule.desk_id IS NOT NULL
ON CONFLICT DO NOTHING;
*/

-- ========================================
-- QUICK REFERENCE QUERIES
-- ========================================

-- List all desks
-- SELECT code, name, id FROM desks ORDER BY code;

-- List all employees with seniority
-- SELECT emp_no, last_name, first_name, seniority_date, id
-- FROM employees
-- ORDER BY seniority_date, hire_date, emp_no;

-- List all tricks with rest days
-- SELECT dt.code, d.code AS desk, s.name AS shift, dt.rest_day1, dt.rest_day2
-- FROM desk_tricks dt
-- JOIN desks d ON d.id = dt.desk_id
-- JOIN shifts s ON s.id = dt.shift_id
-- WHERE dt.active = TRUE
-- ORDER BY d.code, s.code;

-- Check current relief assignments
-- SELECT
--   d.code AS desk,
--   e.emp_no,
--   e.last_name,
--   e.first_name,
--   COUNT(rlp.id) AS patterns
-- FROM relief_lines rl
-- JOIN desks d ON d.id = rl.desk_id
-- JOIN relief_line_ownerships rlo ON rlo.relief_line_id = rl.id
-- JOIN employees e ON e.id = rlo.employee_id
-- LEFT JOIN relief_line_patterns rlp ON rlp.relief_line_id = rl.id
-- WHERE rlo.end_date IS NULL
-- GROUP BY d.code, e.emp_no, e.last_name, e.first_name;

-- Check ATW assignments
-- SELECT
--   e.emp_no,
--   e.last_name,
--   e.first_name,
--   s.name AS shift,
--   dv.name AS division,
--   COUNT(ap.id) AS desk_count
-- FROM atw_roles ar
-- JOIN employees e ON e.id = ar.employee_id
-- JOIN shifts s ON s.id = ar.shift_id
-- JOIN divisions dv ON dv.id = ar.division_id
-- LEFT JOIN atw_patterns ap ON ap.atw_role_id = ar.id
-- WHERE ar.active = TRUE
-- GROUP BY e.emp_no, e.last_name, e.first_name, s.name, dv.name;

COMMIT;

-- ========================================
-- USAGE INSTRUCTIONS
-- ========================================

-- 1. Find desk codes and IDs:
--    SELECT code, id FROM desks;

-- 2. Find relief dispatcher employee numbers:
--    SELECT emp_no, last_name, first_name FROM employees WHERE...;

-- 3. Uncomment and modify the template sections above

-- 4. Replace 'EE' with your desk code

-- 5. Replace '1234567' with actual employee number

-- 6. Run for each desk that has a relief position

-- 7. For ATW, uncomment ATW section and specify:
--    - ATW dispatcher emp_no
--    - 5 desks in order (Mon-Fri)

-- 8. After setup, verify with quick reference queries at bottom
