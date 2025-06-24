-- TribeFind Activities Database Schema
-- Creates tables for activities and user activity selections
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create activities table for all available activities/interests
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    icon VARCHAR(20) DEFAULT '🎯',
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    skill_levels TEXT[] DEFAULT ARRAY['beginner', 'intermediate', 'advanced'],
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    popularity_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_activities table for user activity selections with skill levels
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    skill_level VARCHAR(20) NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
    interest_level INTEGER DEFAULT 5 CHECK (interest_level >= 1 AND interest_level <= 10),
    years_experience DECIMAL(3,1) DEFAULT 0,
    is_teaching BOOLEAN DEFAULT false,
    is_learning BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, activity_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_active ON activities(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_activities_popularity ON activities(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_id ON user_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_skill_level ON user_activities(skill_level);

-- Enable Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities table
CREATE POLICY "Anyone can view active activities" ON activities
    FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can modify activities" ON activities
    FOR ALL USING (false); -- Will be updated with admin role when implemented

-- RLS Policies for user_activities table
CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON user_activities
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON user_activities
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_activities_updated_at BEFORE UPDATE ON user_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample activities for TribeFind
INSERT INTO activities (name, description, category, subcategory, icon, color, tags) VALUES
-- Sports & Fitness
('Rock Climbing', 'Indoor and outdoor rock climbing', 'Sports', 'Adventure Sports', '🧗‍♂️', '#FF6B6B', ARRAY['adventure', 'strength', 'outdoor']),
('Yoga', 'Various styles of yoga practice', 'Sports', 'Wellness', '🧘‍♀️', '#4ECDC4', ARRAY['wellness', 'flexibility', 'mindfulness']),
('Running', 'Distance running and jogging', 'Sports', 'Cardio', '🏃‍♂️', '#45B7D1', ARRAY['cardio', 'outdoor', 'endurance']),
('Surfing', 'Ocean wave surfing', 'Sports', 'Water Sports', '🏄‍♂️', '#96CEB4', ARRAY['water', 'balance', 'ocean']),
('Basketball', 'Team basketball sport', 'Sports', 'Team Sports', '🏀', '#FECA57', ARRAY['team', 'coordination', 'competitive']),

-- Creative Arts
('Photography', 'Digital and film photography', 'Creative', 'Visual Arts', '📸', '#6C5CE7', ARRAY['visual', 'artistic', 'technical']),
('Painting', 'Various painting techniques', 'Creative', 'Visual Arts', '🎨', '#FD79A8', ARRAY['artistic', 'creative', 'expressive']),
('Music Production', 'Creating and producing music', 'Creative', 'Music', '🎵', '#A29BFE', ARRAY['music', 'technical', 'creative']),
('Dancing', 'Various dance styles', 'Creative', 'Performing Arts', '💃', '#FF7675', ARRAY['movement', 'rhythm', 'expressive']),
('Writing', 'Creative and technical writing', 'Creative', 'Literature', '✍️', '#74B9FF', ARRAY['language', 'creative', 'communication']),

-- Technology
('Web Development', 'Frontend and backend development', 'Technology', 'Programming', '💻', '#00B894', ARRAY['coding', 'technical', 'problem-solving']),
('Mobile Development', 'iOS and Android app development', 'Technology', 'Programming', '📱', '#0984E3', ARRAY['coding', 'mobile', 'apps']),
('Data Science', 'Data analysis and machine learning', 'Technology', 'Analytics', '📊', '#6F42C1', ARRAY['data', 'analytics', 'math']),
('UI/UX Design', 'User interface and experience design', 'Technology', 'Design', '🎨', '#E17055', ARRAY['design', 'user-experience', 'creative']),
('Game Development', 'Video game creation', 'Technology', 'Programming', '🎮', '#00CEC9', ARRAY['gaming', 'programming', 'creative']),

-- Outdoor & Adventure
('Hiking', 'Trail hiking and backpacking', 'Outdoor', 'Nature', '🥾', '#55A3FF', ARRAY['nature', 'endurance', 'exploration']),
('Camping', 'Outdoor camping and survival', 'Outdoor', 'Nature', '⛺', '#26DE81', ARRAY['nature', 'survival', 'outdoors']),
('Mountain Biking', 'Off-road cycling', 'Outdoor', 'Cycling', '🚵‍♂️', '#FFC048', ARRAY['cycling', 'adventure', 'outdoor']),
('Kayaking', 'Water kayaking and canoeing', 'Outdoor', 'Water Sports', '🛶', '#2D98DA', ARRAY['water', 'paddling', 'nature']),

-- Food & Cooking
('Cooking', 'Culinary arts and cooking', 'Lifestyle', 'Culinary', '👨‍🍳', '#FF9F43', ARRAY['culinary', 'creative', 'practical']),
('Baking', 'Bread and pastry baking', 'Lifestyle', 'Culinary', '🧁', '#F8B500', ARRAY['baking', 'precise', 'creative']),
('Wine Tasting', 'Wine appreciation and tasting', 'Lifestyle', 'Culinary', '🍷', '#8E44AD', ARRAY['tasting', 'appreciation', 'social']),

-- Mind & Learning
('Reading', 'Books and literature', 'Education', 'Literature', '📚', '#3742FA', ARRAY['knowledge', 'literature', 'learning']),
('Language Learning', 'Foreign language acquisition', 'Education', 'Languages', '🗣️', '#2ED573', ARRAY['languages', 'communication', 'culture']),
('Meditation', 'Mindfulness and meditation practice', 'Wellness', 'Mental Health', '🧘‍♂️', '#7B68EE', ARRAY['mindfulness', 'wellness', 'mental-health']),
('Board Games', 'Strategy and social board games', 'Social', 'Games', '🎲', '#FF6348', ARRAY['strategy', 'social', 'thinking']);

-- Update popularity scores based on common interests
UPDATE activities SET popularity_score = 95 WHERE name IN ('Photography', 'Cooking', 'Reading', 'Running');
UPDATE activities SET popularity_score = 85 WHERE name IN ('Yoga', 'Hiking', 'Web Development', 'Music Production');
UPDATE activities SET popularity_score = 75 WHERE name IN ('Dancing', 'Basketball', 'Writing', 'Board Games');
UPDATE activities SET popularity_score = 65 WHERE name IN ('Rock Climbing', 'Surfing', 'Painting', 'Language Learning');
UPDATE activities SET popularity_score = 55 WHERE name IN ('Mountain Biking', 'Kayaking', 'Game Development', 'Wine Tasting');

-- Create a function to get user's selected activities with details
CREATE OR REPLACE FUNCTION get_user_activities(target_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    activity_id UUID,
    activity_name VARCHAR(100),
    category VARCHAR(50),
    subcategory VARCHAR(50),
    icon VARCHAR(20),
    color VARCHAR(7),
    skill_level VARCHAR(20),
    interest_level INTEGER,
    years_experience DECIMAL(3,1),
    is_teaching BOOLEAN,
    is_learning BOOLEAN,
    notes TEXT,
    selected_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as activity_id,
        a.name as activity_name,
        a.category,
        a.subcategory,
        a.icon,
        a.color,
        ua.skill_level,
        ua.interest_level,
        ua.years_experience,
        ua.is_teaching,
        ua.is_learning,
        ua.notes,
        ua.created_at as selected_at
    FROM user_activities ua
    JOIN activities a ON ua.activity_id = a.id
    WHERE ua.user_id = target_user_id
    ORDER BY a.category, a.name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_activities TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎯 TribeFind Activities schema created successfully!';
    RAISE NOTICE '✅ Activities table with sample data';
    RAISE NOTICE '✅ User activities table with skill levels';
    RAISE NOTICE '✅ Row Level Security policies configured';
    RAISE NOTICE '✅ Indexes created for performance';
    RAISE NOTICE '✅ Helper functions for activity management';
    RAISE NOTICE '';
    RAISE NOTICE 'Sample activities loaded:';
    RAISE NOTICE '🏃‍♂️ Sports: Running, Basketball, Yoga, Rock Climbing, Surfing';
    RAISE NOTICE '🎨 Creative: Photography, Painting, Music, Dancing, Writing';
    RAISE NOTICE '💻 Technology: Web Dev, Mobile Dev, Data Science, UI/UX, Gaming';
    RAISE NOTICE '🏔️ Outdoor: Hiking, Camping, Mountain Biking, Kayaking';
    RAISE NOTICE '👨‍🍳 Culinary: Cooking, Baking, Wine Tasting';
    RAISE NOTICE '📚 Learning: Reading, Languages, Meditation, Board Games';
END $$; 