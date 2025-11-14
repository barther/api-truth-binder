-- Real tricks with actual rest day patterns from company data
BEGIN;

-- NR-1ST: DICKERSON, RUSSELL (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'NR-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'NR' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- MV-3ST: DYE, JAMES (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'MV-3ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'MV' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- KC-3ST: FUNK, TODD (Rest: 4, 5)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'KC-3ST', 4, 5, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'KC' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 4, rest_day2 = 5;

-- PO-1ST: BAILEY, LORRIE (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'PO-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'PO' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- NO-1ST: REACH, JEFF (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'NO-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'NO' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- DV-1ST: HATTON, ROBERT (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'DV-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'DV' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- KN-1ST: ROUNSAVALL, MIKE (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'KN-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'KN' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- CE-1ST: DEJESUS, DAVE (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CE-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CE' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- RL-1ST: ROTH, KATE (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'RL-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'RL' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- AS-3ST: PAYNE, ANDREW (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'AS-3ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'AS' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- KY-3ST: BOVIALL, STEVE (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'KY-3ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'KY' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- SO-1ST: COX, ANDY (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SO-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SO' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- ME-1ST: EASTHAM, DARBY (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'ME-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'ME' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- GS-1ST: COX, DERICK (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'GS-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'GS' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- CH-1ST: SMITH, GEMOND (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CH-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CH' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- HG-1ST: DILL, GERALD (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'HG-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'HG' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- DH-1ST: WIMMER, CHRISTOPHER (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'DH-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'DH' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- KW-1ST: SCOTT, TROY (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'KW-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'KW' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- KW-3ST: BUSH, MONICA (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'KW-3ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'KW' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- NE-1ST: ELLIOTT, SHELDON (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'NE-1ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'NE' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- MT-1ST: YEAGER, DOROTHY (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'MT-1ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'MT' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- CT-1ST: RITCHIE, MIKE (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CT-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CT' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- EE-1ST: JOHNSON, TJ (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'EE-1ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'EE' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- HT-1ST: CAMARDA, CHRIS (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'HT-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'HT' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- SE-3ST: MAPHENDUKA, DEAN (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SE-3ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SE' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- EL-1ST: NEGLEY, ANTHONY (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'EL-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'EL' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- DE-1ST: JAMES, GREGG (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'DE-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'DE' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- SA-1ST: BRENNEKE, TAMI (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SA-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SA' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- PE-1ST: LUTERAN, COREY (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'PE-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'PE' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- RT-1ST: GOEBEL, IAN (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'RT-1ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'RT' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- CN-1ST: GILLESPIE, JEREMY (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CN-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CN' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- SV-2ST: ADAMS, ARDRA (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SV-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SV' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- IN-1ST: SMITH, PATRICK (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'IN-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'IN' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- SW-1ST: LITTLE, CHRISTAL (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SW-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SW' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- SE-1ST: HENDRICKS, WILLIAM (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SE-1ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SE' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- DV-3ST: VINCENT, JAMES (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'DV-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'DV' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- CH-3ST: PATE, MELINDA (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CH-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CH' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- BT-3ST: PATE, TABITHA (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'BT-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'BT' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- RL-2ST: CROUTHARMEL, JASON (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'RL-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'RL' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- DT-1ST: BROSKIN, CHRIS (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'DT-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'DT' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- SV-3ST: SCONIERS, KELVIN (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SV-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SV' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- AS-1ST: FRAZIER, PATRICK (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'AS-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'AS' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- ET-1ST: KRZYZANOWSKI, RENEE (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'ET-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'ET' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- RT-3ST: DAVIS, JIM (Rest: 4, 5)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'RT-3ST', 4, 5, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'RT' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 4, rest_day2 = 5;

-- SV-1ST: FOGLE, MARLO (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SV-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SV' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- SP-1ST: WENNEMAN, BRYAN (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SP-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SP' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- KC-1ST: KOSHY, SUJIT (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'KC-1ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'KC' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- CD-1ST: CLUBBS, DARIN (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CD-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CD' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- CE-2ST: HICKEY, LINDA (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CE-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CE' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- SW-2ST: PIETSCH, DAN (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SW-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SW' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- GS-3ST: MORGAN, CURTIS (Rest: 3, 4)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'GS-3ST', 3, 4, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'GS' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 3, rest_day2 = 4;

-- AL-1ST: PANELLA, MICHAEL (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'AL-1ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'AL' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- IN-2ST: MCDANIEL, PAMELA (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'IN-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'IN' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- PE-2ST: THOMAS, FRANK (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'PE-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'PE' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- CG-1ST: GLACE, JOSH (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CG-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CG' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- SP-2ST: KNORRE, ANDREA (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SP-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SP' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- HE-1ST: CARR, JEREMY (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'HE-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'HE' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- QC-1ST: KIRKPATRICK, DOUG (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'QC-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'QC' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- EE-3ST: STURLEY, DEANNA (Rest: 4, 5)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'EE-3ST', 4, 5, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'EE' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 4, rest_day2 = 5;

-- NE-3ST: DAY, DARRELL (Rest: 4, 5)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'NE-3ST', 4, 5, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'NE' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 4, rest_day2 = 5;

-- ME-3ST: REBER, MARKUS (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'ME-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'ME' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- SA-2ST: SOLES, BILL (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SA-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SA' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- PE-3ST: MCCARREN, CARRIE (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'PE-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'PE' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- KY-1ST: DORTCH, NANCY (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'KY-1ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'KY' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- DT-2ST: KAY-JACKWAK, LORI (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'DT-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'DT' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- TT-1ST: VANNIER, RYAN (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'TT-1ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'TT' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- VA-2ST: NELLUM, KEVIN (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'VA-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'VA' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- BT-1ST: WATERS, MICHAEL (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'BT-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'BT' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- DV-2ST: WOODS, RAMONNE (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'DV-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'DV' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- LF-1ST: MERCER, LLOYD (Rest: 7, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'LF-1ST', 7, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'LF' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 6;

-- CT-3ST: WEIL, BILL (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CT-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CT' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- HE-3ST: ZIEGERT, ABIGAIL (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'HE-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'HE' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- MV-1ST: BAUMAN, BRENT (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'MV-1ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'MV' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- DT-3ST: BULLO, GABRIELLE (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'DT-3ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'DT' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- KN-2ST: DAVIS, MARK (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'KN-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'KN' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- VA-1ST: MULLEN, RYAN (Rest: 5, 6)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'VA-1ST', 5, 6, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'VA' AND s.code = '1ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 5, rest_day2 = 6;

-- KN-3ST: LITTLE, RYAN (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'KN-3ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'KN' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- HT-2ST: DAVIS, MATT (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'HT-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'HT' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- RL-3ST: HARBIN, BRYANT (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'RL-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'RL' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- HG-3ST: BILLINGS, CYNTHIA (Rest: 3, 4)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'HG-3ST', 3, 4, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'HG' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 3, rest_day2 = 4;

-- NR-2ST: LITTLE, JASON (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'NR-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'NR' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- SO-3ST: MARZETTE, MEEKA (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SO-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SO' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- PO-3ST: YOUNGER, SAMANTHA (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'PO-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'PO' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- ET-2ST: BLAIR, CHRISTINE (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'ET-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'ET' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- PO-2ST: QUINN, COURTNEY (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'PO-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'PO' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- LF-2ST: BLAIR, ROBERT (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'LF-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'LF' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- CG-3ST: WENGER, JOSH (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CG-3ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CG' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- CN-3ST: CLEVENGER, R LANCE (Rest: 3, 4)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CN-3ST', 3, 4, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CN' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 3, rest_day2 = 4;

-- KW-2ST: BARTER, ELIZABETH (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'KW-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'KW' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- SP-3ST: PALMER, SANFORD (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SP-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SP' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- AS-2ST: FITZGERALD, JIM (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'AS-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'AS' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- SE-2ST: PACE, LEWIS (Rest: 3, 4)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SE-2ST', 3, 4, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SE' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 3, rest_day2 = 4;

-- TT-2ST: SCOTT, DONALD (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'TT-2ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'TT' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- CE-3ST: WILLIAMS, SCOTT (Rest: 3, 4)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CE-3ST', 3, 4, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CE' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 3, rest_day2 = 4;

-- HG-2ST: COOPER, JAMES (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'HG-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'HG' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- SO-2ST: WILLIAMS, SHANAN (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SO-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SO' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- DE-3ST: MCGRADY, SHAWN (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'DE-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'DE' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- ET-3ST: GREEN, SUSAN (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'ET-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'ET' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- CG-2ST: VAZQUEZ, ERIC (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CG-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CG' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- VA-3ST: ROBINSON, ANDY (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'VA-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'VA' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- QC-3ST: SANSBURY, TRAVIS (Rest: 3, 4)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'QC-3ST', 3, 4, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'QC' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 3, rest_day2 = 4;

-- HE-2ST: MCAULEY, LESLIE (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'HE-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'HE' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- ME-2ST: FAIRCLOTH, HANNAH (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'ME-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'ME' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- NR-3ST: SHAW, JUSTIN (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'NR-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'NR' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- HT-3ST: SHIELDS, BRIAN (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'HT-3ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'HT' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- NO-3ST: PRINCE, MICHAEL (Rest: 3, 4)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'NO-3ST', 3, 4, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'NO' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 3, rest_day2 = 4;

-- EE-2ST: ARTHER, BART (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'EE-2ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'EE' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- MT-3ST: DONALDSON, CODY (Rest: 4, 5)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'MT-3ST', 4, 5, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'MT' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 4, rest_day2 = 5;

-- SW-3ST: MILLER, FRED (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SW-3ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SW' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- BT-2ST: MATTHEWS, RASHIM (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'BT-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'BT' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- CT-2ST: HARDY, JASMINE (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CT-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CT' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- CD-2ST: ROBINSON, MATTHEW (Rest: 7, 1)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CD-2ST', 7, 1, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CD' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 7, rest_day2 = 1;

-- CD-3ST: BAILEY, STEVEN (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CD-3ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CD' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- KY-2ST: THOMAS, RONNIE (Rest: 4, 5)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'KY-2ST', 4, 5, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'KY' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 4, rest_day2 = 5;

-- AL-3ST: MOGGIO, WILLIAM (Rest: 4, 5)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'AL-3ST', 4, 5, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'AL' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 4, rest_day2 = 5;

-- CH-2ST: MCROY, DANIEL (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CH-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CH' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- RT-2ST: LEESON, JARED (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'RT-2ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'RT' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- MV-2ST: DICK, KAYLA (Rest: 3, 4)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'MV-2ST', 3, 4, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'MV' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 3, rest_day2 = 4;

-- EL-3ST: TRACY, LUCAS (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'EL-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'EL' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- KC-2ST: BOLEN, MEGAN (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'KC-2ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'KC' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- DH-3ST: BOX, MANDY (Rest: 3, 4)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'DH-3ST', 3, 4, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'DH' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 3, rest_day2 = 4;

-- SA-3ST: STAMETS, JAKE (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'SA-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'SA' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- NO-2ST: MCCLIMENT, KAITLIN (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'NO-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'NO' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- GS-2ST: GORNICK, MITCHELL (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'GS-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'GS' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- DH-2ST: KEYS, MATTHEW (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'DH-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'DH' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- NE-2ST: JOHNSON, JAMI (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'NE-2ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'NE' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- DE-2ST: FIELDS, DETRON (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'DE-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'DE' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- MT-2ST: KENNEDY, JOSEPH (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'MT-2ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'MT' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- EL-2ST: FERRELL, EVAN (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'EL-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'EL' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- CN-2ST: GONZALEZ, OAKLEY (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'CN-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'CN' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

-- IN-3ST: DONNOLO, JOE (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'IN-3ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'IN' AND s.code = '3ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- AL-2ST: MARLOW, RACHAEL (Rest: 2, 3)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'AL-2ST', 2, 3, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'AL' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 2, rest_day2 = 3;

-- QC-2ST: STAMETS, LUCAS (Rest: 1, 2)
INSERT INTO desk_tricks(desk_id, shift_id, code, rest_day1, rest_day2, active)
SELECT d.id, s.id, 'QC-2ST', 1, 2, TRUE
FROM desks d CROSS JOIN shifts s
WHERE d.code = 'QC' AND s.code = '2ST'
ON CONFLICT (code) DO UPDATE
SET rest_day1 = 1, rest_day2 = 2;

COMMIT;