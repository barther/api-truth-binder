# Complete Setup Guide for Non-Technical Users
## Running NOC Dispatch Scheduler on Your Own Computer

This guide assumes you know nothing about programming. Follow each step exactly.

---

## What You're Installing

1. **Node.js** - Software that runs JavaScript code on your computer
2. **PostgreSQL** - Database to store dispatcher data
3. **Git** - Tool to download the code
4. **The App** - The actual scheduling tool

---

## Part 1: Install Required Software

### Step 1: Install Node.js

**Windows:**
1. Go to https://nodejs.org/
2. Click the big green button that says "Download Node.js (LTS)"
3. Run the downloaded file (node-v20.x.x-x64.msi)
4. Click "Next" through all the prompts
5. Click "Install"
6. Click "Finish"

**Mac:**
1. Go to https://nodejs.org/
2. Click the big green button that says "Download Node.js (LTS)"
3. Open the downloaded .pkg file
4. Click "Continue" through all the prompts
5. Click "Install"
6. Enter your Mac password when prompted

**Verify it worked:**
1. Open Command Prompt (Windows) or Terminal (Mac)
   - Windows: Press Windows Key, type "cmd", press Enter
   - Mac: Press Command+Space, type "terminal", press Enter
2. Type: `node --version`
3. Press Enter
4. You should see something like "v20.11.0"

---

### Step 2: Install PostgreSQL Database

**Windows:**
1. Go to https://www.postgresql.org/download/windows/
2. Click "Download the installer"
3. Click the latest version (16.x)
4. Run the downloaded file
5. Click "Next" until you get to "Password"
6. **IMPORTANT**: Set password to `postgres123` (write this down!)
7. Keep clicking "Next" (use default port 5432)
8. Click "Finish"

**Mac:**
1. Go to https://postgresapp.com/
2. Click "Download"
3. Open the downloaded file
4. Drag Postgres.app to Applications folder
5. Open Postgres.app
6. Click "Initialize" to create a server
7. That's it - it's running!

**Verify it worked:**

Windows:
1. Open Command Prompt
2. Type: `psql --version`
3. You should see "psql (PostgreSQL) 16.x"

Mac:
1. Postgres.app should show a green indicator saying "Running"

---

### Step 3: Install Git

**Windows:**
1. Go to https://git-scm.com/download/win
2. Download will start automatically
3. Run the downloaded file
4. Click "Next" through everything (use defaults)
5. Click "Install"
6. Click "Finish"

**Mac:**
1. Open Terminal
2. Type: `git --version`
3. If it says "command not found":
   - Type: `xcode-select --install`
   - Click "Install" in the popup
   - Wait for it to finish

**Verify it worked:**
1. Open Command Prompt/Terminal
2. Type: `git --version`
3. You should see "git version 2.x.x"

---

## Part 2: Download and Set Up the App

### Step 1: Download the Code

1. Open Command Prompt/Terminal
2. Navigate to where you want the files (example: your Documents folder)
   - Windows: Type `cd %USERPROFILE%\Documents`
   - Mac: Type `cd ~/Documents`
3. Download the code:
   ```
   git clone https://github.com/YOUR-GITHUB-USERNAME/api-truth-binder.git
   ```
   (Replace YOUR-GITHUB-USERNAME with your actual GitHub username)
4. Go into the folder:
   ```
   cd api-truth-binder
   ```

---

### Step 2: Install App Dependencies

Still in Command Prompt/Terminal:

1. Type: `npm install`
2. Press Enter
3. Wait (this takes 2-5 minutes - you'll see lots of text scrolling)
4. When it's done, you'll see the prompt again

---

### Step 3: Set Up the Database

**Create the database:**

Windows:
1. Open Command Prompt as Administrator
   - Press Windows Key
   - Type "cmd"
   - Right-click "Command Prompt"
   - Click "Run as administrator"
2. Type: `psql -U postgres`
3. Enter the password you set earlier (`postgres123`)
4. You should see `postgres=#` prompt
5. Type: `CREATE DATABASE noc_dispatch;`
6. Press Enter
7. Type: `\q` to quit

Mac (with Postgres.app):
1. Open Terminal
2. Type: `psql`
3. You should see a prompt
4. Type: `CREATE DATABASE noc_dispatch;`
5. Press Enter
6. Type: `\q` to quit

**Run the migrations (set up tables):**

1. In your project folder (api-truth-binder), type:
   ```
   psql -U postgres -d noc_dispatch -f supabase/migrations/20251113000000_complete_schema.sql
   ```
2. Enter password if asked
3. Wait for it to finish
4. Repeat for EACH migration file in order:
   ```
   psql -U postgres -d noc_dispatch -f supabase/migrations/20251113000001_helper_functions.sql
   psql -U postgres -d noc_dispatch -f supabase/migrations/20251114000000_diversion_logic.sql
   psql -U postgres -d noc_dispatch -f supabase/migrations/20251114000001_order_of_call.sql
   psql -U postgres -d noc_dispatch -f supabase/migrations/20251114000002_cascade_and_rotation.sql
   psql -U postgres -d noc_dispatch -f supabase/migrations/20251114000003_order_of_call_with_rotation.sql
   psql -U postgres -d noc_dispatch -f supabase/migrations/20251114000004_schedule_generator.sql
   ```

---

### Step 4: Configure the App to Use Your Database

1. In the project folder, find the file `.env.example`
2. Make a copy and rename it to `.env`
3. Open `.env` in Notepad (Windows) or TextEdit (Mac)
4. Change this line:
   ```
   DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/noc_dispatch
   ```
   (Use the password you set in Step 2)
5. Save and close

---

### Step 5: Import Your Real Data

**Import desks:**
```
psql -U postgres -d noc_dispatch -f real_desks_migration.sql
```

**Import tricks:**
```
psql -U postgres -d noc_dispatch -f tricks_with_real_rest_days.sql
```

**Import job ownerships:**
```
psql -U postgres -d noc_dispatch -f job_ownerships_real.sql
```

**Import dispatchers** (we'll use the web interface for this - easier):
- We'll do this after starting the app

---

## Part 3: Run the App

### Step 1: Start the App

1. In Command Prompt/Terminal, make sure you're in the api-truth-binder folder
2. Type: `npm run dev`
3. Press Enter
4. Wait until you see:
   ```
   Local:   http://localhost:5173/
   ```
5. **DON'T CLOSE THIS WINDOW** - keep it running

---

### Step 2: Open in Your Browser

1. Open Chrome, Firefox, or Edge
2. Go to: `http://localhost:5173`
3. You should see the app!

---

### Step 3: Import Dispatchers

1. In the app, click "Manage Dispatchers" in the sidebar
2. Click "Import from CSV"
3. Select your `dispatchers_complete_real.csv` file
4. Click "Import"
5. Wait - should import 269 dispatchers

---

## Part 4: Set Up Extra Board

This part requires using the database directly. Don't worry - I'll give you exact commands to copy/paste.

### Step 1: Open Database Terminal

1. Open a NEW Command Prompt/Terminal window (keep the app running in the other one)
2. Type: `psql -U postgres -d noc_dispatch`
3. Press Enter
4. Enter password

You should see: `noc_dispatch=#`

---

### Step 2: Create Boards

Copy and paste this ENTIRE block, then press Enter:

```sql
-- Create GAD boards for each shift
INSERT INTO boards (code, name, division_id, shift_id, active)
VALUES
  ('GAD-1ST', 'GAD First Shift Board',
   (SELECT id FROM divisions WHERE code = 'GAD'),
   (SELECT id FROM shifts WHERE code = '1ST'),
   TRUE),
  ('GAD-2ST', 'GAD Second Shift Board',
   (SELECT id FROM divisions WHERE code = 'GAD'),
   (SELECT id FROM shifts WHERE code = '2ST'),
   TRUE),
  ('GAD-3ST', 'GAD Third Shift Board',
   (SELECT id FROM divisions WHERE code = 'GAD'),
   (SELECT id FROM shifts WHERE code = '3ST'),
   TRUE)
ON CONFLICT (code) DO NOTHING;
```

---

### Step 3: Find Dispatchers Without Jobs (These Go on the Board)

Copy/paste this:

```sql
SELECT emp_no, last_name, first_name, seniority_date
FROM employees
WHERE NOT EXISTS (
  SELECT 1 FROM job_ownerships jo
  WHERE jo.employee_id = employees.id AND jo.end_date IS NULL
)
AND status = 'ACTIVE'
ORDER BY seniority_date
LIMIT 20;
```

This shows you 20 dispatchers who don't own jobs (board members).

**Write down some employee numbers** - you'll use these next.

---

### Step 4: Assign Board Members

Replace the employee numbers below with real ones from Step 3:

```sql
-- Add members to GAD First Shift board
WITH gad_1st AS (
  SELECT id FROM boards WHERE code = 'GAD-1ST' LIMIT 1
),
members AS (
  SELECT id FROM employees WHERE emp_no IN (
    '1111111',  -- REPLACE with real emp numbers
    '2222222',
    '3333333',
    '4444444',
    '5555555'
  )
)
INSERT INTO board_memberships (board_id, employee_id, start_date)
SELECT gad_1st.id, members.id, CURRENT_DATE
FROM gad_1st, members
ON CONFLICT DO NOTHING;
```

**Repeat for each shift** (GAD-2ST, GAD-3ST) with different employee numbers.

---

### Step 5: Initialize Rotation

Copy/paste this:

```sql
-- Set rotation positions for each board
SELECT initialize_board_rotation(id) FROM boards WHERE active = TRUE;
```

---

### Step 6: Set Board Eligibility Flags

Copy/paste this:

```sql
-- Mark board members as eligible
UPDATE employees e
SET is_board_eligible = TRUE
WHERE EXISTS (
  SELECT 1 FROM board_memberships bm
  WHERE bm.employee_id = e.id AND bm.end_date IS NULL
);

-- Mark job owners as NOT eligible
UPDATE employees e
SET is_board_eligible = FALSE
WHERE EXISTS (
  SELECT 1 FROM job_ownerships jo
  WHERE jo.employee_id = e.id AND jo.end_date IS NULL
);
```

---

### Step 7: Generate Schedule

Copy/paste this:

```sql
SELECT * FROM generate_schedule_days(30);
```

This creates 30 days of schedule. Wait about 30 seconds.

You should see:
```
 slots_created | assignments_created
---------------+--------------------
          3990 |                2856
```

---

### Step 8: Exit Database

Type: `\q` and press Enter

---

## Part 5: Test It!

### Go back to your browser (http://localhost:5173)

**Test 1: Check Vacancies**
1. Click "Vacancy Checker"
2. You should see ~1,100 vacancies (rest days)
3. Click any vacancy
4. See who the algorithm recommends

**Test 2: Mark Someone Off**
1. Click "Mark-Off Tool"
2. Select yourself (or any dispatcher)
3. Select tomorrow's date
4. Select "SICK"
5. Click "Mark Off & Run Algorithm"
6. See the vacancy and recommendation
7. Toggle "Show Full Cascade" to see diversion chains

---

## Troubleshooting

**"Can't connect to database"**
- Make sure PostgreSQL is running
  - Windows: Check Services (postgres should be running)
  - Mac: Make sure Postgres.app shows "Running"

**"npm: command not found"**
- Restart Command Prompt/Terminal after installing Node.js
- Make sure Node.js installed correctly

**"No vacancies showing"**
- Make sure you ran: `SELECT * FROM generate_schedule_days(30);`
- Check that you imported job ownerships

**"No EB members available"**
- Make sure you completed Part 4 (Extra Board setup)
- Verify: `SELECT COUNT(*) FROM board_memberships;` should show numbers

**App won't start**
- Make sure you ran `npm install`
- Check .env file has correct database password
- Try closing and reopening Command Prompt/Terminal

---

## Daily Usage

**To start the app:**
1. Make sure PostgreSQL is running
2. Open Command Prompt/Terminal
3. Go to project folder: `cd Documents/api-truth-binder`
4. Type: `npm run dev`
5. Open browser to: `http://localhost:5173`

**To stop the app:**
- In the Command Prompt/Terminal window, press Ctrl+C

---

## Getting Help

**Check if database is running:**
```
psql -U postgres -d noc_dispatch -c "SELECT COUNT(*) FROM employees;"
```
Should show 269

**Check if boards are set up:**
```
psql -U postgres -d noc_dispatch -c "SELECT code, COUNT(bm.id) as members FROM boards b LEFT JOIN board_memberships bm ON bm.board_id = b.id GROUP BY b.code;"
```
Should show boards with member counts

**See recent vacancies:**
```
psql -U postgres -d noc_dispatch -c "SELECT COUNT(*) FROM v_vacancies;"
```
Should show ~1,100

---

## What's Next?

Once you have it running:
1. Test mark-offs with real scenarios
2. Verify algorithm matches your contract rules
3. Show it to your union
4. Start documenting when the company violates the order of call

The algorithm is deterministic - same input always gives same output. You can prove what SHOULD happen according to the contract.
