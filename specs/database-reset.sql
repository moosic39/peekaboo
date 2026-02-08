-- ====================================================================
-- DATABASE RESET SCRIPT
-- Drops all existing Peekaboo tables, policies, functions, and triggers
-- Then sets up the database using the V2 schema
-- ====================================================================
-- WARNING: This will delete ALL data in your Peekaboo database!
-- ====================================================================

-- Disable real-time publications first
DO $$
BEGIN
  -- Wrap in error handling block in case publication doesn't exist yet
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS activities;
  EXCEPTION
    WHEN undefined_object THEN NULL;
    WHEN undefined_table THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS growth_measurements;
  EXCEPTION
    WHEN undefined_object THEN NULL;
    WHEN undefined_table THEN NULL;
  END;
END $$;

-- ====================================================================
-- DROP VIEWS (must be done before tables)
-- ====================================================================

DROP VIEW IF EXISTS daily_activity_summary CASCADE;
DROP VIEW IF EXISTS growth_trends CASCADE;
DROP VIEW IF EXISTS feeding_stats CASCADE;
DROP VIEW IF EXISTS sleep_stats CASCADE;

-- ====================================================================
-- DROP TRIGGERS (before functions)
-- ====================================================================

DO $$
BEGIN
  -- Wrap each DROP TRIGGER in an error-handling block
  BEGIN DROP TRIGGER IF EXISTS update_families_updated_at ON families; EXCEPTION WHEN undefined_object THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN DROP TRIGGER IF EXISTS update_babies_updated_at ON babies; EXCEPTION WHEN undefined_object THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN DROP TRIGGER IF EXISTS update_activities_updated_at ON activities; EXCEPTION WHEN undefined_object THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN DROP TRIGGER IF EXISTS update_growth_measurements_updated_at ON growth_measurements; EXCEPTION WHEN undefined_object THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN DROP TRIGGER IF EXISTS set_family_invite_code ON families; EXCEPTION WHEN undefined_object THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN DROP TRIGGER IF EXISTS add_creator_as_admin ON families; EXCEPTION WHEN undefined_object THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN DROP TRIGGER IF EXISTS sync_growth_to_measurements ON activities; EXCEPTION WHEN undefined_object THEN NULL; WHEN undefined_table THEN NULL; END;
END $$;

-- ====================================================================
-- DROP FUNCTIONS
-- ====================================================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS user_is_in_family(UUID) CASCADE;
DROP FUNCTION IF EXISTS user_is_family_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_invite_code() CASCADE;
DROP FUNCTION IF EXISTS set_invite_code() CASCADE;
DROP FUNCTION IF EXISTS add_family_creator_as_admin() CASCADE;
DROP FUNCTION IF EXISTS baby_age_in_days(UUID) CASCADE;
DROP FUNCTION IF EXISTS latest_growth_measurement(UUID) CASCADE;
DROP FUNCTION IF EXISTS sync_growth_activity() CASCADE;

-- ====================================================================
-- DROP TABLES (in correct order due to foreign key constraints)
-- ====================================================================

DROP TABLE IF EXISTS growth_measurements CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS babies CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS families CASCADE;

-- ====================================================================
-- CONFIRMATION MESSAGE
-- ====================================================================

SELECT '✓ All tables, views, functions, and triggers dropped successfully!' AS status;
SELECT 'Now setting up V2 schema...' AS next_step;

-- ====================================================================
-- V2 SCHEMA SETUP
-- ====================================================================

-- ====================================================================
-- CORE TABLES
-- ====================================================================

-- Families table
CREATE TABLE families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Babies table with birth details
CREATE TABLE babies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_weight DECIMAL(5,2), -- kg (e.g., 3.45)
  birth_height DECIMAL(5,2), -- cm (e.g., 50.5)
  birth_head_circumference DECIMAL(5,2), -- cm
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-family membership
CREATE TABLE family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- ====================================================================
-- ACTIVITY TRACKING
-- ====================================================================

-- Main activities table (all events stored here)
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  baby_id UUID REFERENCES babies(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feed', 'diaper', 'sleep', 'pump', 'growth')),
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  details JSONB NOT NULL DEFAULT '{}',
  notes TEXT, -- Optional user notes for any activity
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for efficient querying and graphing
CREATE INDEX idx_activities_baby_id ON activities(baby_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX idx_activities_baby_type ON activities(baby_id, type);
CREATE INDEX idx_activities_baby_timestamp ON activities(baby_id, timestamp DESC);
CREATE INDEX idx_activities_created_by ON activities(created_by);

-- GIN index for JSONB queries (e.g., filtering by specific details)
CREATE INDEX idx_activities_details ON activities USING GIN (details);

-- ====================================================================
-- GROWTH MEASUREMENTS (Separate table for better tracking)
-- ====================================================================

-- Dedicated growth measurements table for tracking over time
CREATE TABLE growth_measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  baby_id UUID REFERENCES babies(id) ON DELETE CASCADE NOT NULL,
  measured_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  weight DECIMAL(5,2), -- kg (e.g., 3.45, 12.50)
  height DECIMAL(5,2), -- cm (e.g., 50.5, 85.0)
  head_circumference DECIMAL(5,2), -- cm (e.g., 35.5)
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure at least one measurement is provided
  CONSTRAINT at_least_one_measurement CHECK (
    weight IS NOT NULL OR
    height IS NOT NULL OR
    head_circumference IS NOT NULL
  )
);

-- Indices for growth tracking and graphing
CREATE INDEX idx_growth_baby_id ON growth_measurements(baby_id);
CREATE INDEX idx_growth_measured_at ON growth_measurements(measured_at DESC);
CREATE INDEX idx_growth_baby_measured ON growth_measurements(baby_id, measured_at DESC);

-- ====================================================================
-- ANALYTICS VIEWS
-- ====================================================================

-- Daily activity summary view for easy graphing
CREATE VIEW daily_activity_summary AS
SELECT
  baby_id,
  type,
  DATE(timestamp) as activity_date,
  COUNT(*) as count,
  MIN(timestamp) as first_activity,
  MAX(timestamp) as last_activity
FROM activities
GROUP BY baby_id, type, DATE(timestamp);

-- Growth trends view
CREATE VIEW growth_trends AS
SELECT
  baby_id,
  measured_at,
  weight,
  height,
  head_circumference,
  LAG(weight) OVER (PARTITION BY baby_id ORDER BY measured_at) as previous_weight,
  LAG(height) OVER (PARTITION BY baby_id ORDER BY measured_at) as previous_height,
  LAG(head_circumference) OVER (PARTITION BY baby_id ORDER BY measured_at) as previous_head_circumference,
  weight - LAG(weight) OVER (PARTITION BY baby_id ORDER BY measured_at) as weight_change,
  height - LAG(height) OVER (PARTITION BY baby_id ORDER BY measured_at) as height_change
FROM growth_measurements
ORDER BY baby_id, measured_at;

-- Feeding statistics view
CREATE VIEW feeding_stats AS
SELECT
  baby_id,
  DATE(timestamp) as feed_date,
  COUNT(*) as total_feeds,
  COUNT(*) FILTER (WHERE details->>'method' = 'breast') as breast_feeds,
  COUNT(*) FILTER (WHERE details->>'method' = 'bottle') as bottle_feeds,
  COUNT(*) FILTER (WHERE details->>'method' = 'both') as mixed_feeds,
  SUM((details->>'amount')::numeric) FILTER (WHERE details->>'amount' IS NOT NULL) as total_amount_ml,
  AVG((details->>'duration')::numeric) FILTER (WHERE details->>'duration' IS NOT NULL) as avg_duration_min
FROM activities
WHERE type = 'feed'
GROUP BY baby_id, DATE(timestamp);

-- Sleep statistics view
CREATE VIEW sleep_stats AS
SELECT
  baby_id,
  DATE(timestamp) as sleep_date,
  COUNT(*) FILTER (WHERE details->>'status' = 'start') as sleep_sessions_started,
  COUNT(*) FILTER (WHERE details->>'status' = 'end') as sleep_sessions_ended,
  SUM((details->>'duration')::numeric) FILTER (WHERE details->>'duration' IS NOT NULL) as total_sleep_minutes,
  AVG((details->>'duration')::numeric) FILTER (WHERE details->>'duration' IS NOT NULL) as avg_sleep_duration
FROM activities
WHERE type = 'sleep'
GROUP BY baby_id, DATE(timestamp);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_measurements ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- HELPER FUNCTIONS (must be created before policies)
-- ====================================================================

-- Helper function to check if user is in a family (bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION user_is_in_family(check_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER -- Bypasses RLS to prevent infinite recursion
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM family_members
    WHERE user_id = auth.uid()
    AND family_id = check_family_id
  );
$$;

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 6-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 6));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM families WHERE invite_code = code) INTO exists;

    EXIT WHEN NOT exists;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate baby's age in days
CREATE OR REPLACE FUNCTION baby_age_in_days(baby_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  birth_date_val DATE;
BEGIN
  SELECT birth_date INTO birth_date_val FROM babies WHERE id = baby_id_param;
  RETURN EXTRACT(DAY FROM NOW() - birth_date_val);
END;
$$ LANGUAGE plpgsql;

-- Function to get latest growth measurement for a baby
CREATE OR REPLACE FUNCTION latest_growth_measurement(baby_id_param UUID)
RETURNS growth_measurements AS $$
  SELECT * FROM growth_measurements
  WHERE baby_id = baby_id_param
  ORDER BY measured_at DESC
  LIMIT 1;
$$ LANGUAGE sql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync growth activity to growth_measurements table
CREATE OR REPLACE FUNCTION sync_growth_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- When a growth activity is inserted, also insert into growth_measurements
  IF NEW.type = 'growth' AND (
    NEW.details->>'weight' IS NOT NULL OR
    NEW.details->>'height' IS NOT NULL OR
    NEW.details->>'headCircumference' IS NOT NULL
  ) THEN
    INSERT INTO growth_measurements (
      baby_id,
      measured_at,
      weight,
      height,
      head_circumference,
      notes,
      created_by
    ) VALUES (
      NEW.baby_id,
      NEW.timestamp,
      (NEW.details->>'weight')::numeric,
      (NEW.details->>'height')::numeric,
      (NEW.details->>'headCircumference')::numeric,
      NEW.notes,
      NEW.created_by
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- RLS POLICIES (now with helper functions defined)
-- ====================================================================

-- Families policies
CREATE POLICY "Users can view their families" ON families
  FOR SELECT USING (user_is_in_family(id));

CREATE POLICY "Users can create families" ON families
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update their families" ON families
  FOR UPDATE USING (
    id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Babies policies
CREATE POLICY "Users can view babies in their families" ON babies
  FOR SELECT USING (user_is_in_family(family_id));

CREATE POLICY "Admins can insert babies" ON babies
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update babies" ON babies
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Activities policies
CREATE POLICY "Users can insert activities for their babies" ON activities
  FOR INSERT WITH CHECK (
    baby_id IN (
      SELECT b.id FROM babies b
      WHERE user_is_in_family(b.family_id)
    )
  );

CREATE POLICY "Users can view activities for their babies" ON activities
  FOR SELECT USING (
    baby_id IN (
      SELECT b.id FROM babies b
      WHERE user_is_in_family(b.family_id)
    )
  );

CREATE POLICY "Users can update their own activities" ON activities
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own activities" ON activities
  FOR DELETE USING (created_by = auth.uid());

-- Growth measurements policies
CREATE POLICY "Users can insert growth measurements for their babies" ON growth_measurements
  FOR INSERT WITH CHECK (
    baby_id IN (
      SELECT b.id FROM babies b
      WHERE user_is_in_family(b.family_id)
    )
  );

CREATE POLICY "Users can view growth measurements for their babies" ON growth_measurements
  FOR SELECT USING (
    baby_id IN (
      SELECT b.id FROM babies b
      WHERE user_is_in_family(b.family_id)
    )
  );

CREATE POLICY "Users can update their own growth measurements" ON growth_measurements
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own growth measurements" ON growth_measurements
  FOR DELETE USING (created_by = auth.uid());

-- Family members policies (Fixed: Uses SECURITY DEFINER function to prevent infinite recursion)
CREATE POLICY "Users can view their family memberships" ON family_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    user_is_in_family(family_id)
  );

CREATE POLICY "Users can add themselves to families" ON family_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can remove family members" ON family_members
  FOR DELETE USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ====================================================================
-- TRIGGERS
-- ====================================================================

-- Apply updated_at triggers
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_babies_updated_at BEFORE UPDATE ON babies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_growth_measurements_updated_at BEFORE UPDATE ON growth_measurements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to sync growth activity to growth_measurements table
CREATE TRIGGER sync_growth_to_measurements AFTER INSERT ON activities
  FOR EACH ROW EXECUTE FUNCTION sync_growth_activity();

-- ====================================================================
-- REALTIME SUBSCRIPTIONS
-- ====================================================================

-- Enable realtime for activities (live updates across devices)
ALTER PUBLICATION supabase_realtime ADD TABLE activities;

-- Enable realtime for growth measurements
ALTER PUBLICATION supabase_realtime ADD TABLE growth_measurements;

-- ====================================================================
-- COMPLETION MESSAGE
-- ====================================================================

SELECT '✅ Database reset complete!' AS status;
SELECT '✅ V2 schema installed successfully!' AS result;
SELECT 'Tables: families, babies, family_members, activities, growth_measurements' AS tables_created;
SELECT 'Views: daily_activity_summary, growth_trends, feeding_stats, sleep_stats' AS views_created;
SELECT 'RLS: All tables secured with Row Level Security policies' AS security;
SELECT 'Realtime: Enabled for activities and growth_measurements' AS realtime;
