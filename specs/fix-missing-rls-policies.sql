-- ====================================================================
-- Fix Missing RLS Policies
-- Adds missing INSERT/DELETE policies for families and family_members
-- Run this in Supabase SQL Editor
-- ====================================================================

-- Missing policy: Users can create families
CREATE POLICY "Users can create families" ON families
  FOR INSERT WITH CHECK (true);

-- Missing policy: Users can add themselves to families
CREATE POLICY "Users can add themselves to families" ON family_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Missing policy: Admins can remove family members
CREATE POLICY "Admins can remove family members" ON family_members
  FOR DELETE USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
