-- Real desk data from company schedule
BEGIN;

-- Insert real desks
INSERT INTO desks(code, name, division_id, active)
SELECT 'AL', 'AL', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desks(code, name, division_id, active)
SELECT 'CD', 'CD', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desks(code, name, division_id, active)
SELECT 'CE', 'CE', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desks(code, name, division_id, active)
SELECT 'CG', 'CG', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desks(code, name, division_id, active)
SELECT 'CT', 'CT', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desks(code, name, division_id, active)
SELECT 'DH', 'DH', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desks(code, name, division_id, active)
SELECT 'DT', 'DT', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desks(code, name, division_id, active)
SELECT 'EL', 'EL', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desks(code, name, division_id, active)
SELECT 'HE', 'HE', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desks(code, name, division_id, active)
SELECT 'LF', 'LF', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desks(code, name, division_id, active)
SELECT 'MT', 'MT', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desks(code, name, division_id, active)
SELECT 'MV', 'MV', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desks(code, name, division_id, active)
SELECT 'PE', 'PE', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desks(code, name, division_id, active)
SELECT 'RL', 'RL', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desks(code, name, division_id, active)
SELECT 'SA', 'SA', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desks(code, name, division_id, active)
SELECT 'TT', 'TT', id, TRUE
FROM divisions WHERE code='COA'
ON CONFLICT (code) DO NOTHING;

-- Insert real tricks
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'AL-1ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'AL' AND s.code = '1ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'AL-2ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'AL' AND s.code = '2ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CD-1ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CD' AND s.code = '1ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CD-2ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CD' AND s.code = '2ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CD-3ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CD' AND s.code = '3ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CE-1ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CE' AND s.code = '1ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CE-2ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CE' AND s.code = '2ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CE-3ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CE' AND s.code = '3ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CG-3ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CG' AND s.code = '3ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CT-1ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CT' AND s.code = '1ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CT-3ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CT' AND s.code = '3ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'DH-3ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'DH' AND s.code = '3ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'DT-1ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'DT' AND s.code = '1ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'DT-3ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'DT' AND s.code = '3ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'EL-3ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'EL' AND s.code = '3ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'HE-1ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'HE' AND s.code = '1ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'HE-3ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'HE' AND s.code = '3ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'LF-2ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'LF' AND s.code = '2ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'LF-3ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'LF' AND s.code = '3ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'MT-2ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'MT' AND s.code = '2ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'MT-3ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'MT' AND s.code = '3ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'MV-1ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'MV' AND s.code = '1ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'PE-2ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'PE' AND s.code = '2ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'PE-3ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'PE' AND s.code = '3ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'RL-1ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'RL' AND s.code = '1ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'RL-2ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'RL' AND s.code = '2ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'RL-3ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'RL' AND s.code = '3ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SA-1ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SA' AND s.code = '1ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SA-2ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SA' AND s.code = '2ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SA-3ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SA' AND s.code = '3ST'
ON CONFLICT (code) DO NOTHING;

INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'TT-3ST', 6, 7, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'TT' AND s.code = '3ST'
ON CONFLICT (code) DO NOTHING;

COMMIT;