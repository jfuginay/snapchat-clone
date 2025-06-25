-- 🚀 FINAL Activities Setup for TribeFind
-- This script ensures both activities and user_activities tables work perfectly

-- =======================
-- 1. ENSURE ACTIVITIES ARE ACTIVE
-- =======================

-- Make sure all activities are active so they show up in the app
UPDATE activities 
SET is_active = true 
WHERE is_active = false OR is_active IS NULL;

-- Verify activities are ready
SELECT 
  '✅ Activities Status Check' as status,
  COUNT(*) as total_activities,
  COUNT(*) FILTER (WHERE is_active = true) as active_activities,
  COUNT(*) FILTER (WHERE is_active = false OR is_active IS NULL) as inactive_activities
FROM activities;

-- =======================
-- 2. CREATE USER_ACTIVITIES TABLE
-- =======================

-- Create the user_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  skill_level VARCHAR(20) NOT NULL DEFAULT 'beginner' 
    CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  interest_level INTEGER NOT NULL DEFAULT 5 
    CHECK (interest_level >= 1 AND interest_level <= 10),
  is_teaching BOOLEAN DEFAULT FALSE,
  is_learning BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can't select same activity twice
  UNIQUE(user_id, activity_id)
);

-- Enable Row Level Security
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for user_activities
DROP POLICY IF EXISTS "Users can manage their own activities" ON user_activities;
CREATE POLICY "Users can manage their own activities" ON user_activities
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_id ON user_activities(activity_id);

-- =======================
-- 3. VERIFICATION
-- =======================

-- Check table exists and is configured
SELECT 
  '✅ User Activities Table Check' as status,
  tablename,
  schemaname,
  hasindexes,
  hasrules
FROM pg_tables 
WHERE tablename = 'user_activities';

-- Check RLS is enabled
SELECT 
  '✅ RLS Policy Check' as status,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_activities';

-- Show sample activities that are now ready
SELECT 
  '📱 Sample Available Activities' as sample,
  name,
  category,
  icon,
  is_active
FROM activities 
WHERE is_active = true
ORDER BY popularity_score DESC NULLS LAST
LIMIT 10;

-- Final status
SELECT 
  '🎉 Setup Complete!' as status,
  'Activities screen should now work perfectly' as message,
  COUNT(*) as total_active_activities
FROM activities 
WHERE is_active = true; 