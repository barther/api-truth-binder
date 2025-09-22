-- Enhanced NOC Admin Bundle Schema
-- Adding missing tables and improving existing ones

-- Create tricks table for shift patterns
CREATE TABLE IF NOT EXISTS public.tricks (
  id SERIAL PRIMARY KEY,
  desk_id INTEGER NOT NULL REFERENCES public.desks(id),
  name TEXT NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  days_mask INTEGER NOT NULL DEFAULT 127, -- 7 bits for Mon-Sun
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trick instances table for specific shifts
CREATE TABLE IF NOT EXISTS public.trick_instances (
  id SERIAL PRIMARY KEY,
  trick_id INTEGER NOT NULL REFERENCES public.tricks(id),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_holiday BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create absences table
CREATE TABLE IF NOT EXISTS public.absences (
  id SERIAL PRIMARY KEY,
  dispatcher_id INTEGER NOT NULL REFERENCES public.dispatchers(id),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create qualifications table
CREATE TABLE IF NOT EXISTS public.qualifications (
  id SERIAL PRIMARY KEY,
  dispatcher_id INTEGER NOT NULL REFERENCES public.dispatchers(id),
  desk_id INTEGER NOT NULL REFERENCES public.desks(id),
  qualified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(dispatcher_id, desk_id)
);

-- Create seniority table
CREATE TABLE IF NOT EXISTS public.seniority (
  dispatcher_id INTEGER PRIMARY KEY REFERENCES public.dispatchers(id),
  rank TEXT,
  tie_breaker INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hold_downs table
CREATE TABLE IF NOT EXISTS public.hold_downs (
  id SERIAL PRIMARY KEY,
  dispatcher_id INTEGER NOT NULL REFERENCES public.dispatchers(id),
  desk_id INTEGER NOT NULL REFERENCES public.desks(id),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhance assignments table with additional fields
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS trick_instance_id INTEGER REFERENCES public.trick_instances(id),
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'BASE',
ADD COLUMN IF NOT EXISTS requires_trainer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trainer_id INTEGER REFERENCES public.dispatchers(id);

-- Enable RLS on all tables
ALTER TABLE public.tricks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trick_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seniority ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hold_downs ENABLE ROW LEVEL SECURITY;

-- Create service role policies for all tables
CREATE POLICY "srv_all_tricks" ON public.tricks FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "srv_all_trick_instances" ON public.trick_instances FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "srv_all_absences" ON public.absences FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "srv_all_qualifications" ON public.qualifications FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "srv_all_seniority" ON public.seniority FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "srv_all_hold_downs" ON public.hold_downs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Database functions from the bundle
-- Absence overlap check
CREATE OR REPLACE FUNCTION overlaps_absence(p_dispatcher int, p_start timestamptz, p_end timestamptz)
RETURNS TABLE(overlaps boolean) LANGUAGE sql STABLE AS $$
  SELECT EXISTS(
    SELECT 1 FROM absences a
    WHERE a.dispatcher_id = p_dispatcher
      AND tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(p_start, p_end, '[)')
  ) as overlaps;
$$;

-- Assignment conflict check
CREATE OR REPLACE FUNCTION has_assignment_conflict(p_dispatcher int, p_trick_instance int)
RETURNS TABLE(conflict boolean) LANGUAGE sql STABLE AS $$
  WITH ti AS (
    SELECT id, starts_at, ends_at FROM trick_instances WHERE id = p_trick_instance
  ), a1 AS (
    SELECT 1 FROM assignments a
    JOIN ti ON true
    WHERE a.dispatcher_id = p_dispatcher
      AND a.deleted_at IS NULL
      AND tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(ti.starts_at, ti.ends_at, '[)')
  ), a2 AS (
    SELECT 1 FROM assignments a WHERE a.trick_instance_id = p_trick_instance AND a.deleted_at IS NULL
  )
  SELECT EXISTS(SELECT 1 FROM a1) OR EXISTS(SELECT 1 FROM a2) as conflict;
$$;

-- List vacancies in range
CREATE OR REPLACE FUNCTION list_vacancies(p_start timestamptz, p_end timestamptz)
RETURNS TABLE(trick_instance_id int, trick_id int, starts_at timestamptz, ends_at timestamptz, desk_id int) LANGUAGE sql STABLE AS $$
  SELECT ti.id, ti.trick_id, ti.starts_at, ti.ends_at, tr.desk_id
  FROM trick_instances ti
  JOIN tricks tr ON tr.id = ti.trick_id
  WHERE ti.starts_at >= p_start AND ti.ends_at <= p_end
    AND NOT EXISTS (SELECT 1 FROM assignments a WHERE a.trick_instance_id = ti.id AND a.deleted_at IS NULL);
$$;

-- Third-shift trick heuristic
CREATE OR REPLACE FUNCTION third_shift_trick_id(p_desk_id int)
RETURNS int LANGUAGE sql STABLE AS $$
  SELECT id
  FROM tricks
  WHERE desk_id = p_desk_id AND is_active = true
  ORDER BY
    (CASE WHEN shift_end <= shift_start THEN 0 ELSE 1 END),
    (CASE WHEN lower(name) LIKE '%3rd%' THEN 0 ELSE 1 END),
    id
  LIMIT 1;
$$;

-- Build trick instances for future range
CREATE OR REPLACE FUNCTION build_trick_instances(p_desk_id int, p_start date, p_end date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE 
  r record; 
  d date; 
  tz text; 
  s timestamp; 
  e timestamp;
BEGIN
  IF p_start < current_date THEN
    RAISE EXCEPTION 'FrozenHistory' USING HINT = 'Start date must be today or future';
  END IF;

  FOR r IN SELECT * FROM tricks WHERE desk_id=p_desk_id AND is_active LOOP
    tz := r.timezone;
    d := p_start;
    WHILE d <= p_end LOOP
      -- PostgreSQL dow: 0=Sunday..6=Saturday. Our mask is Mon..Sun (0..6) so map:
      -- For Mon..Sun bits b0..b6, compute bit index as case when extract(dow)=0 then 6 else extract(dow)-1 end
      IF get_bit(r.days_mask::bit(7), CASE WHEN extract(dow from d)::int=0 THEN 6 ELSE extract(dow from d)::int - 1 END) = 1 THEN
        s := timezone(tz, d::timestamp) + make_interval(hours := extract(hour from r.shift_start)::int, mins := extract(minute from r.shift_start)::int);
        e := timezone(tz, (CASE WHEN r.shift_end <= r.shift_start THEN (d + 1)::timestamp ELSE d::timestamp END))
             + make_interval(hours := extract(hour from r.shift_end)::int, mins := extract(minute from r.shift_end)::int);
        INSERT INTO trick_instances(trick_id, starts_at, ends_at, is_holiday)
        SELECT r.id, timezone('UTC', s), timezone('UTC', e), false
        WHERE NOT EXISTS (SELECT 1 FROM trick_instances ti WHERE ti.trick_id=r.id AND ti.starts_at = timezone('UTC', s));
      END IF;
      d := d + 1;
    END LOOP;
  END LOOP;
END;
$$;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tricks_updated_at
  BEFORE UPDATE ON public.tricks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seniority_updated_at
  BEFORE UPDATE ON public.seniority
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();