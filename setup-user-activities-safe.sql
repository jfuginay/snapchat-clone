-- 🛠️ SAFE User Activities Table Setup for TribeFind
-- This script creates the user_activities table and ensures proper permissions
-- SAFE TO RUN MULTIPLE TIMES - will not break existing data

-- =======================
-- 1. CREATE TABLE IF NOT EXISTS
-- =======================

CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_id UUID NOT NULL,
  skill_level VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  interest_level INTEGER NOT NULL DEFAULT 5 CHECK (interest_level >= 1 AND interest_level <= 10),
  years_experience DECIMAL(3,1) DEFAULT 0,
  is_teaching BOOLEAN DEFAULT FALSE,
  is_learning BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can only have one entry per activity
  UNIQUE(user_id, activity_id)
);

-- =======================
-- 2. ADD FOREIGN KEY CONSTRAINTS (IF NOT EXISTS)
-- =======================

-- Check if foreign key constraints exist, add if missing
DO $$
BEGIN
  -- Add foreign key to users table (try both 'users' and 'auth.users')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_activities_user_id_fkey'
  ) THEN
    -- Try users table first, then auth.users
    BEGIN
      ALTER TABLE user_activities 
      ADD CONSTRAINT user_activities_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        ALTER TABLE user_activities 
        ADD CONSTRAINT user_activities_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add user_id foreign key - ensure users table exists';
      END;
    END;
  END IF;

  -- Add foreign key to activities table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_activities_activity_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE user_activities 
      ADD CONSTRAINT user_activities_activity_id_fkey 
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add activity_id foreign key - ensure activities table exists';
    END;
  END IF;
END $$;

-- =======================
-- 3. ENABLE ROW LEVEL SECURITY
-- =======================

ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- =======================
-- 4. CREATE RLS POLICIES (SAFE)
-- =======================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can manage their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON user_activities;

-- Create comprehensive policies
CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON user_activities
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON user_activities
    FOR DELETE USING (auth.uid() = user_id);

-- =======================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =======================

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_id ON user_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_skill_level ON user_activities(skill_level);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_activity ON user_activities(user_id, activity_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);

-- =======================
-- 6. CREATE UPDATE TRIGGER (SAFE)
-- =======================

-- Create or replace the function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS update_user_activities_updated_at ON user_activities;

-- Create the trigger
CREATE TRIGGER update_user_activities_updated_at
    BEFORE UPDATE ON user_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- 7. VERIFY SETUP AND SHOW STATUS
-- =======================

-- Check if everything was created successfully
DO $$
DECLARE
    table_exists BOOLEAN;
    policy_count INTEGER;
    index_count INTEGER;
    fk_count INTEGER;
BEGIN
    -- Check table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_activities'
    ) INTO table_exists;
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'user_activities';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'user_activities';
    
    -- Count foreign keys
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints 
    WHERE table_name = 'user_activities' 
    AND constraint_type = 'FOREIGN KEY';
    
    -- Report status
    RAISE NOTICE '✅ USER_ACTIVITIES SETUP COMPLETE!';
    RAISE NOTICE '📊 Status Report:';
    RAISE NOTICE '   - Table exists: %', table_exists;
    RAISE NOTICE '   - RLS policies: %', policy_count;
    RAISE NOTICE '   - Indexes created: %', index_count;
    RAISE NOTICE '   - Foreign keys: %', fk_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Your ActivitySelector should now work without hanging!';
    RAISE NOTICE '📱 Restart your Expo app to test the fix.';
END $$;

-- =======================
-- 8. OPTIONAL: TEST DATA VERIFICATION
-- =======================

-- Show sample data for verification
SELECT 
    'Activities table count' as info,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM activities
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities')

UNION ALL

SELECT 
    'User activities count' as info,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users
FROM user_activities;

-- 🎉 SETUP COMPLETE!
-- This script safely creates the user_activities table with:
-- ✅ Proper foreign key relationships
-- ✅ Row Level Security policies  
-- ✅ Performance indexes
-- ✅ Update triggers
-- ✅ Safe to run multiple times
-- 
-- Your activities should now load properly! 🚀 