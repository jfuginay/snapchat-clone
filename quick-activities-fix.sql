-- 🚀 QUICK FIX: Activities Not Loading
-- This addresses the most common issue where activities exist but aren't active

-- Step 1: Make all activities active
UPDATE activities 
SET is_active = true 
WHERE is_active = false OR is_active IS NULL;

-- Step 2: Verify the fix worked
SELECT 
  '✅ Activities Status' as status,
  COUNT(*) as total_activities,
  COUNT(*) FILTER (WHERE is_active = true) as active_activities,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_activities
FROM activities;

-- Step 3: Show sample of now-active activities
SELECT 
  '📱 Sample Active Activities' as sample,
  name,
  category,
  icon,
  is_active
FROM activities 
WHERE is_active = true
ORDER BY popularity_score DESC
LIMIT 10;

-- 🎉 DONE! Your activities should now load in the app
SELECT '🎉 Fix Complete! Refresh your app to see activities.' as message; 