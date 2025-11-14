# Quick Deploy to noc.arther.co

You already have Cloudflare SSL certificates. This makes deployment simpler.

---

## Step 1: Upload Code to Server

```bash
ssh user@arther.co
cd /var/www
sudo mkdir noc-dispatch
sudo chown $USER:$USER noc-dispatch
```

From your local machine:
```bash
scp -r ~/Documents/api-truth-binder/* user@arther.co:/var/www/noc-dispatch/
```

Or if you have git:
```bash
cd /var/www/noc-dispatch
git clone YOUR-REPO-URL .
```

---

## Step 2: Run Deployment Script

```bash
cd /var/www/noc-dispatch
chmod +x deploy-to-server.sh
sudo ./deploy-to-server.sh
```

When it asks for subdomain, enter: `noc.arther.co`

---

## Step 3: Use Your Cloudflare Certificates

The deployment script creates a basic Apache config. Replace it with the Cloudflare version:

```bash
sudo cp /var/www/noc-dispatch/apache-cloudflare.conf /etc/apache2/sites-available/noc.arther.co.conf

# Enable required modules
sudo a2enmod ssl
sudo a2enmod remoteip
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite

# Enable the site
sudo a2ensite noc.arther.co

# Test config
sudo apache2ctl configtest

# If OK, reload
sudo systemctl reload apache2
```

---

## Step 4: Set Up Cloudflare DNS

In your Cloudflare dashboard for `arther.co`:

1. Go to **DNS** → **Records**
2. **Add record**:
   - Type: `A`
   - Name: `noc`
   - IPv4 address: `YOUR-SERVER-IP`
   - Proxy status: **Proxied** (orange cloud)
   - TTL: Auto
3. Click **Save**

Wait 1-2 minutes for DNS to propagate.

---

## Step 5: Configure Cloudflare SSL/TLS Mode

In Cloudflare dashboard:

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to: **Full (strict)**

This ensures:
- Browser → Cloudflare: Encrypted (Cloudflare cert)
- Cloudflare → Your server: Encrypted (Your origin cert)

---

## Step 6: Test It

Go to: `https://noc.arther.co`

You should see the app!

---

## Step 7: Import Data

1. In the app, click **Manage Dispatchers**
2. Click **Import from CSV**
3. Upload `dispatchers_complete_real.csv`
4. Wait for 269 dispatchers to import

---

## Step 8: Set Up Extra Board

```bash
ssh user@arther.co
psql postgresql://nocuser:YOUR-PASSWORD@localhost:5432/noc_dispatch
```

Run the SQL from the deployment guide (Step 11).

Or use this quick version:

```sql
-- Create boards
INSERT INTO boards (code, name, division_id, shift_id, active)
SELECT 'GAD-1ST', 'GAD First Shift',
       (SELECT id FROM divisions WHERE code = 'GAD'),
       (SELECT id FROM shifts WHERE code = '1ST'), TRUE
ON CONFLICT (code) DO NOTHING;

-- Find board members
SELECT emp_no, last_name, first_name FROM employees
WHERE NOT EXISTS (
  SELECT 1 FROM job_ownerships jo
  WHERE jo.employee_id = employees.id AND jo.end_date IS NULL
)
ORDER BY seniority_date LIMIT 20;

-- Add members (replace emp numbers with real ones from above)
WITH gad_eb AS (SELECT id FROM boards WHERE code = 'GAD-1ST'),
     members AS (SELECT id FROM employees WHERE emp_no IN (
       '1111111', '2222222', '3333333', '4444444', '5555555'
     ))
INSERT INTO board_memberships (board_id, employee_id, start_date)
SELECT gad_eb.id, members.id, CURRENT_DATE FROM gad_eb, members;

-- Initialize rotation
SELECT initialize_board_rotation(id) FROM boards;

-- Set eligibility
UPDATE employees SET is_board_eligible = TRUE
WHERE EXISTS (SELECT 1 FROM board_memberships bm WHERE bm.employee_id = employees.id);

UPDATE employees SET is_board_eligible = FALSE
WHERE EXISTS (SELECT 1 FROM job_ownerships jo WHERE jo.employee_id = employees.id AND jo.end_date IS NULL);

-- Generate 30 days
SELECT * FROM generate_schedule_days(30);
```

Type `\q` to exit.

---

## You're Done!

Access from anywhere: `https://noc.arther.co`

Benefits with Cloudflare:
- ✓ DDoS protection
- ✓ SSL handled by Cloudflare
- ✓ Caching (if you enable it)
- ✓ Analytics
- ✓ Hide your server's real IP

---

## Cloudflare Settings (Optional)

**Caching:**
- Go to **Caching** → **Configuration**
- Set caching level to: **Standard** (or No Query String for API)
- The app is dynamic, so caching may not help much

**Firewall:**
- Go to **Security** → **WAF**
- Enable Cloudflare managed rules
- Consider geo-blocking if you only need US access

**Page Rules:**
- You can create rules to bypass cache for `/admin/*` if needed

---

## Troubleshooting

**"Too many redirects"**
- Check Cloudflare SSL/TLS mode is set to **Full (strict)**
- NOT "Flexible" (that causes redirect loops)

**"Can't access from browser"**
- Check: `sudo systemctl status noc-dispatch`
- Check: `curl http://localhost:3001`
- Check Apache logs: `sudo tail -f /var/log/apache2/noc-error.log`

**"502 Bad Gateway"**
- Node app isn't running
- Check: `sudo systemctl restart noc-dispatch`
- Check logs: `sudo journalctl -u noc-dispatch -f`

**DNS not working**
- Make sure orange cloud is ON (Proxied) in Cloudflare
- Wait a few more minutes
- Test: `nslookup noc.arther.co`

---

## Management

**Restart app:**
```bash
sudo systemctl restart noc-dispatch
```

**View logs:**
```bash
sudo journalctl -u noc-dispatch -f
```

**Update app:**
```bash
cd /var/www/noc-dispatch
git pull
npm install
npm run build
sudo systemctl restart noc-dispatch
```

---

## What You Get

A production-ready tool at `https://noc.arther.co` that:
- ✓ You can access from work
- ✓ Other union members can access
- ✓ Protected by Cloudflare
- ✓ Encrypted end-to-end
- ✓ Runs on YOUR infrastructure
- ✓ $0/month (you already have the server and certs)

The algorithm is deterministic and proves contract violations with full audit trails.
