-- COMPLETE TribeFind Database Setup
-- Run this entire script in your Supabase SQL Editor
-- This includes ALL tables needed for the MapScreen and activities functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =======================
-- USERS TABLE (Enhanced with PostGIS location)
-- =======================

-- Drop existing users table if needed to add PostGIS support
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.chat_rooms CASCADE;
DROP TABLE IF EXISTS public.friendships CASCADE;
DROP TABLE IF EXISTS public.user_activities CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create enhanced users table with PostGIS location support
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT DEFAULT '😊',
  bio TEXT DEFAULT '',
  snap_score INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  is_online BOOLEAN DEFAULT true,
  
  -- PostGIS location column for spatial queries
  location GEOMETRY(POINT, 4326) NULL,
  location_accuracy DECIMAL(8, 2) NULL,
  location_updated_at TIMESTAMPTZ NULL,
  
  settings JSONB DEFAULT '{
    "share_location": false,
    "allow_friend_requests": true,
    "show_online_status": true,
    "allow_message_from_strangers": false,
    "ghost_mode": false,
    "privacy_level": "friends",
    "notifications": {
      "push_enabled": true,
      "location_updates": true,
      "friend_requests": true,
      "messages": true
    }
  }'::JSONB,
  stats JSONB DEFAULT '{
    "snaps_shared": 0,
    "friends_count": 0,
    "stories_posted": 0
  }'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================
-- ACTIVITIES TABLES
-- =======================

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

-- =======================
-- OTHER CORE TABLES
-- =======================

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Create chat_rooms table
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'direct', -- 'direct', 'group'
  participants UUID[] NOT NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'location'
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  location JSONB,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================
-- INDEXES FOR PERFORMANCE
-- =======================

-- User table indexes (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON public.users(is_online) WHERE is_online = true;

-- PostGIS spatial index for location queries (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS users_location_gist_idx ON users USING GIST (location);

-- Activities table indexes (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_active ON activities(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_activities_popularity ON activities(popularity_score DESC);

-- User activities indexes (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_id ON user_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_skill_level ON user_activities(skill_level);

-- Other table indexes (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_messages_chat_room_id ON public.messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON public.photos(user_id);

-- =======================
-- ROW LEVEL SECURITY
-- =======================

-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Users table policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Activities policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view active activities" ON activities;
CREATE POLICY "Anyone can view active activities" ON activities
    FOR SELECT USING (is_active = true);

-- User activities policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own activities" ON user_activities;
CREATE POLICY "Users can insert their own activities" ON user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own activities" ON user_activities;
CREATE POLICY "Users can update their own activities" ON user_activities
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own activities" ON user_activities;
CREATE POLICY "Users can delete their own activities" ON user_activities
    FOR DELETE USING (auth.uid() = user_id);

-- Other table policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (requester_id = auth.uid() OR addressee_id = auth.uid());

DROP POLICY IF EXISTS "Users can create friendship requests" ON public.friendships;
CREATE POLICY "Users can create friendship requests" ON public.friendships
  FOR INSERT WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE chat_rooms.id = messages.chat_room_id
      AND auth.uid() = ANY(chat_rooms.participants)
    )
  );

DROP POLICY IF EXISTS "Users can view public photos and own photos" ON public.photos;
CREATE POLICY "Users can view public photos and own photos" ON public.photos
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own photos" ON public.photos;
CREATE POLICY "Users can insert own photos" ON public.photos
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =======================
-- TRIGGERS FOR TIMESTAMPS
-- =======================

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
DROP TRIGGER IF EXISTS update_user_activities_updated_at ON user_activities;

-- Create triggers for updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_activities_updated_at BEFORE UPDATE ON user_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- POSTGIS FUNCTIONS FOR MAP
-- =======================

-- Drop existing function first to avoid conflicts (handle all possible variations)
DROP FUNCTION IF EXISTS get_nearby_tribe_members(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, INTEGER[]);
DROP FUNCTION IF EXISTS get_nearby_tribe_members(NUMERIC, NUMERIC, INTEGER, INTEGER[]);
DROP FUNCTION IF EXISTS get_nearby_tribe_members(REAL, REAL, INTEGER, INTEGER[]);
DROP FUNCTION IF EXISTS get_nearby_tribe_members CASCADE;

-- Function to find nearby tribe members with shared activities
CREATE OR REPLACE FUNCTION get_nearby_tribe_members(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER,
  activity_ids INTEGER[]
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  avatar TEXT,
  location JSONB,
  distance_meters DOUBLE PRECISION,
  shared_activities JSONB,
  last_active TIMESTAMP WITH TIME ZONE,
  is_online BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH user_point AS (
    SELECT ST_GeogFromText('POINT(' || user_lng || ' ' || user_lat || ')') AS geog
  ),
  nearby_users AS (
    SELECT 
      u.id,
      u.username,
      u.display_name,
      u.avatar,
      u.location,
      u.last_active,
      u.is_online,
      ST_Distance(
        ST_GeogFromText('POINT(' || user_lng || ' ' || user_lat || ')'),
        u.location::geography
      ) AS distance_meters
    FROM users u
    CROSS JOIN user_point up
    WHERE 
      u.location IS NOT NULL
      AND ST_DWithin(
        up.geog,
        u.location::geography,
        radius_meters
      )
      AND u.id != (SELECT auth.uid())  -- Exclude current user
  ),
  users_with_activities AS (
    SELECT 
      nu.*,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', a.id,
            'name', a.name,
            'icon', a.icon,
            'skill_level', ua.skill_level
          )
          ORDER BY a.name
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'::json
      ) AS shared_activities
    FROM nearby_users nu
    LEFT JOIN user_activities ua ON nu.id = ua.user_id 
      AND ua.activity_id = ANY(activity_ids)
    LEFT JOIN activities a ON ua.activity_id = a.id
    GROUP BY nu.id, nu.username, nu.display_name, nu.avatar, nu.location, nu.last_active, nu.is_online, nu.distance_meters
  )
  SELECT 
    uwa.id,
    uwa.username,
    uwa.display_name,
    uwa.avatar,
    JSON_BUILD_OBJECT(
      'latitude', ST_Y(uwa.location::geometry),
      'longitude', ST_X(uwa.location::geometry)
    )::JSONB AS location,
    uwa.distance_meters,
    uwa.shared_activities::JSONB,
    uwa.last_active,
    uwa.is_online
  FROM users_with_activities uwa
  WHERE JSON_ARRAY_LENGTH(uwa.shared_activities::json) > 0  -- Only users with shared activities
  ORDER BY uwa.distance_meters ASC, JSON_ARRAY_LENGTH(uwa.shared_activities::json) DESC
  LIMIT 50;  -- Limit results for performance
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_nearby_tribe_members TO authenticated;

-- =======================
-- SAMPLE DATA FOR TESTING
-- =======================

-- Insert sample activities for TribeFind (skip if already exist)
INSERT INTO activities (name, description, category, subcategory, icon, color, tags) VALUES
-- Sports & Fitness
('Rock Climbing', 'Indoor and outdoor rock climbing', 'Sports', 'Adventure Sports', '🧗‍♂️', '#FF6B6B', ARRAY['adventure', 'strength', 'outdoor']),
('Yoga', 'Various styles of yoga practice', 'Sports', 'Wellness', '🧘‍♀️', '#4ECDC4', ARRAY['wellness', 'flexibility', 'mindfulness']),
('Running', 'Distance running and jogging', 'Sports', 'Cardio', '🏃‍♂️', '#45B7D1', ARRAY['cardio', 'outdoor', 'endurance']),
('Basketball', 'Team basketball sport', 'Sports', 'Team Sports', '🏀', '#FECA57', ARRAY['team', 'coordination', 'competitive']),

-- Creative Arts
('Photography', 'Digital and film photography', 'Creative', 'Visual Arts', '📸', '#6C5CE7', ARRAY['visual', 'artistic', 'technical']),
('Music Production', 'Creating and producing music', 'Creative', 'Music', '🎵', '#A29BFE', ARRAY['music', 'technical', 'creative']),
('Dancing', 'Various dance styles', 'Creative', 'Performing Arts', '💃', '#FF7675', ARRAY['movement', 'rhythm', 'expressive']),

-- Technology
('Web Development', 'Frontend and backend development', 'Technology', 'Programming', '💻', '#00B894', ARRAY['coding', 'technical', 'problem-solving']),
('Mobile Development', 'iOS and Android app development', 'Technology', 'Programming', '📱', '#0984E3', ARRAY['coding', 'mobile', 'apps']),

-- Outdoor & Adventure
('Hiking', 'Trail hiking and backpacking', 'Outdoor', 'Nature', '🥾', '#55A3FF', ARRAY['nature', 'endurance', 'exploration']),
('Camping', 'Outdoor camping and survival', 'Outdoor', 'Nature', '⛺', '#26DE81', ARRAY['nature', 'survival', 'outdoors'])
ON CONFLICT (name) DO NOTHING;

-- Update popularity scores
UPDATE activities SET popularity_score = 95 WHERE name IN ('Photography', 'Running');
UPDATE activities SET popularity_score = 85 WHERE name IN ('Yoga', 'Hiking', 'Web Development', 'Music Production');
UPDATE activities SET popularity_score = 75 WHERE name IN ('Dancing', 'Basketball');

-- Enable real-time subscriptions (ignore errors if already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎯 COMPLETE TribeFind Database Setup Completed!';
  RAISE NOTICE '✅ Users table with PostGIS location support';
  RAISE NOTICE '✅ Activities and user_activities tables';
  RAISE NOTICE '✅ PostGIS function for nearby tribe members';
  RAISE NOTICE '✅ All indexes and RLS policies configured';
  RAISE NOTICE '✅ Sample activities loaded for testing';
  RAISE NOTICE '';
  RAISE NOTICE '🗺️ MapScreen is now ready to work!';
  RAISE NOTICE '📱 You can now test the app on your iPhone';
END $$; 

-- =================================================================
-- Final Verification
-- =================================================================

SELECT '✅ COMPLETE_DATABASE_SETUP script finished successfully.' as status;


-- =================================================================
-- Schema for the Local Knowledge RAG (Retrieval-Augmented Generation)
-- This section adds the necessary tables and functions for the RAG feature.
-- It is idempotent and can be run safely on existing databases.
-- =================================================================

-- Step 1: Intelligently enable required extensions.

-- Enable pgvector in the `extensions` schema if it's not already enabled.
CREATE EXTENSION IF NOT EXISTS pgvector WITH SCHEMA extensions;

-- Enable postgis, handling the case where it might already exist (e.g., in `public`).
DO $$
BEGIN
    -- Check if postgis is installed at all.
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        -- If not installed, create it in the correct `extensions` schema.
        CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
        RAISE NOTICE 'PostGIS extension was not found, so it has been created in the `extensions` schema.';
    ELSE
        -- If it is already installed, just log a notice. No action needed.
        RAISE NOTICE 'PostGIS extension is already installed. Proceeding with RAG schema setup.';
    END IF;
END;
$$;

-- Step 2: Create the `local_knowledge` table.
CREATE TABLE IF NOT EXISTS public.local_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    content TEXT NOT NULL,
    location GEOGRAPHY(Point, 4326),
    metadata JSONB,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.local_knowledge IS 'Stores vectorized and geolocated information about local points of interest for the RAG feature.';
COMMENT ON COLUMN public.local_knowledge.source IS 'The origin of the data (e.g., foursquare_tips, osm_notes). Helps in tracking data lineage.';
COMMENT ON COLUMN public.local_knowledge.content IS 'The textual content of the local tip or information that will be shown to the user.';
COMMENT ON COLUMN public.local_knowledge.location IS 'The geographic coordinates (latitude, longitude) of the point of interest.';
COMMENT ON COLUMN public.local_knowledge.metadata IS 'Flexible JSONB field for additional, non-searchable data like operating hours, user ratings, or event schedules.';
COMMENT ON COLUMN public.local_knowledge.embedding IS 'A high-dimensional vector representation of the content, used for semantic similarity searches.';

-- Step 3: Create indexes to optimize query performance.
CREATE INDEX IF NOT EXISTS local_knowledge_location_idx ON public.local_knowledge USING GIST (location);
CREATE INDEX IF NOT EXISTS local_knowledge_source_idx ON public.local_knowledge (source);

-- NOTE: A vector index on the `embedding` column will be created later.

-- Step 4: Ensure the trigger function for `updated_at` exists and is attached.
-- This uses the generic `handle_updated_at` function created earlier in this master script.
DROP TRIGGER IF EXISTS on_local_knowledge_update ON public.local_knowledge; -- Drop if exists to avoid errors on re-run
CREATE TRIGGER on_local_knowledge_update
BEFORE UPDATE ON public.local_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

SELECT '✅ Local Knowledge RAG schema integrated successfully.' as status; 