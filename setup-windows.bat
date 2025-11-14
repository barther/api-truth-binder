@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================
echo   NOC Dispatch Scheduler - Windows Setup
echo ============================================
echo.
echo This will install everything you need.
echo.
pause

:: Check for Node.js
echo Checking for Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org/
    echo 2. Download the LTS version
    echo 3. Run the installer
    echo 4. Restart this script
    echo.
    pause
    exit /b 1
)
echo ✓ Node.js is installed
echo.

:: Check for PostgreSQL
echo Checking for PostgreSQL...
psql --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: PostgreSQL is not installed!
    echo.
    echo Please install PostgreSQL first:
    echo 1. Go to https://www.postgresql.org/download/windows/
    echo 2. Download the installer
    echo 3. Run it and set password to: postgres
    echo 4. Restart this script
    echo.
    pause
    exit /b 1
)
echo ✓ PostgreSQL is installed
echo.

:: Install npm packages
echo Installing dependencies (this takes a few minutes)...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

:: Create database
echo Creating database...
echo You'll be asked for the PostgreSQL password you set during install
echo (If you followed the instructions, it should be: postgres)
echo.
psql -U postgres -c "DROP DATABASE IF EXISTS noc_dispatch;" 2>nul
psql -U postgres -c "CREATE DATABASE noc_dispatch;"
if errorlevel 1 (
    echo ERROR: Failed to create database
    echo Make sure you entered the correct PostgreSQL password
    pause
    exit /b 1
)
echo ✓ Database created
echo.

:: Run migrations
echo Setting up database tables (7 steps)...
echo.
echo [1/7] Creating base schema...
psql -U postgres -d noc_dispatch -f supabase/migrations/20251113000000_complete_schema.sql >nul 2>&1
if errorlevel 1 goto migration_error

echo [2/7] Adding helper functions...
psql -U postgres -d noc_dispatch -f supabase/migrations/20251113000001_helper_functions.sql >nul 2>&1
if errorlevel 1 goto migration_error

echo [3/7] Adding diversion logic...
psql -U postgres -d noc_dispatch -f supabase/migrations/20251114000000_diversion_logic.sql >nul 2>&1
if errorlevel 1 goto migration_error

echo [4/7] Setting up order of call...
psql -U postgres -d noc_dispatch -f supabase/migrations/20251114000001_order_of_call.sql >nul 2>&1
if errorlevel 1 goto migration_error

echo [5/7] Adding cascade resolution...
psql -U postgres -d noc_dispatch -f supabase/migrations/20251114000002_cascade_and_rotation.sql >nul 2>&1
if errorlevel 1 goto migration_error

echo [6/7] Finalizing order of call...
psql -U postgres -d noc_dispatch -f supabase/migrations/20251114000003_order_of_call_with_rotation.sql >nul 2>&1
if errorlevel 1 goto migration_error

echo [7/7] Adding schedule generator...
psql -U postgres -d noc_dispatch -f supabase/migrations/20251114000004_schedule_generator.sql >nul 2>&1
if errorlevel 1 goto migration_error

echo ✓ All migrations complete
echo.

:: Import real data
echo Importing real data...
echo.
echo - Importing desks...
psql -U postgres -d noc_dispatch -f real_desks_migration.sql >nul 2>&1
if errorlevel 1 goto import_error

echo - Importing tricks...
psql -U postgres -d noc_dispatch -f tricks_with_real_rest_days.sql >nul 2>&1
if errorlevel 1 goto import_error

echo - Importing job ownerships...
psql -U postgres -d noc_dispatch -f job_ownerships_real.sql >nul 2>&1
if errorlevel 1 goto import_error

echo ✓ Data imported
echo.

:: Success message
echo.
echo ============================================
echo   Setup Complete! ✓
echo ============================================
echo.
echo NEXT STEPS:
echo.
echo 1. Start the app:
echo    npm run dev
echo.
echo 2. Open your browser to:
echo    http://localhost:5173
echo.
echo 3. Import dispatchers:
echo    - Click "Manage Dispatchers"
echo    - Click "Import from CSV"
echo    - Select dispatchers_complete_real.csv
echo.
echo 4. Set up Extra Board:
echo    - See LOCAL_SETUP_SIMPLE.md for instructions
echo.
echo Press any key to exit...
pause >nul
exit /b 0

:migration_error
echo.
echo ERROR: Failed to run database migrations
echo Check that PostgreSQL is running and you entered the correct password
pause
exit /b 1

:import_error
echo.
echo ERROR: Failed to import data files
echo Make sure the data files exist in the project folder
pause
exit /b 1
