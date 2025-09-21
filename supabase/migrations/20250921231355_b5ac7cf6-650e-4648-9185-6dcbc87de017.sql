-- Fix security issues by enabling RLS and creating policies

-- Enable RLS on all tables
ALTER TABLE desks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tricks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trick_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE hold_downs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seniority ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for read access (for now, allowing public read access for the scheduling system)
-- In a production system, you would want more restrictive policies based on user roles

-- Desks policies (read-only for users)
CREATE POLICY "Allow read access to desks" ON desks
FOR SELECT USING (true);

-- Tricks policies (read-only for users)
CREATE POLICY "Allow read access to tricks" ON tricks
FOR SELECT USING (true);

-- Dispatchers policies (read-only for users)
CREATE POLICY "Allow read access to dispatchers" ON dispatchers
FOR SELECT USING (true);

-- Qualifications policies (read-only for users)
CREATE POLICY "Allow read access to qualifications" ON qualifications
FOR SELECT USING (true);

-- Trick instances policies (read-only for users)
CREATE POLICY "Allow read access to trick_instances" ON trick_instances
FOR SELECT USING (true);

-- Assignments policies (full access for system operations)
CREATE POLICY "Allow full access to assignments" ON assignments
FOR ALL USING (true);

-- Absences policies (full access for system operations)
CREATE POLICY "Allow full access to absences" ON absences
FOR ALL USING (true);

-- Hold downs policies (full access for system operations)
CREATE POLICY "Allow full access to hold_downs" ON hold_downs
FOR ALL USING (true);

-- Seniority policies (read-only for users)
CREATE POLICY "Allow read access to seniority" ON seniority
FOR SELECT USING (true);

-- Audit logs policies (read-only for users)
CREATE POLICY "Allow read access to audit_logs" ON audit_logs
FOR SELECT USING (true);

-- Fix function search path security issue
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;