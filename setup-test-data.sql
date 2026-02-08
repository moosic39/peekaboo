-- Setup test data for development
-- Run this in Supabase SQL Editor

-- Create test family
INSERT INTO families (id, name, invite_code)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Test Family',
  'TEST01'
);

-- Create test baby
INSERT INTO babies (id, family_id, name, birthdate)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Test Baby',
  '2024-01-01'
);

-- Create family member for dev-user
INSERT INTO family_members (family_id, user_id, role)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'dev-user',
  'admin'
);

-- Verify data was created
SELECT 'Families:' as table_name, count(*) as count FROM families
UNION ALL
SELECT 'Babies:', count(*) FROM babies
UNION ALL
SELECT 'Family Members:', count(*) FROM family_members;
