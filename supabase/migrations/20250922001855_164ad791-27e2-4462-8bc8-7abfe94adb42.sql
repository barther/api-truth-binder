-- Insert sample data for testing admin pages
BEGIN;

-- Insert sample desk
INSERT INTO desks (id, code, name, territory, is_active)
VALUES (1, 'BT', 'Birmingham Terminal', 'Cahaba–Wauhatchie', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample trick
-- Mon–Fri mask (Mon=bit0 .. Sun=bit6): 1111100
INSERT INTO tricks (id, desk_id, name, shift_start, shift_end, days_mask, timezone, is_active)
VALUES (101, 1, 'BT1 3rd', '22:30', '06:30', B'1111100', 'America/Chicago', true)
ON CONFLICT (id) DO NOTHING;

COMMIT;