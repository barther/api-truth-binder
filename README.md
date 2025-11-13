# Union Contract Checker - NOC Dispatch Scheduler

A tool to verify that dispatcher assignments follow contract rules with no guesswork. Built for union accountability.

## What This Does

This tool helps you:
1. **Check who should be assigned to a vacancy** - The algorithm follows contract seniority rules
2. **See seniority rankings** - Shows the exact order based on contract rules
3. **Run "what-if" scenarios** - Mark people off and see who should cover

## Contract Rules Enforced

The system follows these rules in order:

1. **Incumbent** - Person who owns the job
2. **Hold-down** - Temporary job holder
3. **Relief Line** - Pattern-based coverage
4. **ATW (Around The World)** - Third shift rotation
5. **Board (Extraboard)** - Overtime pool

Within each level, seniority determines who gets picked.

## Setup Instructions

### Step 1: Set up the Database

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `rxvptkcgqftxfishbuta`
3. Open the SQL Editor
4. Copy and paste the contents of `setup_database.sql` and run it
5. This creates all tables, rules, and sample data

### Step 2: Run the App

```bash
npm install
npm run dev
```

Open http://localhost:5173

## How to Use

### Check Vacancies

1. Go to "Vacancy Checker" (home page)
2. You'll see any open slots that need coverage
3. Click on a vacancy to see **who the algorithm says should be assigned**
4. The system shows:
   - **Recommended person** with their seniority rank
   - **Why they were chosen** (incumbent, seniority, etc.)
   - **Rule checks** (qualified, HOS compliance, available)
   - **Alternative candidates** if the first choice isn't available

### View Seniority

1. Go to "Dispatcher Roster"
2. See the complete seniority list
3. This shows the exact order for job awards and board calls

### Run Scenarios

To test "what if someone calls off":

1. In your Supabase SQL Editor, add a mark-off:
   ```sql
   INSERT INTO mark_offs (employee_id, the_date, reason)
   VALUES (
     (SELECT id FROM employees WHERE emp_no = '1002'),
     CURRENT_DATE + 1,
     'SICK'
   );
   ```
2. Refresh the vacancy checker
3. You'll now see a vacancy for that person's shift
4. Click it to see who should cover according to contract rules

## Sample Data Included

The system comes with:
- 12 sample dispatchers with realistic seniority dates
- 4 desks (EE3, CN3, BT2, WS1) in Coastal division
- Qualifications showing who can work which desks
- 4 job ownerships (regular assignments)
- An extraboard (COA-3RD-XB) with 5 members
- 14 days of schedule slots

## Understanding the Algorithm

When you click on a vacancy, the algorithm:

1. **Finds all potential candidates** from these sources:
   - Incumbent (if returning from temporary absence)
   - Hold-down owner
   - Relief line pattern
   - ATW assignment
   - Board members

2. **Checks eligibility**:
   - ✅ Qualified for the desk
   - ✅ HOS compliant (15+ hours rest)
   - ✅ Not marked off or on leave

3. **Ranks by priority**:
   - Band (incumbent > hold-down > relief > ATW > board)
   - Seniority within each band
   - Employee number for ties

4. **Shows you the answer** with complete explanation

## Comparing with Company Decisions

To check if the company followed the rules:

1. See what the algorithm recommends
2. Compare with who the company actually assigned
3. If they differ, the algorithm will show why (seniority, qualifications, etc.)

## Key Files

- `setup_database.sql` - Complete database setup (run this first!)
- `supabase/migrations/` - Individual migration files (same content as setup_database.sql)
- `supabase/functions/coverage-engine/` - The algorithm that picks candidates
- `supabase/functions/apply-assignment/` - Function to apply an assignment
- `src/pages/VacancyChecker.tsx` - UI to check vacancies
- `src/pages/DispatcherRoster.tsx` - Seniority list

## Need Help?

The algorithm is based on the complete specification in the original requirements document. All business rules (seniority, HOS, qualifications, hold-downs, etc.) are enforced automatically.

## Technical Notes

- **Database**: PostgreSQL (via Supabase)
- **Backend**: Supabase Edge Functions (TypeScript/Deno)
- **Frontend**: React + Tailwind CSS
- **Time Handling**: All times stored in UTC, displayed in local timezone
- **HOS Rule**: Minimum 15 hours rest between duty periods (configurable in `config` table)
