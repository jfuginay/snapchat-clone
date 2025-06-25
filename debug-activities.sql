-- 🔍 TribeFind Activities Debugging Script
-- Run this in your Supabase SQL Editor to debug activity loading issues

-- =======================
-- 1. CHECK TABLE EXISTS
-- =======================
SELECT 
  schemaname, 
  tablename, 
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename = 'activities';

-- =======================
-- 2. CHECK BASIC ACTIVITY COUNT
-- =======================
SELECT 
  COUNT(*) as total_activities,
  COUNT(*) FILTER (WHERE is_active = true) as active_activities,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_activities,
  COUNT(*) FILTER (WHERE is_active IS NULL) as null_is_active
FROM activities;

-- =======================
-- 3. CHECK SAMPLE ACTIVITIES
-- =======================
SELECT 
  name,
  category,
  is_active,
  popularity_score,
  created_at
FROM activities 
ORDER BY created_at DESC 
LIMIT 10;

-- =======================
-- 4. CHECK RLS POLICIES
-- =======================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'activities';

-- =======================
-- 5. TEST AS AUTHENTICATED USER
-- =======================
-- This tests the same query that ActivitySelector uses
SELECT 
  id,
  name,
  category,
  icon,
  is_active
FROM activities
WHERE is_active = true
ORDER BY popularity_score DESC
LIMIT 5;

-- =======================
-- 6. CHECK CATEGORIES
-- =======================
SELECT 
  category,
  COUNT(*) as activity_count
FROM activities 
WHERE is_active = true
GROUP BY category
ORDER BY activity_count DESC;

-- =======================
-- 7. CHECK RECENT INSERTS
-- =======================
SELECT 
  name,
  category,
  is_active,
  created_at,
  updated_at
FROM activities 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- =======================
-- 8. FORCE INSERT TEST ACTIVITY (FOR TESTING)
-- =======================
-- Uncomment this to test if you can insert activities
/*
INSERT INTO activities (name, description, category, icon, color, is_active, popularity_score)
VALUES (
  'Test Activity Debug', 
  'This is a test activity for debugging', 
  'Test', 
  '🔧', 
  '#FF0000', 
  true, 
  100
)
ON CONFLICT (name) DO NOTHING;
*/

-- =======================
-- 9. CHECK USER AUTHENTICATION
-- =======================
SELECT 
  auth.uid() as current_user_id,
  auth.jwt() is not null as is_authenticated;

-- =======================
-- SUCCESS MESSAGE
-- =======================
DO $$
BEGIN
  RAISE NOTICE '🔍 Activities Debug Script Completed!';
  RAISE NOTICE 'Check the results above to identify the issue:';
  RAISE NOTICE '1. Does the activities table exist?';
  RAISE NOTICE '2. Are there activities with is_active = true?';
  RAISE NOTICE '3. Are RLS policies configured correctly?';
  RAISE NOTICE '4. Can you query activities as authenticated user?';
  RAISE NOTICE '5. Are there any recent activity inserts?';
END $$; 