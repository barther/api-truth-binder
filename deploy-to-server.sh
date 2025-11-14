#!/bin/bash

echo ""
echo "============================================"
echo "  NOC Dispatch - Server Deployment Script"
echo "============================================"
echo ""
echo "This script sets up the app on your LAMP server."
echo ""
echo "Prerequisites:"
echo "- Root/sudo access"
echo "- Apache already installed"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Detect OS
if [ -f /etc/debian_version ]; then
    OS="debian"
    PKG_MANAGER="apt-get"
elif [ -f /etc/redhat-release ]; then
    OS="redhat"
    PKG_MANAGER="yum"
else
    echo "Unsupported OS. This script supports Ubuntu/Debian and CentOS/RHEL."
    exit 1
fi

echo ""
echo "Step 1: Installing Node.js..."
if [ "$OS" = "debian" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo $PKG_MANAGER install -y nodejs
else
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo $PKG_MANAGER install -y nodejs
fi

if ! command -v node &> /dev/null; then
    echo "❌ Failed to install Node.js"
    exit 1
fi
echo "✓ Node.js installed ($(node --version))"

echo ""
echo "Step 2: Installing PostgreSQL..."
if [ "$OS" = "debian" ]; then
    sudo $PKG_MANAGER update
    sudo $PKG_MANAGER install -y postgresql postgresql-contrib
else
    sudo $PKG_MANAGER install -y postgresql-server postgresql-contrib
    sudo postgresql-setup initdb
fi

sudo systemctl start postgresql
sudo systemctl enable postgresql
echo "✓ PostgreSQL installed"

echo ""
echo "Step 3: Setting up database..."
read -p "Enter a password for the database user: " DB_PASSWORD

sudo -u postgres psql << EOF
CREATE USER nocuser WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE noc_dispatch OWNER nocuser;
GRANT ALL PRIVILEGES ON DATABASE noc_dispatch TO nocuser;
\q
EOF

# Configure pg_hba.conf
PG_HBA=$(sudo -u postgres psql -t -P format=unaligned -c 'SHOW hba_file;')
if grep -q "noc_dispatch.*nocuser" "$PG_HBA"; then
    echo "PostgreSQL already configured for nocuser"
else
    echo "local   noc_dispatch    nocuser                                 md5" | sudo tee -a "$PG_HBA"
    echo "host    noc_dispatch    nocuser         127.0.0.1/32            md5" | sudo tee -a "$PG_HBA"
    sudo systemctl restart postgresql
fi
echo "✓ Database created"

echo ""
echo "Step 4: Creating app directory..."
sudo mkdir -p /var/www/noc-dispatch
sudo chown $USER:$USER /var/www/noc-dispatch

echo "Copying files to /var/www/noc-dispatch..."
cp -r ./* /var/www/noc-dispatch/
cd /var/www/noc-dispatch

echo "✓ Files copied"

echo ""
echo "Step 5: Installing dependencies..."
npm install
npm run build
echo "✓ Dependencies installed"

echo ""
echo "Step 6: Creating environment file..."
cat > .env << EOF
DATABASE_URL=postgresql://nocuser:$DB_PASSWORD@localhost:5432/noc_dispatch
NODE_ENV=production
PORT=3001
EOF
echo "✓ Environment configured"

echo ""
echo "Step 7: Running database migrations..."
export DATABASE_URL=postgresql://nocuser:$DB_PASSWORD@localhost:5432/noc_dispatch

psql $DATABASE_URL -f supabase/migrations/20251113000000_complete_schema.sql > /dev/null 2>&1
psql $DATABASE_URL -f supabase/migrations/20251113000001_helper_functions.sql > /dev/null 2>&1
psql $DATABASE_URL -f supabase/migrations/20251114000000_diversion_logic.sql > /dev/null 2>&1
psql $DATABASE_URL -f supabase/migrations/20251114000001_order_of_call.sql > /dev/null 2>&1
psql $DATABASE_URL -f supabase/migrations/20251114000002_cascade_and_rotation.sql > /dev/null 2>&1
psql $DATABASE_URL -f supabase/migrations/20251114000003_order_of_call_with_rotation.sql > /dev/null 2>&1
psql $DATABASE_URL -f supabase/migrations/20251114000004_schedule_generator.sql > /dev/null 2>&1
echo "✓ Migrations complete"

echo ""
echo "Step 8: Importing data..."
psql $DATABASE_URL -f real_desks_migration.sql > /dev/null 2>&1
psql $DATABASE_URL -f tricks_with_real_rest_days.sql > /dev/null 2>&1
psql $DATABASE_URL -f job_ownerships_real.sql > /dev/null 2>&1
echo "✓ Data imported"

echo ""
echo "Step 9: Creating systemd service..."
sudo tee /etc/systemd/system/noc-dispatch.service > /dev/null << 'EOF'
[Unit]
Description=NOC Dispatch Scheduler
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/noc-dispatch
Environment=NODE_ENV=production
Environment=PORT=3001
EnvironmentFile=/var/www/noc-dispatch/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo chown -R www-data:www-data /var/www/noc-dispatch
sudo systemctl daemon-reload
sudo systemctl enable noc-dispatch
sudo systemctl start noc-dispatch
echo "✓ Service created and started"

echo ""
echo "Step 10: Configuring Apache..."

# Enable required modules
sudo a2enmod proxy proxy_http ssl rewrite 2>/dev/null

# Get domain name
echo ""
read -p "Enter your subdomain (e.g., noc.yourdomain.com): " DOMAIN

# Create Apache config
sudo tee /etc/apache2/sites-available/$DOMAIN.conf > /dev/null << EOF
<VirtualHost *:80>
    ServerName $DOMAIN

    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}\$1 [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName $DOMAIN

    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/

    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:3001/\$1 [P,L]

    ErrorLog \${APACHE_LOG_DIR}/noc-error.log
    CustomLog \${APACHE_LOG_DIR}/noc-access.log combined
</VirtualHost>
EOF

sudo a2ensite $DOMAIN
sudo systemctl reload apache2
echo "✓ Apache configured"

echo ""
echo "============================================"
echo "  Deployment Complete! ✓"
echo "============================================"
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Set up DNS:"
echo "   - Create an A record for: $DOMAIN"
echo "   - Point it to this server's IP"
echo "   - Wait 5-15 minutes for DNS to propagate"
echo ""
echo "2. Set up SSL (after DNS is working):"
echo "   sudo apt-get install -y certbot python3-certbot-apache"
echo "   sudo certbot --apache -d $DOMAIN"
echo ""
echo "3. Access your app:"
echo "   http://$DOMAIN (will redirect to https after SSL)"
echo ""
echo "4. Import dispatchers:"
echo "   - Go to Manage Dispatchers"
echo "   - Upload dispatchers_complete_real.csv"
echo ""
echo "5. Set up Extra Board:"
echo "   - See LAMP_SERVER_DEPLOYMENT.md Step 11"
echo ""
echo "Check status: sudo systemctl status noc-dispatch"
echo "View logs: sudo journalctl -u noc-dispatch -f"
echo ""
