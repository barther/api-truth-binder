-- Add ARTHER, BART's qualifications
-- Qualifications: EE, QC, LF, SW, SO

BEGIN;

-- Add qualifications for Bart Arther
INSERT INTO employee_qualifications(employee_id, desk_id, qualified, qualified_on)
SELECT e.id, d.id, TRUE, '2019-05-22'
FROM employees e
CROSS JOIN desks d
WHERE e.emp_no = '1018633'
  AND d.code IN ('EE', 'QC', 'LF', 'SW', 'SO')
ON CONFLICT (employee_id, desk_id) 
DO UPDATE SET qualified = TRUE, qualified_on = EXCLUDED.qualified_on;

COMMIT;

-- Verify
SELECT e.emp_no, e.first_name, e.last_name, d.code AS desk, q.qualified
FROM employee_qualifications q
JOIN employees e ON e.id = q.employee_id
JOIN desks d ON d.id = q.desk_id
WHERE e.emp_no = '1018633'
ORDER BY d.code;
