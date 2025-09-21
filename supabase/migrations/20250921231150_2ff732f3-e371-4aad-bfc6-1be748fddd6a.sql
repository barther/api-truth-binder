-- =====================================================================
-- NOC Dispatch Scheduling System — Schema v1.1 (PostgreSQL 15+)
-- =====================================================================

-- Assignment source enum
CREATE TYPE assignment_source AS ENUM ('BASE', 'HOLD_DOWN', 'ATW', 'OVERTIME');

-- Absence type enum  
CREATE TYPE absence_type AS ENUM ('VACATION', 'SICK', 'FMLA', 'OOS', 'OTHER');

-- Vacancy reason enum
CREATE TYPE vacancy_reason AS ENUM ('VAC', 'FMLA', 'TRAINING', 'OOS', 'UNKNOWN');

-- Main desks table
CREATE TABLE desks (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    territory VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tricks (shift patterns) for each desk
CREATE TABLE tricks (
    id SERIAL PRIMARY KEY,
    desk_id INTEGER NOT NULL REFERENCES desks(id),
    name VARCHAR(50) NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    days_mask BIT(7) NOT NULL, -- Mon-Sun bitmask
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Dispatchers
CREATE TABLE dispatchers (
    id SERIAL PRIMARY KEY,
    badge VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    rank VARCHAR(10),
    hire_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Dispatcher qualifications for desks
CREATE TABLE qualifications (
    id SERIAL PRIMARY KEY,
    dispatcher_id INTEGER NOT NULL REFERENCES dispatchers(id),
    desk_id INTEGER NOT NULL REFERENCES desks(id),
    qualified_on DATE NOT NULL,
    trainer_id INTEGER REFERENCES dispatchers(id),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(dispatcher_id, desk_id)
);

-- Trick instances (materialized calendar)
CREATE TABLE trick_instances (
    id SERIAL PRIMARY KEY,
    trick_id INTEGER NOT NULL REFERENCES tricks(id),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_holiday BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Assignments (dispatcher to trick instance)
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    trick_instance_id INTEGER NOT NULL REFERENCES trick_instances(id),
    dispatcher_id INTEGER NOT NULL REFERENCES dispatchers(id),
    source assignment_source NOT NULL DEFAULT 'BASE',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    requires_trainer BOOLEAN DEFAULT false,
    trainer_id INTEGER REFERENCES dispatchers(id),
    created_by INTEGER REFERENCES dispatchers(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL
);

-- Dispatcher absences
CREATE TABLE absences (
    id SERIAL PRIMARY KEY,
    dispatcher_id INTEGER NOT NULL REFERENCES dispatchers(id),
    type absence_type NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Hold downs for covering vacancies
CREATE TABLE hold_downs (
    id SERIAL PRIMARY KEY,
    desk_id INTEGER NOT NULL REFERENCES desks(id),
    trick_id INTEGER NOT NULL REFERENCES tricks(id),
    vacancy_reason vacancy_reason NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    projected_end TIMESTAMPTZ NOT NULL,
    actual_end TIMESTAMPTZ NULL,
    awarded_to INTEGER REFERENCES dispatchers(id),
    rule_blob JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seniority system
CREATE TABLE seniority (
    dispatcher_id INTEGER PRIMARY KEY REFERENCES dispatchers(id),
    rank VARCHAR(10) NOT NULL,
    tie_breaker INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audit logs for all changes
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    actor INTEGER REFERENCES dispatchers(id),
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    before_data JSONB,
    after_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_tricks_desk_id ON tricks(desk_id);
CREATE INDEX idx_trick_instances_trick_id ON trick_instances(trick_id);
CREATE INDEX idx_trick_instances_starts_at ON trick_instances(starts_at);
CREATE INDEX idx_assignments_trick_instance_id ON assignments(trick_instance_id);
CREATE INDEX idx_assignments_dispatcher_id ON assignments(dispatcher_id);
CREATE INDEX idx_assignments_deleted_at ON assignments(deleted_at);
CREATE INDEX idx_qualifications_dispatcher_id ON qualifications(dispatcher_id);
CREATE INDEX idx_qualifications_desk_id ON qualifications(desk_id);
CREATE INDEX idx_absences_dispatcher_id ON absences(dispatcher_id);
CREATE INDEX idx_absences_dates ON absences(starts_at, ends_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamp updates
CREATE TRIGGER update_desks_updated_at
    BEFORE UPDATE ON desks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tricks_updated_at
    BEFORE UPDATE ON tricks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispatchers_updated_at
    BEFORE UPDATE ON dispatchers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seniority_updated_at
    BEFORE UPDATE ON seniority
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();