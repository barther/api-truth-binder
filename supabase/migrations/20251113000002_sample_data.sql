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
