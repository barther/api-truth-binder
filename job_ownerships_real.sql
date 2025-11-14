-- Job ownerships from company data
BEGIN;

-- NR-1ST owned by DICKERSON, RUSSELL
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'NR-1ST'
AND e.last_name = 'DICKERSON'
AND e.first_name = 'RUSSELL'
ON CONFLICT DO NOTHING;

-- MV-3ST owned by DYE, JAMES
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'MV-3ST'
AND e.last_name = 'DYE'
AND e.first_name = 'JAMES'
ON CONFLICT DO NOTHING;

-- KC-3ST owned by FUNK, TODD
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'KC-3ST'
AND e.last_name = 'FUNK'
AND e.first_name = 'TODD'
ON CONFLICT DO NOTHING;

-- PO-1ST owned by BAILEY, LORRIE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'PO-1ST'
AND e.last_name = 'BAILEY'
AND e.first_name = 'LORRIE'
ON CONFLICT DO NOTHING;

-- NO-1ST owned by REACH, JEFF
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'NO-1ST'
AND e.last_name = 'REACH'
AND e.first_name = 'JEFF'
ON CONFLICT DO NOTHING;

-- DV-1ST owned by HATTON, ROBERT
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'DV-1ST'
AND e.last_name = 'HATTON'
AND e.first_name = 'ROBERT'
ON CONFLICT DO NOTHING;

-- KN-1ST owned by ROUNSAVALL, MIKE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'KN-1ST'
AND e.last_name = 'ROUNSAVALL'
AND e.first_name = 'MIKE'
ON CONFLICT DO NOTHING;

-- CE-1ST owned by DEJESUS, DAVE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CE-1ST'
AND e.last_name = 'DEJESUS'
AND e.first_name = 'DAVE'
ON CONFLICT DO NOTHING;

-- RL-1ST owned by ROTH, KATE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'RL-1ST'
AND e.last_name = 'ROTH'
AND e.first_name = 'KATE'
ON CONFLICT DO NOTHING;

-- AS-3ST owned by PAYNE, ANDREW
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'AS-3ST'
AND e.last_name = 'PAYNE'
AND e.first_name = 'ANDREW'
ON CONFLICT DO NOTHING;

-- KY-3ST owned by BOVIALL, STEVE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'KY-3ST'
AND e.last_name = 'BOVIALL'
AND e.first_name = 'STEVE'
ON CONFLICT DO NOTHING;

-- SO-1ST owned by COX, ANDY
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SO-1ST'
AND e.last_name = 'COX'
AND e.first_name = 'ANDY'
ON CONFLICT DO NOTHING;

-- ME-1ST owned by EASTHAM, DARBY
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'ME-1ST'
AND e.last_name = 'EASTHAM'
AND e.first_name = 'DARBY'
ON CONFLICT DO NOTHING;

-- GS-1ST owned by COX, DERICK
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'GS-1ST'
AND e.last_name = 'COX'
AND e.first_name = 'DERICK'
ON CONFLICT DO NOTHING;

-- CH-1ST owned by SMITH, GEMOND
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CH-1ST'
AND e.last_name = 'SMITH'
AND e.first_name = 'GEMOND'
ON CONFLICT DO NOTHING;

-- HG-1ST owned by DILL, GERALD
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'HG-1ST'
AND e.last_name = 'DILL'
AND e.first_name = 'GERALD'
ON CONFLICT DO NOTHING;

-- DH-1ST owned by WIMMER, CHRISTOPHER
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'DH-1ST'
AND e.last_name = 'WIMMER'
AND e.first_name = 'CHRISTOPHER'
ON CONFLICT DO NOTHING;

-- KW-1ST owned by SCOTT, TROY
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'KW-1ST'
AND e.last_name = 'SCOTT'
AND e.first_name = 'TROY'
ON CONFLICT DO NOTHING;

-- KW-3ST owned by BUSH, MONICA
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'KW-3ST'
AND e.last_name = 'BUSH'
AND e.first_name = 'MONICA'
ON CONFLICT DO NOTHING;

-- NE-1ST owned by ELLIOTT, SHELDON
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'NE-1ST'
AND e.last_name = 'ELLIOTT'
AND e.first_name = 'SHELDON'
ON CONFLICT DO NOTHING;

-- MT-1ST owned by YEAGER, DOROTHY
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'MT-1ST'
AND e.last_name = 'YEAGER'
AND e.first_name = 'DOROTHY'
ON CONFLICT DO NOTHING;

-- CT-1ST owned by RITCHIE, MIKE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CT-1ST'
AND e.last_name = 'RITCHIE'
AND e.first_name = 'MIKE'
ON CONFLICT DO NOTHING;

-- EE-1ST owned by JOHNSON, TJ
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'EE-1ST'
AND e.last_name = 'JOHNSON'
AND e.first_name = 'TJ'
ON CONFLICT DO NOTHING;

-- HT-1ST owned by CAMARDA, CHRIS
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'HT-1ST'
AND e.last_name = 'CAMARDA'
AND e.first_name = 'CHRIS'
ON CONFLICT DO NOTHING;

-- SE-3ST owned by MAPHENDUKA, DEAN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SE-3ST'
AND e.last_name = 'MAPHENDUKA'
AND e.first_name = 'DEAN'
ON CONFLICT DO NOTHING;

-- EL-1ST owned by NEGLEY, ANTHONY
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'EL-1ST'
AND e.last_name = 'NEGLEY'
AND e.first_name = 'ANTHONY'
ON CONFLICT DO NOTHING;

-- DE-1ST owned by JAMES, GREGG
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'DE-1ST'
AND e.last_name = 'JAMES'
AND e.first_name = 'GREGG'
ON CONFLICT DO NOTHING;

-- SA-1ST owned by BRENNEKE, TAMI
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SA-1ST'
AND e.last_name = 'BRENNEKE'
AND e.first_name = 'TAMI'
ON CONFLICT DO NOTHING;

-- PE-1ST owned by LUTERAN, COREY
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'PE-1ST'
AND e.last_name = 'LUTERAN'
AND e.first_name = 'COREY'
ON CONFLICT DO NOTHING;

-- RT-1ST owned by GOEBEL, IAN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'RT-1ST'
AND e.last_name = 'GOEBEL'
AND e.first_name = 'IAN'
ON CONFLICT DO NOTHING;

-- CN-1ST owned by GILLESPIE, JEREMY
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CN-1ST'
AND e.last_name = 'GILLESPIE'
AND e.first_name = 'JEREMY'
ON CONFLICT DO NOTHING;

-- SV-2ST owned by ADAMS, ARDRA
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SV-2ST'
AND e.last_name = 'ADAMS'
AND e.first_name = 'ARDRA'
ON CONFLICT DO NOTHING;

-- IN-1ST owned by SMITH, PATRICK
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'IN-1ST'
AND e.last_name = 'SMITH'
AND e.first_name = 'PATRICK'
ON CONFLICT DO NOTHING;

-- SW-1ST owned by LITTLE, CHRISTAL
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SW-1ST'
AND e.last_name = 'LITTLE'
AND e.first_name = 'CHRISTAL'
ON CONFLICT DO NOTHING;

-- SE-1ST owned by HENDRICKS, WILLIAM
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SE-1ST'
AND e.last_name = 'HENDRICKS'
AND e.first_name = 'WILLIAM'
ON CONFLICT DO NOTHING;

-- DV-3ST owned by VINCENT, JAMES
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'DV-3ST'
AND e.last_name = 'VINCENT'
AND e.first_name = 'JAMES'
ON CONFLICT DO NOTHING;

-- CH-3ST owned by PATE, MELINDA
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CH-3ST'
AND e.last_name = 'PATE'
AND e.first_name = 'MELINDA'
ON CONFLICT DO NOTHING;

-- BT-3ST owned by PATE, TABITHA
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'BT-3ST'
AND e.last_name = 'PATE'
AND e.first_name = 'TABITHA'
ON CONFLICT DO NOTHING;

-- RL-2ST owned by CROUTHARMEL, JASON
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'RL-2ST'
AND e.last_name = 'CROUTHARMEL'
AND e.first_name = 'JASON'
ON CONFLICT DO NOTHING;

-- DT-1ST owned by BROSKIN, CHRIS
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'DT-1ST'
AND e.last_name = 'BROSKIN'
AND e.first_name = 'CHRIS'
ON CONFLICT DO NOTHING;

-- SV-3ST owned by SCONIERS, KELVIN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SV-3ST'
AND e.last_name = 'SCONIERS'
AND e.first_name = 'KELVIN'
ON CONFLICT DO NOTHING;

-- AS-1ST owned by FRAZIER, PATRICK
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'AS-1ST'
AND e.last_name = 'FRAZIER'
AND e.first_name = 'PATRICK'
ON CONFLICT DO NOTHING;

-- ET-1ST owned by KRZYZANOWSKI, RENEE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'ET-1ST'
AND e.last_name = 'KRZYZANOWSKI'
AND e.first_name = 'RENEE'
ON CONFLICT DO NOTHING;

-- RT-3ST owned by DAVIS, JIM
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'RT-3ST'
AND e.last_name = 'DAVIS'
AND e.first_name = 'JIM'
ON CONFLICT DO NOTHING;

-- SV-1ST owned by FOGLE, MARLO
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SV-1ST'
AND e.last_name = 'FOGLE'
AND e.first_name = 'MARLO'
ON CONFLICT DO NOTHING;

-- SP-1ST owned by WENNEMAN, BRYAN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SP-1ST'
AND e.last_name = 'WENNEMAN'
AND e.first_name = 'BRYAN'
ON CONFLICT DO NOTHING;

-- KC-1ST owned by KOSHY, SUJIT
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'KC-1ST'
AND e.last_name = 'KOSHY'
AND e.first_name = 'SUJIT'
ON CONFLICT DO NOTHING;

-- CD-1ST owned by CLUBBS, DARIN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CD-1ST'
AND e.last_name = 'CLUBBS'
AND e.first_name = 'DARIN'
ON CONFLICT DO NOTHING;

-- CE-2ST owned by HICKEY, LINDA
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CE-2ST'
AND e.last_name = 'HICKEY'
AND e.first_name = 'LINDA'
ON CONFLICT DO NOTHING;

-- SW-2ST owned by PIETSCH, DAN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SW-2ST'
AND e.last_name = 'PIETSCH'
AND e.first_name = 'DAN'
ON CONFLICT DO NOTHING;

-- GS-3ST owned by MORGAN, CURTIS
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'GS-3ST'
AND e.last_name = 'MORGAN'
AND e.first_name = 'CURTIS'
ON CONFLICT DO NOTHING;

-- AL-1ST owned by PANELLA, MICHAEL
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'AL-1ST'
AND e.last_name = 'PANELLA'
AND e.first_name = 'MICHAEL'
ON CONFLICT DO NOTHING;

-- IN-2ST owned by MCDANIEL, PAMELA
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'IN-2ST'
AND e.last_name = 'MCDANIEL'
AND e.first_name = 'PAMELA'
ON CONFLICT DO NOTHING;

-- PE-2ST owned by THOMAS, FRANK
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'PE-2ST'
AND e.last_name = 'THOMAS'
AND e.first_name = 'FRANK'
ON CONFLICT DO NOTHING;

-- CG-1ST owned by GLACE, JOSH
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CG-1ST'
AND e.last_name = 'GLACE'
AND e.first_name = 'JOSH'
ON CONFLICT DO NOTHING;

-- SP-2ST owned by KNORRE, ANDREA
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SP-2ST'
AND e.last_name = 'KNORRE'
AND e.first_name = 'ANDREA'
ON CONFLICT DO NOTHING;

-- HE-1ST owned by CARR, JEREMY
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'HE-1ST'
AND e.last_name = 'CARR'
AND e.first_name = 'JEREMY'
ON CONFLICT DO NOTHING;

-- QC-1ST owned by KIRKPATRICK, DOUG
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'QC-1ST'
AND e.last_name = 'KIRKPATRICK'
AND e.first_name = 'DOUG'
ON CONFLICT DO NOTHING;

-- EE-3ST owned by STURLEY, DEANNA
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'EE-3ST'
AND e.last_name = 'STURLEY'
AND e.first_name = 'DEANNA'
ON CONFLICT DO NOTHING;

-- NE-3ST owned by DAY, DARRELL
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'NE-3ST'
AND e.last_name = 'DAY'
AND e.first_name = 'DARRELL'
ON CONFLICT DO NOTHING;

-- ME-3ST owned by REBER, MARKUS
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'ME-3ST'
AND e.last_name = 'REBER'
AND e.first_name = 'MARKUS'
ON CONFLICT DO NOTHING;

-- SA-2ST owned by SOLES, BILL
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SA-2ST'
AND e.last_name = 'SOLES'
AND e.first_name = 'BILL'
ON CONFLICT DO NOTHING;

-- PE-3ST owned by MCCARREN, CARRIE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'PE-3ST'
AND e.last_name = 'MCCARREN'
AND e.first_name = 'CARRIE'
ON CONFLICT DO NOTHING;

-- KY-1ST owned by DORTCH, NANCY
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'KY-1ST'
AND e.last_name = 'DORTCH'
AND e.first_name = 'NANCY'
ON CONFLICT DO NOTHING;

-- DT-2ST owned by KAY-JACKWAK, LORI
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'DT-2ST'
AND e.last_name = 'KAY-JACKWAK'
AND e.first_name = 'LORI'
ON CONFLICT DO NOTHING;

-- TT-1ST owned by VANNIER, RYAN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'TT-1ST'
AND e.last_name = 'VANNIER'
AND e.first_name = 'RYAN'
ON CONFLICT DO NOTHING;

-- VA-2ST owned by NELLUM, KEVIN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'VA-2ST'
AND e.last_name = 'NELLUM'
AND e.first_name = 'KEVIN'
ON CONFLICT DO NOTHING;

-- BT-1ST owned by WATERS, MICHAEL
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'BT-1ST'
AND e.last_name = 'WATERS'
AND e.first_name = 'MICHAEL'
ON CONFLICT DO NOTHING;

-- DV-2ST owned by WOODS, RAMONNE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'DV-2ST'
AND e.last_name = 'WOODS'
AND e.first_name = 'RAMONNE'
ON CONFLICT DO NOTHING;

-- LF-1ST owned by MERCER, LLOYD
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'LF-1ST'
AND e.last_name = 'MERCER'
AND e.first_name = 'LLOYD'
ON CONFLICT DO NOTHING;

-- CT-3ST owned by WEIL, BILL
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CT-3ST'
AND e.last_name = 'WEIL'
AND e.first_name = 'BILL'
ON CONFLICT DO NOTHING;

-- HE-3ST owned by ZIEGERT, ABIGAIL
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'HE-3ST'
AND e.last_name = 'ZIEGERT'
AND e.first_name = 'ABIGAIL'
ON CONFLICT DO NOTHING;

-- MV-1ST owned by BAUMAN, BRENT
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'MV-1ST'
AND e.last_name = 'BAUMAN'
AND e.first_name = 'BRENT'
ON CONFLICT DO NOTHING;

-- DT-3ST owned by BULLO, GABRIELLE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'DT-3ST'
AND e.last_name = 'BULLO'
AND e.first_name = 'GABRIELLE'
ON CONFLICT DO NOTHING;

-- KN-2ST owned by DAVIS, MARK
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'KN-2ST'
AND e.last_name = 'DAVIS'
AND e.first_name = 'MARK'
ON CONFLICT DO NOTHING;

-- VA-1ST owned by MULLEN, RYAN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'VA-1ST'
AND e.last_name = 'MULLEN'
AND e.first_name = 'RYAN'
ON CONFLICT DO NOTHING;

-- KN-3ST owned by LITTLE, RYAN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'KN-3ST'
AND e.last_name = 'LITTLE'
AND e.first_name = 'RYAN'
ON CONFLICT DO NOTHING;

-- HT-2ST owned by DAVIS, MATT
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'HT-2ST'
AND e.last_name = 'DAVIS'
AND e.first_name = 'MATT'
ON CONFLICT DO NOTHING;

-- RL-3ST owned by HARBIN, BRYANT
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'RL-3ST'
AND e.last_name = 'HARBIN'
AND e.first_name = 'BRYANT'
ON CONFLICT DO NOTHING;

-- HG-3ST owned by BILLINGS, CYNTHIA
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'HG-3ST'
AND e.last_name = 'BILLINGS'
AND e.first_name = 'CYNTHIA'
ON CONFLICT DO NOTHING;

-- NR-2ST owned by LITTLE, JASON
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'NR-2ST'
AND e.last_name = 'LITTLE'
AND e.first_name = 'JASON'
ON CONFLICT DO NOTHING;

-- SO-3ST owned by MARZETTE, MEEKA
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SO-3ST'
AND e.last_name = 'MARZETTE'
AND e.first_name = 'MEEKA'
ON CONFLICT DO NOTHING;

-- PO-3ST owned by YOUNGER, SAMANTHA
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'PO-3ST'
AND e.last_name = 'YOUNGER'
AND e.first_name = 'SAMANTHA'
ON CONFLICT DO NOTHING;

-- ET-2ST owned by BLAIR, CHRISTINE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'ET-2ST'
AND e.last_name = 'BLAIR'
AND e.first_name = 'CHRISTINE'
ON CONFLICT DO NOTHING;

-- PO-2ST owned by QUINN, COURTNEY
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'PO-2ST'
AND e.last_name = 'QUINN'
AND e.first_name = 'COURTNEY'
ON CONFLICT DO NOTHING;

-- LF-2ST owned by BLAIR, ROBERT
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'LF-2ST'
AND e.last_name = 'BLAIR'
AND e.first_name = 'ROBERT'
ON CONFLICT DO NOTHING;

-- CG-3ST owned by WENGER, JOSH
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CG-3ST'
AND e.last_name = 'WENGER'
AND e.first_name = 'JOSH'
ON CONFLICT DO NOTHING;

-- CN-3ST owned by CLEVENGER, R LANCE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CN-3ST'
AND e.last_name = 'CLEVENGER'
AND e.first_name = 'R LANCE'
ON CONFLICT DO NOTHING;

-- KW-2ST owned by BARTER, ELIZABETH
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'KW-2ST'
AND e.last_name = 'BARTER'
AND e.first_name = 'ELIZABETH'
ON CONFLICT DO NOTHING;

-- SP-3ST owned by PALMER, SANFORD
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SP-3ST'
AND e.last_name = 'PALMER'
AND e.first_name = 'SANFORD'
ON CONFLICT DO NOTHING;

-- AS-2ST owned by FITZGERALD, JIM
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'AS-2ST'
AND e.last_name = 'FITZGERALD'
AND e.first_name = 'JIM'
ON CONFLICT DO NOTHING;

-- SE-2ST owned by PACE, LEWIS
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SE-2ST'
AND e.last_name = 'PACE'
AND e.first_name = 'LEWIS'
ON CONFLICT DO NOTHING;

-- TT-2ST owned by SCOTT, DONALD
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'TT-2ST'
AND e.last_name = 'SCOTT'
AND e.first_name = 'DONALD'
ON CONFLICT DO NOTHING;

-- CE-3ST owned by WILLIAMS, SCOTT
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CE-3ST'
AND e.last_name = 'WILLIAMS'
AND e.first_name = 'SCOTT'
ON CONFLICT DO NOTHING;

-- HG-2ST owned by COOPER, JAMES
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'HG-2ST'
AND e.last_name = 'COOPER'
AND e.first_name = 'JAMES'
ON CONFLICT DO NOTHING;

-- SO-2ST owned by WILLIAMS, SHANAN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SO-2ST'
AND e.last_name = 'WILLIAMS'
AND e.first_name = 'SHANAN'
ON CONFLICT DO NOTHING;

-- DE-3ST owned by MCGRADY, SHAWN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'DE-3ST'
AND e.last_name = 'MCGRADY'
AND e.first_name = 'SHAWN'
ON CONFLICT DO NOTHING;

-- ET-3ST owned by GREEN, SUSAN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'ET-3ST'
AND e.last_name = 'GREEN'
AND e.first_name = 'SUSAN'
ON CONFLICT DO NOTHING;

-- CG-2ST owned by VAZQUEZ, ERIC
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CG-2ST'
AND e.last_name = 'VAZQUEZ'
AND e.first_name = 'ERIC'
ON CONFLICT DO NOTHING;

-- VA-3ST owned by ROBINSON, ANDY
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'VA-3ST'
AND e.last_name = 'ROBINSON'
AND e.first_name = 'ANDY'
ON CONFLICT DO NOTHING;

-- QC-3ST owned by SANSBURY, TRAVIS
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'QC-3ST'
AND e.last_name = 'SANSBURY'
AND e.first_name = 'TRAVIS'
ON CONFLICT DO NOTHING;

-- HE-2ST owned by MCAULEY, LESLIE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'HE-2ST'
AND e.last_name = 'MCAULEY'
AND e.first_name = 'LESLIE'
ON CONFLICT DO NOTHING;

-- ME-2ST owned by FAIRCLOTH, HANNAH
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'ME-2ST'
AND e.last_name = 'FAIRCLOTH'
AND e.first_name = 'HANNAH'
ON CONFLICT DO NOTHING;

-- NR-3ST owned by SHAW, JUSTIN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'NR-3ST'
AND e.last_name = 'SHAW'
AND e.first_name = 'JUSTIN'
ON CONFLICT DO NOTHING;

-- HT-3ST owned by SHIELDS, BRIAN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'HT-3ST'
AND e.last_name = 'SHIELDS'
AND e.first_name = 'BRIAN'
ON CONFLICT DO NOTHING;

-- NO-3ST owned by PRINCE, MICHAEL
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'NO-3ST'
AND e.last_name = 'PRINCE'
AND e.first_name = 'MICHAEL'
ON CONFLICT DO NOTHING;

-- EE-2ST owned by ARTHER, BART
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'EE-2ST'
AND e.last_name = 'ARTHER'
AND e.first_name = 'BART'
ON CONFLICT DO NOTHING;

-- MT-3ST owned by DONALDSON, CODY
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'MT-3ST'
AND e.last_name = 'DONALDSON'
AND e.first_name = 'CODY'
ON CONFLICT DO NOTHING;

-- SW-3ST owned by MILLER, FRED
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SW-3ST'
AND e.last_name = 'MILLER'
AND e.first_name = 'FRED'
ON CONFLICT DO NOTHING;

-- BT-2ST owned by MATTHEWS, RASHIM
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'BT-2ST'
AND e.last_name = 'MATTHEWS'
AND e.first_name = 'RASHIM'
ON CONFLICT DO NOTHING;

-- CT-2ST owned by HARDY, JASMINE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CT-2ST'
AND e.last_name = 'HARDY'
AND e.first_name = 'JASMINE'
ON CONFLICT DO NOTHING;

-- CD-2ST owned by ROBINSON, MATTHEW
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CD-2ST'
AND e.last_name = 'ROBINSON'
AND e.first_name = 'MATTHEW'
ON CONFLICT DO NOTHING;

-- CD-3ST owned by BAILEY, STEVEN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CD-3ST'
AND e.last_name = 'BAILEY'
AND e.first_name = 'STEVEN'
ON CONFLICT DO NOTHING;

-- KY-2ST owned by THOMAS, RONNIE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'KY-2ST'
AND e.last_name = 'THOMAS'
AND e.first_name = 'RONNIE'
ON CONFLICT DO NOTHING;

-- AL-3ST owned by MOGGIO, WILLIAM
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'AL-3ST'
AND e.last_name = 'MOGGIO'
AND e.first_name = 'WILLIAM'
ON CONFLICT DO NOTHING;

-- CH-2ST owned by MCROY, DANIEL
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CH-2ST'
AND e.last_name = 'MCROY'
AND e.first_name = 'DANIEL'
ON CONFLICT DO NOTHING;

-- RT-2ST owned by LEESON, JARED
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'RT-2ST'
AND e.last_name = 'LEESON'
AND e.first_name = 'JARED'
ON CONFLICT DO NOTHING;

-- MV-2ST owned by DICK, KAYLA
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'MV-2ST'
AND e.last_name = 'DICK'
AND e.first_name = 'KAYLA'
ON CONFLICT DO NOTHING;

-- EL-3ST owned by TRACY, LUCAS
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'EL-3ST'
AND e.last_name = 'TRACY'
AND e.first_name = 'LUCAS'
ON CONFLICT DO NOTHING;

-- KC-2ST owned by BOLEN, MEGAN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'KC-2ST'
AND e.last_name = 'BOLEN'
AND e.first_name = 'MEGAN'
ON CONFLICT DO NOTHING;

-- DH-3ST owned by BOX, MANDY
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'DH-3ST'
AND e.last_name = 'BOX'
AND e.first_name = 'MANDY'
ON CONFLICT DO NOTHING;

-- SA-3ST owned by STAMETS, JAKE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'SA-3ST'
AND e.last_name = 'STAMETS'
AND e.first_name = 'JAKE'
ON CONFLICT DO NOTHING;

-- NO-2ST owned by MCCLIMENT, KAITLIN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'NO-2ST'
AND e.last_name = 'MCCLIMENT'
AND e.first_name = 'KAITLIN'
ON CONFLICT DO NOTHING;

-- GS-2ST owned by GORNICK, MITCHELL
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'GS-2ST'
AND e.last_name = 'GORNICK'
AND e.first_name = 'MITCHELL'
ON CONFLICT DO NOTHING;

-- DH-2ST owned by KEYS, MATTHEW
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'DH-2ST'
AND e.last_name = 'KEYS'
AND e.first_name = 'MATTHEW'
ON CONFLICT DO NOTHING;

-- NE-2ST owned by JOHNSON, JAMI
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'NE-2ST'
AND e.last_name = 'JOHNSON'
AND e.first_name = 'JAMI'
ON CONFLICT DO NOTHING;

-- DE-2ST owned by FIELDS, DETRON
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'DE-2ST'
AND e.last_name = 'FIELDS'
AND e.first_name = 'DETRON'
ON CONFLICT DO NOTHING;

-- MT-2ST owned by KENNEDY, JOSEPH
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'MT-2ST'
AND e.last_name = 'KENNEDY'
AND e.first_name = 'JOSEPH'
ON CONFLICT DO NOTHING;

-- EL-2ST owned by FERRELL, EVAN
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'EL-2ST'
AND e.last_name = 'FERRELL'
AND e.first_name = 'EVAN'
ON CONFLICT DO NOTHING;

-- CN-2ST owned by GONZALEZ, OAKLEY
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'CN-2ST'
AND e.last_name = 'GONZALEZ'
AND e.first_name = 'OAKLEY'
ON CONFLICT DO NOTHING;

-- IN-3ST owned by DONNOLO, JOE
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'IN-3ST'
AND e.last_name = 'DONNOLO'
AND e.first_name = 'JOE'
ON CONFLICT DO NOTHING;

-- AL-2ST owned by MARLOW, RACHAEL
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'AL-2ST'
AND e.last_name = 'MARLOW'
AND e.first_name = 'RACHAEL'
ON CONFLICT DO NOTHING;

-- QC-2ST owned by STAMETS, LUCAS
INSERT INTO job_ownerships(desk_trick_id, employee_id, start_date, is_incumbent)
SELECT dt.id, e.id, '2023-01-01', TRUE
FROM desk_tricks dt
CROSS JOIN employees e
WHERE dt.code = 'QC-2ST'
AND e.last_name = 'STAMETS'
AND e.first_name = 'LUCAS'
ON CONFLICT DO NOTHING;

COMMIT;