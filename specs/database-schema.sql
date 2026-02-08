-- ============================================
-- Peekaboo Baby Activity Tracker Database Schema
-- ============================================
-- This schema implements a multi-tenant architecture where families
-- can share baby activity data in real-time. Row Level Security (RLS)
-- ensures users can only access data for families they belong to.

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Families: Groups that share access to baby data
-- Each family has a unique invite code for adding members
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Family Members: Links users to families with their roles
-- Users can belong to multiple families
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' or 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(family_id, user_id)
);

-- Babies: Profiles for babies tracked by families
-- Each baby belongs to one family but can have multiple caregivers
CREATE TABLE babies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birthdate DATE NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Activities: All logged baby activities (feed, diaper, sleep, pump, growth)
-- Details stored as JSONB for flexibility with different activity types
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('feed', 'diaper', 'sleep', 'pump', 'growth')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index on family_members for quick user -> families lookup
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);

-- Index on babies for family queries
CREATE INDEX idx_babies_family_id ON babies(family_id);

-- Index on activities for common queries
CREATE INDEX idx_activities_baby_id ON activities(baby_id);
CREATE INDEX idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_created_by ON activities(created_by);

-- Composite index for baby + timestamp queries (most common)
CREATE INDEX idx_activities_baby_timestamp ON activities(baby_id, timestamp DESC);

-- Index for invite code lookups
CREATE INDEX idx_families_invite_code ON families(invite_code);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- These policies ensure users can only access data for families they belong to.
-- This is the foundation of the multi-tenant architecture.

-- Enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FAMILIES POLICIES
-- ============================================

-- Users can view families they are members of
CREATE POLICY "Users can view their families"
  ON families FOR SELECT
  USING (
    id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can create new families (they become admin automatically via trigger)
CREATE POLICY "Users can create families"
  ON families FOR INSERT
  WITH CHECK (true);

-- Only family admins can update family details
CREATE POLICY "Family admins can update families"
  ON families FOR UPDATE
  USING (
    id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only family admins can delete families
CREATE POLICY "Family admins can delete families"
  ON families FOR DELETE
  USING (
    id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- FAMILY MEMBERS POLICIES
-- ============================================

-- Users can view members of families they belong to
-- Fixed: Uses SECURITY DEFINER function to prevent infinite recursion
CREATE POLICY "Users can view family members"
  ON family_members FOR SELECT
  USING (user_is_in_family(family_id));

-- Users can add themselves to families (via invite code)
CREATE POLICY "Users can add themselves to families"
  ON family_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Family admins can remove members
-- Fixed: Uses SECURITY DEFINER function to prevent infinite recursion
CREATE POLICY "Family admins can remove members"
  ON family_members FOR DELETE
  USING (user_is_family_admin(family_id));

-- ============================================
-- BABIES POLICIES
-- ============================================

-- Users can view babies in their families
CREATE POLICY "Users can view babies in their families"
  ON babies FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
  );

-- Family members can add babies
CREATE POLICY "Family members can add babies"
  ON babies FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
  );

-- Family members can update babies
CREATE POLICY "Family members can update babies"
  ON babies FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
  );

-- Only family admins can delete babies
CREATE POLICY "Family admins can delete babies"
  ON babies FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- ACTIVITIES POLICIES
-- ============================================

-- Users can view activities for babies in their families
CREATE POLICY "Users can view activities for their babies"
  ON activities FOR SELECT
  USING (
    baby_id IN (
      SELECT b.id FROM babies b
      INNER JOIN family_members fm ON fm.family_id = b.family_id
      WHERE fm.user_id = auth.uid()
    )
  );

-- Family members can log activities
CREATE POLICY "Family members can log activities"
  ON activities FOR INSERT
  WITH CHECK (
    baby_id IN (
      SELECT b.id FROM babies b
      INNER JOIN family_members fm ON fm.family_id = b.family_id
      WHERE fm.user_id = auth.uid()
    )
  );

-- Users can update their own activities
CREATE POLICY "Users can update their own activities"
  ON activities FOR UPDATE
  USING (created_by = auth.uid());

-- Users can delete their own activities
CREATE POLICY "Users can delete their own activities"
  ON activities FOR DELETE
  USING (created_by = auth.uid());

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if user is in a family (bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION user_is_in_family(check_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER -- Bypasses RLS to prevent infinite recursion in family_members policies
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM family_members
    WHERE user_id = auth.uid()
    AND family_id = check_family_id
  );
$$;

-- Helper function to check if user is admin of a family (bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION user_is_family_admin(check_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER -- Bypasses RLS to prevent infinite recursion in family_members policies
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM family_members
    WHERE user_id = auth.uid()
    AND family_id = check_family_id
    AND role = 'admin'
  );
$$;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_babies_updated_at
  BEFORE UPDATE ON babies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate a unique 6-character invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar chars (I,O,0,1)
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invite code if not provided
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := generate_invite_code();
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM families WHERE invite_code = NEW.invite_code) LOOP
      NEW.invite_code := generate_invite_code();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_family_invite_code
  BEFORE INSERT ON families
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();

-- Function to auto-add family creator as admin
CREATE OR REPLACE FUNCTION add_family_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO family_members (family_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER add_family_creator
  AFTER INSERT ON families
  FOR EACH ROW
  EXECUTE FUNCTION add_family_creator_as_admin();

-- ============================================
-- REAL-TIME PUBLICATION
-- ============================================
-- Enable real-time for activities table so partners see updates instantly
-- Configure this in the Supabase dashboard under Database > Replication

-- The activities table should have real-time enabled for:
-- - INSERT events (new activities logged)
-- - UPDATE events (activities edited)
-- - DELETE events (activities removed)

-- ============================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================
-- Uncomment to insert sample data for testing

-- INSERT INTO families (name, invite_code) VALUES ('Smith Family', 'ABC123');
-- INSERT INTO babies (family_id, name, birthdate)
-- SELECT id, 'Emma Smith', '2024-01-15'
-- FROM families WHERE invite_code = 'ABC123';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after setup to verify everything works

-- Check if tables exist
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public';

-- Check indexes
-- SELECT indexname, tablename
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;
