-- 🛠️ Create user_activities table if missing
-- This table stores which activities users have selected and their skill levels

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  skill_level INTEGER NOT NULL DEFAULT 1 CHECK (skill_level >= 1 AND skill_level <= 5),
  interest_level INTEGER NOT NULL DEFAULT 5 CHECK (interest_level >= 1 AND interest_level <= 5),
  is_teaching BOOLEAN DEFAULT FALSE,
  is_learning BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can only have one entry per activity
  UNIQUE(user_id, activity_id)
);

-- Enable RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own activities" ON user_activities;
CREATE POLICY "Users can manage their own activities" ON user_activities
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_id ON user_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_skill_level ON user_activities(skill_level);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_activities_updated_at ON user_activities;
CREATE TRIGGER update_user_activities_updated_at
    BEFORE UPDATE ON user_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created
SELECT 
  'user_activities table created successfully' as status,
  COUNT(*) as initial_count
FROM user_activities;

-- 🎉 Done! Now the ActivitySelector should load without hanging 