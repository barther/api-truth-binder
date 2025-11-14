# Simple Local Setup - Everything on Your Computer
## No Cloud, No Accounts, Just Your Own Machine

---

## The Easiest Way (All-in-One Package)

I'm going to give you the **absolute simplest** way to run this on your computer.

### What You Need

Just **3 things**:
1. **Node.js** - Runs the code
2. **PostgreSQL** - Stores the data
3. **This project** - The scheduling tool

---

## Step-by-Step Setup

### Part 1: Install Node.js

**Windows:**
1. Go to https://nodejs.org/
2. Download the LTS version (big green button)
3. Run the installer
4. Click Next → Next → Install → Finish

**Mac:**
1. Go to https://nodejs.org/
2. Download the LTS version
3. Open the .pkg file
4. Click Continue → Install → Enter your password

**Test it worked:**
- Open Terminal (Mac) or Command Prompt (Windows)
- Type: `node --version`
- Should show: `v20.something`

---

### Part 2: Install PostgreSQL

**Windows (Easy Way):**
1. Download: https://www.postgresql.org/download/windows/
2. Run the installer
3. Set password: `postgres` (simple, easy to remember)
4. Use port: `5432` (default)
5. Finish installation

**Mac (Easiest Way - Postgres.app):**
1. Download: https://postgresapp.com/
2. Drag to Applications
3. Open Postgres.app
4. Click "Initialize"
5. That's it!

**Test it worked:**

Windows:
```
psql --version
```

Mac:
```
psql --version
```

Should show: `psql (PostgreSQL) 16.x`

---

### Part 3: Get the Code

**Option A: Download ZIP (Easiest)**
1. Go to your GitHub repository
2. Click green "Code" button
3. Click "Download ZIP"
4. Unzip to your Documents folder

**Option B: Use Git**
1. Open Terminal/Command Prompt
2. Type: `cd Documents`
3. Type: `git clone YOUR-REPO-URL`

---

### Part 4: One-Command Setup

I'm going to create a setup script that does EVERYTHING for you.

**For Windows:**

Create a file called `setup.bat` in the project folder with this content:

```batch
@echo off
echo ========================================
echo NOC Dispatch Scheduler Setup
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
if errorlevel 1 goto error

echo.
echo Step 2: Creating database...
psql -U postgres -c "DROP DATABASE IF EXISTS noc_dispatch;"
psql -U postgres -c "CREATE DATABASE noc_dispatch;"
if errorlevel 1 goto error

echo.
echo Step 3: Setting up tables...
psql -U postgres -d noc_dispatch -f supabase/migrations/20251113000000_complete_schema.sql
psql -U postgres -d noc_dispatch -f supabase/migrations/20251113000001_helper_functions.sql
psql -U postgres -d noc_dispatch -f supabase/migrations/20251114000000_diversion_logic.sql
psql -U postgres -d noc_dispatch -f supabase/migrations/20251114000001_order_of_call.sql
psql -U postgres -d noc_dispatch -f supabase/migrations/20251114000002_cascade_and_rotation.sql
psql -U postgres -d noc_dispatch -f supabase/migrations/20251114000003_order_of_call_with_rotation.sql
psql -U postgres -d noc_dispatch -f supabase/migrations/20251114000004_schedule_generator.sql

echo.
echo Step 4: Importing real data...
psql -U postgres -d noc_dispatch -f real_desks_migration.sql
psql -U postgres -d noc_dispatch -f tricks_with_real_rest_days.sql
psql -U postgres -d noc_dispatch -f job_ownerships_real.sql

echo.
echo ========================================
echo Setup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm run dev
echo 2. Open: http://localhost:5173
echo 3. Go to Manage Dispatchers
echo 4. Import dispatchers_complete_real.csv
echo.
pause
goto end

:error
echo.
echo ERROR: Setup failed!
echo Make sure PostgreSQL is installed and running.
pause

:end
```

**To run it:**
1. Double-click `setup.bat`
2. Enter your postgres password when asked
3. Wait for it to finish
4. Done!

**For Mac/Linux:**

Create a file called `setup.sh` with this content:

```bash
#!/bin/bash

echo "========================================"
echo "NOC Dispatch Scheduler Setup"
echo "========================================"
echo

echo "Step 1: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: npm install failed"
    exit 1
fi

echo
echo "Step 2: Creating database..."
psql -c "DROP DATABASE IF EXISTS noc_dispatch;"
psql -c "CREATE DATABASE noc_dispatch;"

echo
echo "Step 3: Setting up tables..."
psql -d noc_dispatch -f supabase/migrations/20251113000000_complete_schema.sql
psql -d noc_dispatch -f supabase/migrations/20251113000001_helper_functions.sql
psql -d noc_dispatch -f supabase/migrations/20251114000000_diversion_logic.sql
psql -d noc_dispatch -f supabase/migrations/20251114000001_order_of_call.sql
psql -d noc_dispatch -f supabase/migrations/20251114000002_cascade_and_rotation.sql
psql -d noc_dispatch -f supabase/migrations/20251114000003_order_of_call_with_rotation.sql
psql -d noc_dispatch -f supabase/migrations/20251114000004_schedule_generator.sql

echo
echo "Step 4: Importing real data..."
psql -d noc_dispatch -f real_desks_migration.sql
psql -d noc_dispatch -f tricks_with_real_rest_days.sql
psql -d noc_dispatch -f job_ownerships_real.sql

echo
echo "========================================"
echo "Setup complete!"
echo "========================================"
echo
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:5173"
echo "3. Go to Manage Dispatchers"
echo "4. Import dispatchers_complete_real.csv"
echo
```

**To run it:**
```bash
chmod +x setup.sh
./setup.sh
```

---

### Part 5: Start the App

**After setup completes:**

1. Open Terminal/Command Prompt
2. Go to project folder:
   - Windows: `cd %USERPROFILE%\Documents\api-truth-binder`
   - Mac: `cd ~/Documents/api-truth-binder`
3. Type: `npm run dev`
4. Wait until you see: `Local: http://localhost:5173/`
5. Open your browser to that address

---

### Part 6: Import Dispatchers

1. In the app, click "Manage Dispatchers"
2. Click "Import from CSV"
3. Select `dispatchers_complete_real.csv`
4. Wait for import to complete

---

### Part 7: Set Up Extra Board (One-Time)

Create a file called `setup_board.sql` with this:

```sql
-- Create boards
INSERT INTO boards (code, name, division_id, shift_id, active)
VALUES
  ('GAD-1ST', 'GAD First Shift',
   (SELECT id FROM divisions WHERE code = 'GAD'),
   (SELECT id FROM shifts WHERE code = '1ST'), TRUE),
  ('GAD-2ST', 'GAD Second Shift',
   (SELECT id FROM divisions WHERE code = 'GAD'),
   (SELECT id FROM shifts WHERE code = '2ST'), TRUE),
  ('GAD-3ST', 'GAD Third Shift',
   (SELECT id FROM divisions WHERE code = 'GAD'),
   (SELECT id FROM shifts WHERE code = '3ST'), TRUE)
ON CONFLICT (code) DO NOTHING;

-- Add board members (REPLACE these employee numbers with real ones)
WITH board_1st AS (SELECT id FROM boards WHERE code = 'GAD-1ST'),
     members AS (SELECT id FROM employees WHERE emp_no IN (
       '1234567', '2345678', '3456789', '4567890', '5678901'
     ))
INSERT INTO board_memberships (board_id, employee_id, start_date)
SELECT board_1st.id, members.id, CURRENT_DATE
FROM board_1st, members ON CONFLICT DO NOTHING;

-- Initialize rotation
SELECT initialize_board_rotation(id) FROM boards;

-- Set eligibility flags
UPDATE employees e SET is_board_eligible = TRUE
WHERE EXISTS (SELECT 1 FROM board_memberships bm WHERE bm.employee_id = e.id AND bm.end_date IS NULL);

UPDATE employees e SET is_board_eligible = FALSE
WHERE EXISTS (SELECT 1 FROM job_ownerships jo WHERE jo.employee_id = e.id AND jo.end_date IS NULL);

-- Generate 30 days of schedule
SELECT * FROM generate_schedule_days(30);
```

**Run it:**
```
psql -U postgres -d noc_dispatch -f setup_board.sql
```

(On Windows, it will ask for password: `postgres`)

---

## You're Done!

### To use it daily:

**Start the app:**
```
npm run dev
```

**Stop the app:**
Press `Ctrl+C` in the terminal

### What works:
✓ Vacancy Checker - See who should cover open shifts
✓ Mark-Off Tool - Create absences, see cascades
✓ Dispatcher Roster - View seniority rankings
✓ Full algorithm with order of call
✓ Cascade resolution (diversions)
✓ Audit trails

---

## Troubleshooting

**"psql: command not found"**
- Windows: Add PostgreSQL to PATH
  - Find where PostgreSQL installed (usually C:\Program Files\PostgreSQL\16\bin)
  - Add that folder to your PATH environment variable

**"npm: command not found"**
- Restart terminal after installing Node.js

**"Port 5173 already in use"**
- Something else is using that port
- Stop it or change port in vite.config.ts

**"Can't connect to database"**
- Make sure PostgreSQL is running
  - Windows: Check Services
  - Mac: Make sure Postgres.app is running

---

## Need Help?

**Check if database has data:**
```
psql -U postgres -d noc_dispatch -c "SELECT COUNT(*) FROM employees;"
```
Should show 269

**See vacancies:**
```
psql -U postgres -d noc_dispatch -c "SELECT COUNT(*) FROM v_vacancies;"
```
Should show ~1,100

**See board members:**
```
psql -U postgres -d noc_dispatch -c "SELECT COUNT(*) FROM board_memberships;"
```
Should show numbers

---

## This is 100% Local

- No cloud services
- No accounts needed
- No internet required (after initial install)
- All data stays on YOUR computer
- You control everything

The database is in PostgreSQL on your machine. The app runs in your browser but connects to your local database. Nothing leaves your computer.
