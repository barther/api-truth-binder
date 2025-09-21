-- Seed data for Lovable desk-centric scheduler
-- Insert desks
INSERT INTO desks (id, code, name, territory, is_active) VALUES (1, 'BT', 'Birmingham Terminal', 'Cahaba–Wauhatchie', true);
INSERT INTO desks (id, code, name, territory, is_active) VALUES (2, 'EE', 'East End', 'Norris Yard to Villa Rica', true);

-- Insert tricks
INSERT INTO tricks (id, desk_id, name, shift_start, shift_end, days_mask, timezone) VALUES (101, 1, 'BT1 1st', '06:30', '14:30', B'1111100', 'America/Chicago');
INSERT INTO tricks (id, desk_id, name, shift_start, shift_end, days_mask, timezone) VALUES (102, 1, 'BT1 2nd', '14:30', '22:30', B'1111100', 'America/Chicago');
INSERT INTO tricks (id, desk_id, name, shift_start, shift_end, days_mask, timezone) VALUES (103, 1, 'BT1 3rd', '22:30', '06:30', B'1111100', 'America/Chicago');
INSERT INTO tricks (id, desk_id, name, shift_start, shift_end, days_mask, timezone) VALUES (201, 2, 'EE1 1st', '06:30', '14:30', B'1111100', 'America/New_York');
INSERT INTO tricks (id, desk_id, name, shift_start, shift_end, days_mask, timezone) VALUES (202, 2, 'EE1 2nd', '14:30', '22:30', B'1111100', 'America/New_York');
INSERT INTO tricks (id, desk_id, name, shift_start, shift_end, days_mask, timezone) VALUES (203, 2, 'EE1 3rd', '22:30', '06:30', B'1111100', 'America/New_York');

-- Insert dispatchers
INSERT INTO dispatchers (id, badge, first_name, last_name, rank, hire_date, is_active) VALUES (5001, 'A123', 'Casey', 'Morgan', 'E5', '2018-03-01', true);
INSERT INTO dispatchers (id, badge, first_name, last_name, rank, hire_date, is_active) VALUES (5002, 'B456', 'Riley', 'Shaw', 'E4', '2020-07-15', true);
INSERT INTO dispatchers (id, badge, first_name, last_name, rank, hire_date, is_active) VALUES (5003, 'C789', 'Jordan', 'Lee', 'E6', '2016-11-21', true);

-- Insert qualifications
INSERT INTO qualifications (dispatcher_id, desk_id, qualified_on, trainer_id, notes) VALUES (5001, 1, '2023-04-10', NULL, 'Primary BT');
INSERT INTO qualifications (dispatcher_id, desk_id, qualified_on, trainer_id, notes) VALUES (5002, 1, '2024-11-01', 5001, 'Newly qualified');
INSERT INTO qualifications (dispatcher_id, desk_id, qualified_on, trainer_id, notes) VALUES (5003, 2, '2019-02-15', NULL, 'Primary EE');

-- Insert absences
INSERT INTO absences (dispatcher_id, type, starts_at, ends_at, note) VALUES (5001, 'VACATION', '2025-10-01 00:00:00+00', '2025-10-14 23:59:00+00', 'Annual leave');

-- Insert trick instances (14 days of weekdays for each trick)
INSERT INTO trick_instances (id, trick_id, starts_at, ends_at, is_holiday) VALUES 
(10001, 101, '2025-09-22 11:30:00+00', '2025-09-22 19:30:00+00', false),
(10002, 101, '2025-09-23 11:30:00+00', '2025-09-23 19:30:00+00', false),
(10003, 101, '2025-09-24 11:30:00+00', '2025-09-24 19:30:00+00', false),
(10004, 101, '2025-09-25 11:30:00+00', '2025-09-25 19:30:00+00', false),
(10005, 101, '2025-09-26 11:30:00+00', '2025-09-26 19:30:00+00', false),
(10006, 101, '2025-09-29 11:30:00+00', '2025-09-29 19:30:00+00', false),
(10007, 101, '2025-09-30 11:30:00+00', '2025-09-30 19:30:00+00', false),
(10008, 101, '2025-10-01 11:30:00+00', '2025-10-01 19:30:00+00', false),
(10009, 101, '2025-10-02 11:30:00+00', '2025-10-02 19:30:00+00', false),
(10010, 101, '2025-10-03 11:30:00+00', '2025-10-03 19:30:00+00', false),
(10011, 102, '2025-09-22 19:30:00+00', '2025-09-23 03:30:00+00', false),
(10012, 102, '2025-09-23 19:30:00+00', '2025-09-24 03:30:00+00', false),
(10013, 102, '2025-09-24 19:30:00+00', '2025-09-25 03:30:00+00', false),
(10014, 102, '2025-09-25 19:30:00+00', '2025-09-26 03:30:00+00', false),
(10015, 102, '2025-09-26 19:30:00+00', '2025-09-27 03:30:00+00', false),
(10016, 102, '2025-09-29 19:30:00+00', '2025-09-30 03:30:00+00', false),
(10017, 102, '2025-09-30 19:30:00+00', '2025-10-01 03:30:00+00', false),
(10018, 102, '2025-10-01 19:30:00+00', '2025-10-02 03:30:00+00', false),
(10019, 102, '2025-10-02 19:30:00+00', '2025-10-03 03:30:00+00', false),
(10020, 102, '2025-10-03 19:30:00+00', '2025-10-04 03:30:00+00', false),
(10021, 103, '2025-09-23 03:30:00+00', '2025-09-23 11:30:00+00', false),
(10022, 103, '2025-09-24 03:30:00+00', '2025-09-24 11:30:00+00', false),
(10023, 103, '2025-09-25 03:30:00+00', '2025-09-25 11:30:00+00', false),
(10024, 103, '2025-09-26 03:30:00+00', '2025-09-26 11:30:00+00', false),
(10025, 103, '2025-09-27 03:30:00+00', '2025-09-27 11:30:00+00', false),
(10026, 103, '2025-09-30 03:30:00+00', '2025-09-30 11:30:00+00', false),
(10027, 103, '2025-10-01 03:30:00+00', '2025-10-01 11:30:00+00', false),
(10028, 103, '2025-10-02 03:30:00+00', '2025-10-02 11:30:00+00', false),
(10029, 103, '2025-10-03 03:30:00+00', '2025-10-03 11:30:00+00', false),
(10030, 103, '2025-10-04 03:30:00+00', '2025-10-04 11:30:00+00', false),
(10031, 201, '2025-09-22 10:30:00+00', '2025-09-22 18:30:00+00', false),
(10032, 201, '2025-09-23 10:30:00+00', '2025-09-23 18:30:00+00', false),
(10033, 201, '2025-09-24 10:30:00+00', '2025-09-24 18:30:00+00', false),
(10034, 201, '2025-09-25 10:30:00+00', '2025-09-25 18:30:00+00', false),
(10035, 201, '2025-09-26 10:30:00+00', '2025-09-26 18:30:00+00', false),
(10036, 201, '2025-09-29 10:30:00+00', '2025-09-29 18:30:00+00', false),
(10037, 201, '2025-09-30 10:30:00+00', '2025-09-30 18:30:00+00', false),
(10038, 201, '2025-10-01 10:30:00+00', '2025-10-01 18:30:00+00', false),
(10039, 201, '2025-10-02 10:30:00+00', '2025-10-02 18:30:00+00', false),
(10040, 201, '2025-10-03 10:30:00+00', '2025-10-03 18:30:00+00', false),
(10041, 202, '2025-09-22 18:30:00+00', '2025-09-23 02:30:00+00', false),
(10042, 202, '2025-09-23 18:30:00+00', '2025-09-24 02:30:00+00', false),
(10043, 202, '2025-09-24 18:30:00+00', '2025-09-25 02:30:00+00', false),
(10044, 202, '2025-09-25 18:30:00+00', '2025-09-26 02:30:00+00', false),
(10045, 202, '2025-09-26 18:30:00+00', '2025-09-27 02:30:00+00', false),
(10046, 202, '2025-09-29 18:30:00+00', '2025-09-30 02:30:00+00', false),
(10047, 202, '2025-09-30 18:30:00+00', '2025-10-01 02:30:00+00', false),
(10048, 202, '2025-10-01 18:30:00+00', '2025-10-02 02:30:00+00', false),
(10049, 202, '2025-10-02 18:30:00+00', '2025-10-03 02:30:00+00', false),
(10050, 202, '2025-10-03 18:30:00+00', '2025-10-04 02:30:00+00', false),
(10051, 203, '2025-09-23 02:30:00+00', '2025-09-23 10:30:00+00', false),
(10052, 203, '2025-09-24 02:30:00+00', '2025-09-24 10:30:00+00', false),
(10053, 203, '2025-09-25 02:30:00+00', '2025-09-25 10:30:00+00', false),
(10054, 203, '2025-09-26 02:30:00+00', '2025-09-26 10:30:00+00', false),
(10055, 203, '2025-09-27 02:30:00+00', '2025-09-27 10:30:00+00', false),
(10056, 203, '2025-09-30 02:30:00+00', '2025-09-30 10:30:00+00', false),
(10057, 203, '2025-10-01 02:30:00+00', '2025-10-01 10:30:00+00', false),
(10058, 203, '2025-10-02 02:30:00+00', '2025-10-02 10:30:00+00', false),
(10059, 203, '2025-10-03 02:30:00+00', '2025-10-03 10:30:00+00', false),
(10060, 203, '2025-10-04 02:30:00+00', '2025-10-04 10:30:00+00', false);

-- Insert seniority data
INSERT INTO seniority (dispatcher_id, rank, tie_breaker) VALUES (5001, 'E5', 0);
INSERT INTO seniority (dispatcher_id, rank, tie_breaker) VALUES (5002, 'E4', 0);
INSERT INTO seniority (dispatcher_id, rank, tie_breaker) VALUES (5003, 'E6', 0);