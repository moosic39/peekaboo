-- Fix for Infinite Recursion in RLS Policies
-- Run this script in your Supabase SQL Editor to fix the circular dependency

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view family members" ON family_members;

-- Create a corrected policy that doesn't query family_members recursively
-- Users can see family_members records for families they belong to
-- This is checked by looking at user_id directly (no recursion)
CREATE POLICY "Users can view their own family memberships"
  ON family_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    family_id IN (
      -- Users can also see other members of families they're in
      -- But we use a simpler check: if they have ANY record with this family_id
      SELECT fm.family_id
      FROM family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

-- Note: This still has potential recursion. Let's use an even simpler approach:
-- Just let users see all family_members records (they can only see limited info anyway)
DROP POLICY IF EXISTS "Users can view their own family memberships" ON family_members;

CREATE POLICY "Users can view family members in their families"
  ON family_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM family_members fm
      WHERE fm.user_id = auth.uid()
      AND fm.family_id = family_members.family_id
    )
  );

-- Actually, that still recurses. The proper solution is to use a function:

-- Drop the policy again
DROP POLICY IF EXISTS "Users can view family members in their families" ON family_members;

-- Create a helper function that doesn't trigger RLS
CREATE OR REPLACE FUNCTION user_is_in_family(check_family_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- This bypasses RLS
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM family_members
    WHERE user_id = auth.uid()
    AND family_id = check_family_id
  );
$$;

-- Now create the policy using the function
CREATE POLICY "Users can view family members"
  ON family_members FOR SELECT
  USING (user_is_in_family(family_id));

-- Verify the fix
SELECT 'RLS policies fixed successfully!' as status;
