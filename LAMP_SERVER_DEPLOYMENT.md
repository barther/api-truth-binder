# Deploying to Your LAMP Server
## Run on Your Own Domain (Access from Anywhere)

You have a LAMP server and want to run this at something like `noc.yourdomain.com`.

---

## What You'll Do

1. Install Node.js and PostgreSQL on your server (alongside Apache/MySQL)
2. Deploy the app to your server
3. Configure Apache to reverse proxy to the Node app
4. Set up SSL (https) with Let's Encrypt
5. Point your subdomain to it

**Result:** Access from work, home, phone - anywhere with internet, but YOU control the server.

---

## Prerequisites

- Linux server with Apache already running
- Root or sudo access
- Domain name you control (e.g., `yourdomain.com`)
- Ability to create DNS records

---

## Step 1: Install Node.js on Your Server

SSH into your server:
```bash
ssh user@yourserver.com
```

**Install Node.js:**

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify
node --version
npm --version
```

---

## Step 2: Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
psql --version
```

**Set up PostgreSQL user and database:**

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql:
CREATE USER nocuser WITH PASSWORD 'your-secure-password-here';
CREATE DATABASE noc_dispatch OWNER nocuser;
GRANT ALL PRIVILEGES ON DATABASE noc_dispatch TO nocuser;
\q
```

**Configure PostgreSQL to allow local connections:**

Edit `/etc/postgresql/*/main/pg_hba.conf` (or `/var/lib/pgsql/data/pg_hba.conf` on CentOS):

Add this line:
```
local   noc_dispatch    nocuser                                 md5
host    noc_dispatch    nocuser         127.0.0.1/32            md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

## Step 3: Deploy the App to Your Server

**Upload the code:**

```bash
# On your server, create app directory
sudo mkdir -p /var/www/noc-dispatch
sudo chown $USER:$USER /var/www/noc-dispatch
cd /var/www/noc-dispatch

# From your local machine, upload the code
# Option A: Use scp
scp -r ~/Documents/api-truth-binder/* user@yourserver.com:/var/www/noc-dispatch/

# Option B: Use git (if you have it in a repo)
git clone YOUR-REPO-URL .
```

**Install dependencies:**

```bash
cd /var/www/noc-dispatch
npm install
npm run build
```

**Set up environment:**

Create `/var/www/noc-dispatch/.env`:
```bash
DATABASE_URL=postgresql://nocuser:your-secure-password-here@localhost:5432/noc_dispatch
NODE_ENV=production
PORT=3001
```

---

## Step 4: Set Up Database

```bash
# Run migrations
cd /var/www/noc-dispatch
export DATABASE_URL=postgresql://nocuser:your-secure-password-here@localhost:5432/noc_dispatch

psql $DATABASE_URL -f supabase/migrations/20251113000000_complete_schema.sql
psql $DATABASE_URL -f supabase/migrations/20251113000001_helper_functions.sql
psql $DATABASE_URL -f supabase/migrations/20251114000000_diversion_logic.sql
psql $DATABASE_URL -f supabase/migrations/20251114000001_order_of_call.sql
psql $DATABASE_URL -f supabase/migrations/20251114000002_cascade_and_rotation.sql
psql $DATABASE_URL -f supabase/migrations/20251114000003_order_of_call_with_rotation.sql
psql $DATABASE_URL -f supabase/migrations/20251114000004_schedule_generator.sql

# Import data
psql $DATABASE_URL -f real_desks_migration.sql
psql $DATABASE_URL -f tricks_with_real_rest_days.sql
psql $DATABASE_URL -f job_ownerships_real.sql
```

---

## Step 5: Create Systemd Service (Keep App Running)

Create `/etc/systemd/system/noc-dispatch.service`:

```ini
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
```

**Enable and start the service:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable noc-dispatch
sudo systemctl start noc-dispatch

# Check status
sudo systemctl status noc-dispatch

# View logs
sudo journalctl -u noc-dispatch -f
```

---

## Step 6: Configure Apache Reverse Proxy

**Enable required modules:**

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod ssl
sudo a2enmod rewrite
sudo systemctl restart apache2
```

**Create Apache config:**

Create `/etc/apache2/sites-available/noc.yourdomain.com.conf`:

```apache
<VirtualHost *:80>
    ServerName noc.yourdomain.com

    # Redirect to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName noc.yourdomain.com

    # SSL Configuration (Let's Encrypt will add these)
    # SSLEngine on
    # SSLCertificateFile /etc/letsencrypt/live/noc.yourdomain.com/fullchain.pem
    # SSLCertificateKeyFile /etc/letsencrypt/live/noc.yourdomain.com/privkey.pem

    # Reverse proxy to Node app
    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/

    # WebSocket support (for hot reload in dev, optional in production)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:3001/$1 [P,L]

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/noc-error.log
    CustomLog ${APACHE_LOG_DIR}/noc-access.log combined
</VirtualHost>
```

**Enable the site:**

```bash
sudo a2ensite noc.yourdomain.com
sudo systemctl reload apache2
```

---

## Step 7: Set Up SSL with Let's Encrypt

**Install Certbot:**

```bash
# Ubuntu/Debian
sudo apt-get install -y certbot python3-certbot-apache

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-apache
```

**Get SSL certificate:**

```bash
sudo certbot --apache -d noc.yourdomain.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: yes)

**Auto-renewal** is already set up. Verify:
```bash
sudo certbot renew --dry-run
```

---

## Step 8: Configure DNS

In your domain registrar/DNS provider:

**Create an A record:**
- Name: `noc` (or whatever subdomain you want)
- Type: `A`
- Value: Your server's IP address (e.g., `203.0.113.42`)
- TTL: 3600 (or default)

Wait 5-15 minutes for DNS to propagate.

**Test:**
```bash
nslookup noc.yourdomain.com
```

Should show your server's IP.

---

## Step 9: Access Your App

Open your browser and go to:
```
https://noc.yourdomain.com
```

You should see the app!

---

## Step 10: Import Data Through the Web UI

1. Go to: `https://noc.yourdomain.com/admin/dispatchers`
2. Click "Import from CSV"
3. Upload `dispatchers_complete_real.csv`
4. Wait for import to complete

---

## Step 11: Set Up Extra Board

SSH into your server:

```bash
psql postgresql://nocuser:your-password@localhost:5432/noc_dispatch
```

Run this SQL (replace employee numbers with real ones):

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

-- Find dispatchers without jobs (these are board members)
SELECT emp_no, last_name, first_name, seniority_date
FROM employees
WHERE NOT EXISTS (
  SELECT 1 FROM job_ownerships jo
  WHERE jo.employee_id = employees.id AND jo.end_date IS NULL
)
AND status = 'ACTIVE'
ORDER BY seniority_date
LIMIT 20;

-- Add board members (REPLACE employee numbers)
WITH gad_1st AS (SELECT id FROM boards WHERE code = 'GAD-1ST'),
     members AS (SELECT id FROM employees WHERE emp_no IN (
       '1234567',  -- Replace these
       '2345678',
       '3456789',
       '4567890',
       '5678901'
     ))
INSERT INTO board_memberships (board_id, employee_id, start_date)
SELECT gad_1st.id, members.id, CURRENT_DATE
FROM gad_1st, members ON CONFLICT DO NOTHING;

-- Repeat for other shifts with different employee numbers

-- Initialize rotation
SELECT initialize_board_rotation(id) FROM boards;

-- Set eligibility
UPDATE employees SET is_board_eligible = TRUE
WHERE EXISTS (SELECT 1 FROM board_memberships bm WHERE bm.employee_id = employees.id AND bm.end_date IS NULL);

UPDATE employees SET is_board_eligible = FALSE
WHERE EXISTS (SELECT 1 FROM job_ownerships jo WHERE jo.employee_id = employees.id AND jo.end_date IS NULL);

-- Generate 30 days of schedule
SELECT * FROM generate_schedule_days(30);
```

Type `\q` to exit.

---

## Management Commands

**Start the app:**
```bash
sudo systemctl start noc-dispatch
```

**Stop the app:**
```bash
sudo systemctl stop noc-dispatch
```

**Restart the app:**
```bash
sudo systemctl restart noc-dispatch
```

**View logs:**
```bash
sudo journalctl -u noc-dispatch -f
```

**Update the app:**
```bash
cd /var/www/noc-dispatch
git pull  # or upload new files
npm install
npm run build
sudo systemctl restart noc-dispatch
```

---

## Security Considerations

**Firewall:**
```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Make sure PostgreSQL is NOT exposed
sudo ufw deny 5432/tcp
```

**Keep only local PostgreSQL access:**
- PostgreSQL should only listen on localhost
- Check `/etc/postgresql/*/main/postgresql.conf`
- Ensure `listen_addresses = 'localhost'`

**Regular updates:**
```bash
sudo apt-get update && sudo apt-get upgrade
sudo certbot renew  # Auto-runs, but can manually trigger
```

---

## Advantages of This Setup

✓ **Access from anywhere** - Work, home, phone
✓ **Your own server** - You control the data
✓ **No cloud accounts** - No Supabase, no third parties
✓ **HTTPS encryption** - Secure connection
✓ **Always running** - systemd keeps it alive
✓ **Professional setup** - Real production deployment
✓ **MySQL still works** - PostgreSQL runs alongside it

---

## Troubleshooting

**App won't start:**
```bash
sudo journalctl -u noc-dispatch -n 50
```
Check for errors in the logs.

**Can't access from browser:**
```bash
sudo systemctl status apache2
sudo systemctl status noc-dispatch
curl http://localhost:3001
```

**Database connection issues:**
```bash
psql postgresql://nocuser:password@localhost:5432/noc_dispatch -c "SELECT 1;"
```

**Apache errors:**
```bash
sudo tail -f /var/log/apache2/noc-error.log
```

**SSL issues:**
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

---

## Cost

**$0/month** if you already have the server.

- Uses your existing LAMP server
- PostgreSQL runs alongside MySQL (no conflict)
- Node.js runs as a service
- No cloud costs

---

## What You Get

A **production-grade deployment** accessible at:
```
https://noc.yourdomain.com
```

- ✓ Access from work computer
- ✓ Access from home
- ✓ Access from phone
- ✓ Secure HTTPS
- ✓ Always running
- ✓ You control everything

Your union can access it from anywhere to check the algorithm and catch company violations.
