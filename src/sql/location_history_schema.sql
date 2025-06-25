-- ============================================================================
-- LOCATION HISTORY & AI ACTIVITY DETECTION SCHEMA
-- ============================================================================
-- This schema supports:
-- 1. Location history tracking with movement detection
-- 2. AI-powered activity suggestions based on location patterns and photos
-- 3. Activity classification and recommendations
-- ============================================================================

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- LOCATION HISTORY TABLE
-- ============================================================================
-- Tracks user location changes over time with movement analysis
CREATE TABLE IF NOT EXISTS location_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Location data
    location GEOMETRY(POINT, 4326) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION, -- GPS accuracy in meters
    altitude DOUBLE PRECISION, -- Altitude in meters
    
    -- Movement analysis
    previous_location GEOMETRY(POINT, 4326), -- Previous location for movement calculation
    distance_from_previous DOUBLE PRECISION, -- Distance moved since last location (meters)
    movement_speed DOUBLE PRECISION, -- Speed in m/s
    time_at_location INTERVAL, -- How long user stayed at this location
    is_stationary BOOLEAN DEFAULT FALSE, -- True if user was stationary here
    
    -- Location classification
    location_type TEXT, -- 'home', 'work', 'transit', 'activity', 'unknown'
    confidence_score DOUBLE PRECISION DEFAULT 0, -- AI confidence in location type (0-1)
    
    -- Contextual data
    time_of_day TIME NOT NULL,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
    weather_conditions JSONB, -- Weather data if available
    
    -- AI processing
    ai_analyzed BOOLEAN DEFAULT FALSE,
    ai_suggested_activities JSONB, -- Array of AI-suggested activities
    ai_analysis_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    battery_level INTEGER, -- Device battery level (0-100)
    data_source TEXT DEFAULT 'app' -- 'app', 'background', 'manual'
);

-- ============================================================================
-- ACTIVITY DETECTION TABLE
-- ============================================================================
-- Stores AI-detected activities based on location patterns and photos
CREATE TABLE IF NOT EXISTS activity_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_history_id UUID REFERENCES location_history(id) ON DELETE CASCADE,
    
    -- Activity data
    detected_activity TEXT NOT NULL, -- e.g., 'running', 'shopping', 'dining'
    activity_category TEXT NOT NULL, -- e.g., 'fitness', 'social', 'work'
    confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0, -- AI confidence (0-1)
    
    -- Detection method
    detection_method TEXT NOT NULL, -- 'location_pattern', 'photo_analysis', 'combined'
    source_data JSONB, -- References to photos, location patterns used
    
    -- Activity details
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTERVAL,
    activity_location GEOMETRY(POINT, 4326),
    
    -- AI analysis results
    ai_reasoning TEXT, -- Explanation of why AI detected this activity
    related_photos UUID[], -- Array of photo IDs that helped with detection
    location_context JSONB, -- Nearby POIs, businesses, etc.
    
    -- User feedback
    user_confirmed BOOLEAN, -- True if user confirmed this activity
    user_feedback TEXT, -- User's feedback on the detection
    is_suggestion BOOLEAN DEFAULT TRUE, -- True for suggestions, false for confirmed activities
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- LOCATION PATTERNS TABLE
-- ============================================================================
-- Stores learned patterns of user behavior at specific locations
CREATE TABLE IF NOT EXISTS location_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Pattern location
    location GEOMETRY(POINT, 4326) NOT NULL,
    location_radius DOUBLE PRECISION DEFAULT 100, -- Pattern applies within X meters
    location_name TEXT, -- User-given name or AI-detected name
    
    -- Pattern data
    pattern_type TEXT NOT NULL, -- 'frequent_visit', 'regular_schedule', 'activity_spot'
    visit_frequency INTEGER DEFAULT 1, -- How often user visits (per week)
    typical_duration INTERVAL, -- How long user typically stays
    time_patterns JSONB, -- Typical times of day/week user visits
    
    -- Activity associations
    common_activities TEXT[], -- Activities commonly done at this location
    activity_confidence JSONB, -- Confidence scores for each activity
    
    -- Learning metadata
    data_points_count INTEGER DEFAULT 1, -- How many visits contributed to this pattern
    pattern_strength DOUBLE PRECISION DEFAULT 0, -- How strong/reliable this pattern is (0-1)
    last_visit TIMESTAMP WITH TIME ZONE,
    first_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- AI insights
    ai_insights JSONB, -- AI-generated insights about this location pattern
    suggested_optimizations JSONB, -- AI suggestions for better activity planning
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AI ACTIVITY SUGGESTIONS TABLE
-- ============================================================================
-- Stores AI-generated activity suggestions based on location and context
CREATE TABLE IF NOT EXISTS ai_activity_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Suggestion context
    trigger_location GEOMETRY(POINT, 4326),
    trigger_type TEXT NOT NULL, -- 'new_location', 'time_based', 'pattern_based'
    context_data JSONB, -- Location context, weather, time, etc.
    
    -- Suggestion details
    suggested_activity TEXT NOT NULL,
    activity_category TEXT NOT NULL,
    suggestion_reason TEXT, -- Why AI suggested this activity
    confidence_score DOUBLE PRECISION DEFAULT 0,
    
    -- Supporting data
    related_photos UUID[], -- Photos that influenced the suggestion
    nearby_activities JSONB, -- Other users' activities in the area
    historical_data JSONB, -- User's past activities in similar contexts
    
    -- Personalization
    user_activity_match DOUBLE PRECISION, -- How well it matches user's interests (0-1)
    difficulty_level TEXT, -- 'beginner', 'intermediate', 'advanced'
    estimated_duration INTERVAL,
    estimated_cost_range TEXT, -- 'free', 'low', 'medium', 'high'
    
    -- User interaction
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'completed'
    user_response TIMESTAMP WITH TIME ZONE,
    user_feedback TEXT,
    rating INTEGER, -- 1-5 star rating if user completed activity
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- When suggestion becomes irrelevant
    openai_prompt_used TEXT, -- The prompt used to generate this suggestion
    openai_response_raw JSONB -- Raw OpenAI API response
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Location history indexes
CREATE INDEX IF NOT EXISTS idx_location_history_user_time 
ON location_history (user_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_location_history_location 
ON location_history USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_location_history_stationary 
ON location_history (user_id, is_stationary, recorded_at);

CREATE INDEX IF NOT EXISTS idx_location_history_ai_analyzed 
ON location_history (ai_analyzed, created_at) WHERE ai_analyzed = FALSE;

-- Activity detections indexes
CREATE INDEX IF NOT EXISTS idx_activity_detections_user_time 
ON activity_detections (user_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_activity_detections_activity 
ON activity_detections (detected_activity, activity_category);

CREATE INDEX IF NOT EXISTS idx_activity_detections_suggestions 
ON activity_detections (user_id, is_suggestion, created_at);

-- Location patterns indexes
CREATE INDEX IF NOT EXISTS idx_location_patterns_user 
ON location_patterns (user_id);

CREATE INDEX IF NOT EXISTS idx_location_patterns_location 
ON location_patterns USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_location_patterns_strength 
ON location_patterns (pattern_strength DESC);

-- AI suggestions indexes
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_status 
ON ai_activity_suggestions (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_location 
ON ai_activity_suggestions USING GIST (trigger_location);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_expires 
ON ai_activity_suggestions (expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_activity_suggestions ENABLE ROW LEVEL SECURITY;

-- Location history policies
CREATE POLICY "Users can view own location history" ON location_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own location history" ON location_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location history" ON location_history
    FOR UPDATE USING (auth.uid() = user_id);

-- Activity detections policies
CREATE POLICY "Users can view own activity detections" ON activity_detections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity detections" ON activity_detections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity detections" ON activity_detections
    FOR UPDATE USING (auth.uid() = user_id);

-- Location patterns policies
CREATE POLICY "Users can view own location patterns" ON location_patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own location patterns" ON location_patterns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location patterns" ON location_patterns
    FOR UPDATE USING (auth.uid() = user_id);

-- AI suggestions policies
CREATE POLICY "Users can view own AI suggestions" ON ai_activity_suggestions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI suggestions" ON ai_activity_suggestions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI suggestions" ON ai_activity_suggestions
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to calculate movement from previous location
CREATE OR REPLACE FUNCTION calculate_movement_metrics(
    current_location GEOMETRY,
    previous_location GEOMETRY,
    current_time TIMESTAMP WITH TIME ZONE,
    previous_time TIMESTAMP WITH TIME ZONE
) RETURNS TABLE (
    distance_meters DOUBLE PRECISION,
    speed_ms DOUBLE PRECISION,
    duration_seconds DOUBLE PRECISION
) AS $$
BEGIN
    IF previous_location IS NULL OR previous_time IS NULL THEN
        RETURN QUERY SELECT NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT 
        ST_Distance(current_location::geography, previous_location::geography),
        ST_Distance(current_location::geography, previous_location::geography) / 
        GREATEST(EXTRACT(EPOCH FROM current_time - previous_time), 1),
        EXTRACT(EPOCH FROM current_time - previous_time);
END;
$$ LANGUAGE plpgsql;

-- Function to detect if location represents a stationary period
CREATE OR REPLACE FUNCTION is_location_stationary(
    user_id_param UUID,
    location_param GEOMETRY,
    time_threshold_minutes INTEGER DEFAULT 15,
    distance_threshold_meters DOUBLE PRECISION DEFAULT 50
) RETURNS BOOLEAN AS $$
DECLARE
    recent_locations_count INTEGER;
BEGIN
    -- Count recent locations within threshold distance
    SELECT COUNT(*) INTO recent_locations_count
    FROM location_history
    WHERE user_id = user_id_param
        AND ST_Distance(location::geography, location_param::geography) <= distance_threshold_meters
        AND recorded_at >= NOW() - (time_threshold_minutes || ' minutes')::INTERVAL;
    
    -- Consider stationary if multiple recent locations in same area
    RETURN recent_locations_count >= 3;
END;
$$ LANGUAGE plpgsql;

-- Function to get location context (nearby POIs, activities)
CREATE OR REPLACE FUNCTION get_location_context(
    location_param GEOMETRY,
    radius_meters DOUBLE PRECISION DEFAULT 500
) RETURNS JSONB AS $$
DECLARE
    context JSONB := '{}';
    nearby_users INTEGER;
    nearby_activities TEXT[];
BEGIN
    -- Count nearby active users
    SELECT COUNT(*) INTO nearby_users
    FROM users 
    WHERE location IS NOT NULL 
        AND ST_Distance(location::geography, location_param::geography) <= radius_meters
        AND last_active > NOW() - INTERVAL '1 hour';
    
    -- Get common activities in the area
    SELECT array_agg(DISTINCT detected_activity) INTO nearby_activities
    FROM activity_detections
    WHERE ST_Distance(activity_location::geography, location_param::geography) <= radius_meters
        AND start_time > NOW() - INTERVAL '7 days'
        AND confidence_score > 0.7;
    
    -- Build context object
    context := jsonb_build_object(
        'nearby_users', nearby_users,
        'common_activities', COALESCE(nearby_activities, ARRAY[]::TEXT[]),
        'area_type', 'unknown', -- Could be enhanced with POI data
        'activity_level', CASE 
            WHEN nearby_users > 10 THEN 'high'
            WHEN nearby_users > 3 THEN 'medium'
            ELSE 'low'
        END
    );
    
    RETURN context;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC DATA PROCESSING
-- ============================================================================

-- Trigger to calculate movement metrics when inserting location history
CREATE OR REPLACE FUNCTION process_location_history_insert()
RETURNS TRIGGER AS $$
DECLARE
    prev_location GEOMETRY;
    prev_time TIMESTAMP WITH TIME ZONE;
    movement_data RECORD;
BEGIN
    -- Get the most recent previous location for this user
    SELECT location, recorded_at INTO prev_location, prev_time
    FROM location_history
    WHERE user_id = NEW.user_id
        AND id != NEW.id
    ORDER BY recorded_at DESC
    LIMIT 1;
    
    -- Calculate movement metrics
    SELECT * INTO movement_data
    FROM calculate_movement_metrics(NEW.location, prev_location, NEW.recorded_at, prev_time);
    
    -- Update the record with calculated values
    NEW.previous_location := prev_location;
    NEW.distance_from_previous := movement_data.distance_meters;
    NEW.movement_speed := movement_data.speed_ms;
    NEW.time_at_location := (movement_data.duration_seconds || ' seconds')::INTERVAL;
    NEW.is_stationary := is_location_stationary(NEW.user_id, NEW.location);
    NEW.time_of_day := NEW.recorded_at::TIME;
    NEW.day_of_week := EXTRACT(DOW FROM NEW.recorded_at);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_location_history
    BEFORE INSERT ON location_history
    FOR EACH ROW
    EXECUTE FUNCTION process_location_history_insert();

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Note: Sample data would be inserted here for testing purposes
-- This would include sample location history, patterns, and AI suggestions

COMMENT ON TABLE location_history IS 'Tracks user location changes over time with movement analysis and AI processing capability';
COMMENT ON TABLE activity_detections IS 'Stores AI-detected activities based on location patterns and photo analysis';
COMMENT ON TABLE location_patterns IS 'Learns and stores user behavior patterns at specific locations';
COMMENT ON TABLE ai_activity_suggestions IS 'AI-generated activity suggestions based on location context and user preferences'; 