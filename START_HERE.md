# START HERE - Complete Setup in 3 Steps

## For People Who Aren't Programmers

This guide gets you running in **under 30 minutes**.

---

## What You're Installing

A tool that:
- Shows who SHOULD cover dispatcher shifts (according to contract rules)
- Proves when the company violates the order of call
- Tracks cascading diversions ("robbing Peter to pay Paul")
- Runs 100% on YOUR computer (no cloud, no accounts)

---

## Step 1: Install Required Software (15 minutes)

### Install Node.js

**What it is:** Software that runs the app

**Windows:**
1. Go to: https://nodejs.org/
2. Click the big green "Download" button (LTS version)
3. Run the downloaded file
4. Click Next → Next → Next → Install → Finish

**Mac:**
1. Go to: https://nodejs.org/
2. Click the big green "Download" button (LTS version)
3. Open the downloaded .pkg file
4. Click Continue → Install → Enter your password → Close

---

### Install PostgreSQL (Database)

**What it is:** Where your data is stored

**Windows:**
1. Go to: https://www.postgresql.org/download/windows/
2. Click "Download the installer"
3. Download version 16
4. Run the installer
5. **IMPORTANT**: When it asks for a password, set it to: `postgres`
6. Click Next through everything else (use defaults)
7. Finish

**Mac (Easiest Way):**
1. Go to: https://postgresapp.com/
2. Click "Downloads"
3. Download "Postgres.app with PostgreSQL 16"
4. Open the downloaded file
5. Drag Postgres.app to your Applications folder
6. Open Postgres.app (it will be in Applications)
7. Click "Initialize" to start the server
8. You should see a green dot and "Running"
9. Done!

---

## Step 2: Download This Project (2 minutes)

**Option A: Download ZIP (Easiest)**
1. On GitHub, click the green "Code" button
2. Click "Download ZIP"
3. Save to your Documents folder
4. Unzip it (double-click the zip file)
5. You'll have a folder called `api-truth-binder-main` or similar
6. Rename it to just `api-truth-binder`

**Option B: Use Git (If You Have It)**
```
cd Documents
git clone YOUR-REPO-URL
cd api-truth-binder
```

---

## Step 3: Run the Setup Script (10 minutes)

This script does EVERYTHING automatically:
- Installs code dependencies
- Creates the database
- Sets up all tables
- Imports your real data

### Windows:

1. Open the `api-truth-binder` folder
2. Find the file `setup-windows.bat`
3. Double-click it
4. When it asks for PostgreSQL password, type: `postgres`
5. Press Enter
6. Wait for it to finish
7. You'll see "Setup Complete! ✓"

### Mac:

1. Open Terminal (Press Command+Space, type "terminal", press Enter)
2. Type: `cd Documents/api-truth-binder`
3. Press Enter
4. Type: `chmod +x setup-mac.sh`
5. Press Enter
6. Type: `./setup-mac.sh`
7. Press Enter
8. Wait for it to finish
9. You'll see "Setup Complete! ✓"

---

## Step 4: Start the App (1 minute)

### Windows:

1. Open Command Prompt (Press Windows key, type "cmd", press Enter)
2. Type: `cd %USERPROFILE%\Documents\api-truth-binder`
3. Press Enter
4. Type: `npm run dev`
5. Press Enter
6. Wait until you see: `Local: http://localhost:5173/`
7. Open Chrome/Firefox/Edge and go to: `http://localhost:5173`

### Mac:

1. Open Terminal
2. Type: `cd ~/Documents/api-truth-binder`
3. Press Enter
4. Type: `npm run dev`
5. Press Enter
6. Wait until you see: `Local: http://localhost:5173/`
7. Open Safari/Chrome/Firefox and go to: `http://localhost:5173`

---

## Step 5: Import Dispatchers (2 minutes)

1. In the app (in your browser), click "Manage Dispatchers" in the sidebar
2. Click the "Import from CSV" button
3. Select the file `dispatchers_complete_real.csv`
4. Click "Import"
5. Wait for it to finish
6. You should see 269 dispatchers listed

---

## Step 6: Set Up Extra Board (5 minutes)

This is the last setup step. You need to tell the system who's on the Extra Board.

### Find Board Members

1. In the app, go to "Manage Dispatchers"
2. Look for dispatchers who DON'T have a job listed
3. Write down 5-10 employee numbers

### Add Them to the Board

**Windows:**
1. Open Command Prompt
2. Type: `psql -U postgres -d noc_dispatch`
3. Enter password: `postgres`
4. You'll see `noc_dispatch=#`

**Mac:**
1. Open Terminal
2. Type: `psql noc_dispatch`
3. You'll see `noc_dispatch=#`

**Copy and paste this** (replace employee numbers with real ones):

```sql
-- Create boards
INSERT INTO boards (code, name, division_id, shift_id, active)
VALUES
  ('GAD-1ST', 'GAD First Shift',
   (SELECT id FROM divisions WHERE code = 'GAD'),
   (SELECT id FROM shifts WHERE code = '1ST'), TRUE)
ON CONFLICT (code) DO NOTHING;

-- Add members (REPLACE with your employee numbers)
WITH gad_eb AS (SELECT id FROM boards WHERE code = 'GAD-1ST'),
     members AS (SELECT id FROM employees WHERE emp_no IN (
       '1111111',
       '2222222',
       '3333333',
       '4444444',
       '5555555'
     ))
INSERT INTO board_memberships (board_id, employee_id, start_date)
SELECT gad_eb.id, members.id, CURRENT_DATE
FROM gad_eb, members;

-- Initialize rotation
SELECT initialize_board_rotation(id) FROM boards;

-- Set eligibility
UPDATE employees SET is_board_eligible = TRUE
WHERE EXISTS (SELECT 1 FROM board_memberships bm WHERE bm.employee_id = employees.id);

UPDATE employees SET is_board_eligible = FALSE
WHERE EXISTS (SELECT 1 FROM job_ownerships jo WHERE jo.employee_id = employees.id AND jo.end_date IS NULL);

-- Generate schedule (30 days)
SELECT * FROM generate_schedule_days(30);
```

Press Enter. You should see:
```
 slots_created | assignments_created
---------------+--------------------
          3990 |                2800
```

Type `\q` and press Enter to exit.

---

## You're Done! Test It

### Go back to the app in your browser

**Test 1: View Vacancies**
1. Click "Vacancy Checker"
2. You should see about 1,100 open shifts (rest days)
3. Click any vacancy
4. See who the algorithm says should cover it
5. Turn on "Show Full Cascade" to see diversions

**Test 2: Mark Someone Off**
1. Click "Mark-Off Tool"
2. Select yourself (or any dispatcher)
3. Pick tomorrow's date
4. Select "SICK"
5. Click "Mark Off & Run Algorithm"
6. See the vacancy created
7. See who should cover it
8. See if it creates a cascade (diversion chain)

---

## Daily Use

**To start the app each day:**
1. Make sure Postgres is running (Mac: Postgres.app shows green)
2. Open Terminal/Command Prompt
3. Go to project folder: `cd Documents/api-truth-binder`
4. Type: `npm run dev`
5. Open browser to: `http://localhost:5173`

**To stop the app:**
- Press Ctrl+C in the Terminal/Command Prompt window

---

## If Something Goes Wrong

**"npm: command not found"**
- Restart Terminal/Command Prompt after installing Node.js
- Or Node.js didn't install correctly - try again

**"psql: command not found"** (Windows)
- PostgreSQL didn't add itself to PATH
- Manually add: `C:\Program Files\PostgreSQL\16\bin` to your PATH
- Or use full path: `"C:\Program Files\PostgreSQL\16\bin\psql"`

**"Can't connect to database"**
- Windows: Make sure PostgreSQL service is running (check Services)
- Mac: Make sure Postgres.app shows "Running" with green dot

**"No vacancies showing"**
- You forgot to run: `SELECT * FROM generate_schedule_days(30);`
- In psql, run that command

**"Algorithm says no eligible candidates"**
- No Extra Board members set up
- Run the board setup SQL from Step 6 again

---

## What This Does

The algorithm follows the exact contract order of call:
1. Check Extra Board (fair rotation)
2. Offer to incumbent on rest day (overtime)
3. Offer to senior dispatchers on rest day (overtime)
4. Divert junior dispatcher from same shift (with EB backfill)
5. Divert junior dispatcher (no EB - creates cascade)
6. Divert senior from different shift (overtime)
7. Least overtime cost fallback

**It's deterministic** - same inputs always give same result.
**It's auditable** - shows why each decision was made.
**It's local** - everything on your computer.

You can now **prove** when the company violates the contract.

---

## Need More Help?

See these files:
- `LOCAL_SETUP_SIMPLE.md` - More detailed setup instructions
- `PROOF_OF_CONCEPT_QUICKSTART.md` - How to use advanced features
- `BEGINNER_SETUP_GUIDE.md` - Even more beginner-friendly version

All data files you need are included:
- ✓ `dispatchers_complete_real.csv` (269 dispatchers)
- ✓ `real_desks_migration.sql` (16 desks)
- ✓ `tricks_with_real_rest_days.sql` (133 tricks)
- ✓ `job_ownerships_real.sql` (133 current job assignments)
