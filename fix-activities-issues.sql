-- 🔧 Quick Fix Script for Activities Loading Issues
-- Run specific sections based on your debug results

-- =======================
-- FIX 1: ACTIVITIES EXIST BUT INACTIVE
-- =======================
-- If debug shows activities exist but activitiesCount is 0
UPDATE activities 
SET is_active = true 
WHERE is_active = false OR is_active IS NULL;

-- =======================
-- FIX 2: MISSING RLS POLICY
-- =======================
-- If RLS policy doesn't exist or is wrong
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active activities" ON activities;
CREATE POLICY "Anyone can view active activities" ON activities
    FOR SELECT USING (is_active = true);

-- =======================
-- FIX 3: FORCE REFRESH ACTIVITY DATA
-- =======================
-- If activities table seems corrupted
DELETE FROM user_activities;
DELETE FROM activities;

-- Re-run your sample-activities-setup.sql after this

-- =======================
-- FIX 4: TEST INSERT NEW ACTIVITY
-- =======================
-- Test if you can insert a simple activity
INSERT INTO activities (name, description, category, icon, color, is_active, popularity_score)
VALUES (
  'Debug Test Activity', 
  'Test activity to verify insertion works', 
  'Test', 
  '🔧', 
  '#FF0000', 
  true, 
  100
);

-- =======================
-- FIX 5: VERIFY FINAL STATE
-- =======================
SELECT 
  COUNT(*) as total_activities,
  COUNT(*) FILTER (WHERE is_active = true) as active_activities
FROM activities;

-- This should show your 52 activities as active 