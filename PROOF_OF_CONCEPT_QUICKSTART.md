

# Proof of Concept Quick Start

Get the NOC Dispatch Scheduler running with REAL data in 30 minutes.

## What You're Building

A union accountability tool that:
- Auto-generates schedule from current job assignments
- Allows mark-offs to create vacancies
- Runs deterministic algorithm to show WHO SHOULD be assigned
- Shows complete cascade when diversions happen
- Proves contract violations with audit trails

## Prerequisites

- Supabase project created
- Real data files ready:
  - `dispatchers_complete_real.csv` (269 dispatchers)
  - `real_desks_migration.sql` (16 desks)
  - `tricks_with_real_rest_days.sql` (133 tricks)
  - `job_ownerships_real.sql` (133 current assignments)

## Step-by-Step Setup

### 1. Run Database Migrations (Supabase SQL Editor)

Run these migrations IN ORDER:

```sql
-- Base schema
20251113000000_complete_schema.sql

-- Helper functions
20251113000001_helper_functions.sql

-- Diversion logic
20251114000000_diversion_logic.sql

-- Order of call
20251114000001_order_of_call.sql

-- Cascade resolution
20251114000002_cascade_and_rotation.sql

-- Order of call with rotation
20251114000003_order_of_call_with_rotation.sql

-- Schedule generator
20251114000004_schedule_generator.sql
```

### 2. Import Real Data

**A. Import Desks**
```sql
-- Run: real_desks_migration.sql
```

**B. Import Tricks**
```sql
-- Run: tricks_with_real_rest_days.sql
```

**C. Import Dispatchers**

Use the Dispatcher Admin page (http://localhost:5173/admin/dispatchers):
1. Click "Import from CSV"
2. Upload `dispatchers_complete_real.csv`
3. Verify 269 dispatchers imported

**D. Import Job Ownerships**
```sql
-- Run: job_ownerships_real.sql
```

**E. Add Your Qualifications**
```sql
-- Run: add_arther_qualifications.sql
-- (Or modify with your employee number and qualifications)
```

### 3. Set Up Extra Board

**A. Determine Board Members**

Find dispatchers who don't own jobs (they're on the board):
```sql
SELECT emp_no, last_name, first_name, seniority_date
FROM employees
WHERE NOT EXISTS (
  SELECT 1 FROM job_ownerships jo
  WHERE jo.employee_id = employees.id AND jo.end_date IS NULL
)
AND status = 'ACTIVE'
ORDER BY seniority_date;
```

**B. Create Boards**

For each division/shift combination, create a board:

```sql
-- Example: GAD First Shift Extra Board
WITH gad_division AS (
  SELECT id FROM divisions WHERE code = 'GAD' LIMIT 1
),
first_shift AS (
  SELECT id FROM shifts WHERE code = '1ST' LIMIT 1
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
```

Repeat for each board (GAD-2ST-EB, GAD-3ST-EB, GULF-1ST-EB, etc.)

**C. Assign Board Members**

```sql
-- Example: Assign specific dispatchers to GAD-1ST-EB
WITH gad_eb AS (
  SELECT id FROM boards WHERE code = 'GAD-1ST-EB' LIMIT 1
),
eb_members AS (
  SELECT id FROM employees WHERE emp_no IN (
    '1234567',  -- Replace with actual emp numbers
    '2345678',
    '3456789'
    -- Add more...
  )
)
INSERT INTO board_memberships (board_id, employee_id, start_date)
SELECT gad_eb.id, eb_members.id, CURRENT_DATE
FROM gad_eb, eb_members
ON CONFLICT DO NOTHING;
```

**D. Initialize Rotation**

```sql
-- For each board, initialize rotation positions
SELECT initialize_board_rotation(
  (SELECT id FROM boards WHERE code = 'GAD-1ST-EB')
);

-- Repeat for each board
```

**E. Set Board Eligibility Flags**

```sql
-- EB members are board eligible
UPDATE employees e
SET is_board_eligible = TRUE
WHERE EXISTS (
  SELECT 1 FROM board_memberships bm
  WHERE bm.employee_id = e.id AND bm.end_date IS NULL
);

-- Job owners are NOT board eligible
UPDATE employees e
SET is_board_eligible = FALSE
WHERE EXISTS (
  SELECT 1 FROM job_ownerships jo
  WHERE jo.employee_id = e.id AND jo.end_date IS NULL
);
```

### 4. Generate Schedule (Auto-populate with Incumbents)

**Generate next 30 days:**

```sql
SELECT * FROM generate_schedule_days(30);
```

This will:
- Create schedule_slots for every trick, every day
- Auto-assign incumbents to their working days
- Leave rest days vacant (for Relief/EB to fill)

**Verify schedule created:**

```sql
-- Check slots created
SELECT COUNT(*) FROM schedule_slots;
-- Should see: 133 tricks × 30 days = ~3,990 slots

-- Check assignments created
SELECT COUNT(*) FROM assignments;
-- Should see incumbents assigned to ~2,800 slots (accounting for rest days)

-- Check vacancies (rest days)
SELECT COUNT(*) FROM v_vacancies;
-- Should see ~1,190 vacancies (rest days awaiting coverage)
```

### 5. Optional: Set Up Relief & ATW

For proof of concept, you can skip this initially. The Extra Board will cover rest days.

If you want to set up Relief and ATW:
- See `setup_relief_and_atw.sql` for templates
- One relief dispatcher per desk (covers that desk's rest days)
- One ATW dispatcher (Mon-Fri rotation on 3rd shift)

### 6. Test the System

**A. Open the App**
```bash
npm run dev
```

**B. Check Vacancy Checker**

Visit http://localhost:5173/

You should see ~1,190 vacancies (rest days).

Click any vacancy → Algorithm will recommend who should cover it.

**C. Test Mark-Off Tool**

Visit http://localhost:5173/mark-off

1. Select yourself (or any dispatcher)
2. Select tomorrow's date
3. Select "SICK"
4. Click "Mark Off & Run Algorithm"

You should see:
- Your vacancy created
- Algorithm recommendation
- If "Show Full Cascade" enabled: complete chain of coverage

**D. Test a Diversion Cascade**

To see cascading in action:

1. Mark off MULTIPLE dispatchers on the same day
2. Eventually, EB will run out
3. Algorithm will divert someone
4. Their job becomes vacant
5. Cascade resolver shows the full chain

### 7. Configure Settings

**A. Set EB Baseline**

```sql
-- If you know your EB baseline (minimum EB strength)
UPDATE config SET value = '10' WHERE key = 'eb_baseline_strength';
```

**B. Set Max Cascade Depth**

```sql
-- How deep cascades can go (default 5)
UPDATE config SET value = '5' WHERE key = 'max_cascade_depth';
```

## What Works Right Now

✓ **269 Real Dispatchers** with actual seniority dates
✓ **16 Desks** with real names
✓ **133 Tricks** with actual rest day patterns
✓ **133 Job Ownerships** (current assignments)
✓ **Auto-schedule generation** (incumbents on working days)
✓ **Mark-off tool** (create vacancies)
✓ **Complete order of call** (4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7)
✓ **Board rotation** (fair, deterministic)
✓ **Cascade resolution** (auto-fill diversions)
✓ **Pay basis calculation** (ST vs OT)
✓ **Full audit trails** (why each decision)

## What's Missing for Full Production

- Relief line assignments (can skip for POC - EB will cover)
- ATW schedule (can skip for POC - EB will cover)
- Hold-down bidding workflow (can add later)
- Company schedule import/comparison (next major feature)
- Offer/decline workflow (assumes acceptance for now)

## Common Issues

**"No vacancies showing"**
- Run `SELECT * FROM generate_schedule_days(30);`
- Check `SELECT COUNT(*) FROM schedule_slots;`

**"No EB members available"**
- Run setup_extraboard.sql steps
- Verify: `SELECT * FROM v_board_rotation_status;`

**"Algorithm says no eligible candidates"**
- Check qualifications: Employee must be qualified for desk
- Check HOS: Must have 15+ hours rest
- Check availability: Not marked off or on leave

**"Cascade hits max depth"**
- You have a staffing crisis (normal!)
- Too many mark-offs, not enough EB
- This proves the point - shows company is understaffed

## Next Steps After POC

1. **Test with real scenarios** - Mark off people, see cascades
2. **Validate order of call** - Verify algorithm matches contract
3. **Import company schedule** - Build comparison tool
4. **Document violations** - When company deviates from algorithm
5. **Show to union** - Demonstrate contract accountability

## Support

The algorithm is **deterministic and foolproof**:
- Same inputs = same outputs
- No wiggle room
- Full audit trails
- Complete cascade tracking

Every assignment decision can be traced back to:
- Which order of call step was used
- Why that person was chosen
- What the alternatives were
- Whether it's a diversion
- If EB could backfill
- What pay basis applies

**This is your proof that the contract can be algorithmically enforced.**
