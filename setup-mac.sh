#!/bin/bash

echo ""
echo "============================================"
echo "  NOC Dispatch Scheduler - Mac/Linux Setup"
echo "============================================"
echo ""
echo "This will install everything you need."
echo ""
read -p "Press Enter to continue..."

# Check for Node.js
echo ""
echo "Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed!"
    echo ""
    echo "Please install Node.js first:"
    echo "1. Go to https://nodejs.org/"
    echo "2. Download the LTS version"
    echo "3. Run the installer"
    echo "4. Restart this script"
    echo ""
    exit 1
fi
echo "✓ Node.js is installed ($(node --version))"

# Check for PostgreSQL
echo ""
echo "Checking for PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "❌ ERROR: PostgreSQL is not installed!"
    echo ""
    echo "Mac: Download Postgres.app from https://postgresapp.com/"
    echo "Linux: Run: sudo apt-get install postgresql"
    echo ""
    echo "Then restart this script"
    echo ""
    exit 1
fi
echo "✓ PostgreSQL is installed ($(psql --version))"

# Install npm packages
echo ""
echo "Installing dependencies (this takes a few minutes)..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to install dependencies"
    exit 1
fi
echo "✓ Dependencies installed"

# Create database
echo ""
echo "Creating database..."
echo ""

# Try with current user first (Postgres.app style)
psql -c "DROP DATABASE IF EXISTS noc_dispatch;" 2>/dev/null
psql -c "CREATE DATABASE noc_dispatch;" 2>/dev/null

# If that failed, try with postgres user
if [ $? -ne 0 ]; then
    echo "Trying with postgres user..."
    psql -U postgres -c "DROP DATABASE IF EXISTS noc_dispatch;" 2>/dev/null
    psql -U postgres -c "CREATE DATABASE noc_dispatch;"
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to create database"
        echo "Make sure PostgreSQL is running"
        exit 1
    fi
    PSQL_CMD="psql -U postgres"
else
    PSQL_CMD="psql"
fi

echo "✓ Database created"

# Run migrations
echo ""
echo "Setting up database tables (7 steps)..."
echo ""

echo "[1/7] Creating base schema..."
$PSQL_CMD -d noc_dispatch -f supabase/migrations/20251113000000_complete_schema.sql > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to run migration 1"
    exit 1
fi

echo "[2/7] Adding helper functions..."
$PSQL_CMD -d noc_dispatch -f supabase/migrations/20251113000001_helper_functions.sql > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to run migration 2"
    exit 1
fi

echo "[3/7] Adding diversion logic..."
$PSQL_CMD -d noc_dispatch -f supabase/migrations/20251114000000_diversion_logic.sql > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to run migration 3"
    exit 1
fi

echo "[4/7] Setting up order of call..."
$PSQL_CMD -d noc_dispatch -f supabase/migrations/20251114000001_order_of_call.sql > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to run migration 4"
    exit 1
fi

echo "[5/7] Adding cascade resolution..."
$PSQL_CMD -d noc_dispatch -f supabase/migrations/20251114000002_cascade_and_rotation.sql > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to run migration 5"
    exit 1
fi

echo "[6/7] Finalizing order of call..."
$PSQL_CMD -d noc_dispatch -f supabase/migrations/20251114000003_order_of_call_with_rotation.sql > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to run migration 6"
    exit 1
fi

echo "[7/7] Adding schedule generator..."
$PSQL_CMD -d noc_dispatch -f supabase/migrations/20251114000004_schedule_generator.sql > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to run migration 7"
    exit 1
fi

echo "✓ All migrations complete"

# Import real data
echo ""
echo "Importing real data..."
echo ""

echo "- Importing desks..."
$PSQL_CMD -d noc_dispatch -f real_desks_migration.sql > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to import desks"
    exit 1
fi

echo "- Importing tricks..."
$PSQL_CMD -d noc_dispatch -f tricks_with_real_rest_days.sql > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to import tricks"
    exit 1
fi

echo "- Importing job ownerships..."
$PSQL_CMD -d noc_dispatch -f job_ownerships_real.sql > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to import job ownerships"
    exit 1
fi

echo "✓ Data imported"

# Success message
echo ""
echo "============================================"
echo "  Setup Complete! ✓"
echo "============================================"
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Start the app:"
echo "   npm run dev"
echo ""
echo "2. Open your browser to:"
echo "   http://localhost:5173"
echo ""
echo "3. Import dispatchers:"
echo "   - Click 'Manage Dispatchers'"
echo "   - Click 'Import from CSV'"
echo "   - Select dispatchers_complete_real.csv"
echo ""
echo "4. Set up Extra Board:"
echo "   - See LOCAL_SETUP_SIMPLE.md for instructions"
echo ""
