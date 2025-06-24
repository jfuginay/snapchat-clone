-- TribeFind Location Migration
-- Add location tracking columns to users table
-- Run this in your Supabase SQL Editor

-- Enable PostGIS extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add location columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add location column (PostGIS POINT)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'location') THEN
        ALTER TABLE users ADD COLUMN location GEOMETRY(POINT, 4326);
        RAISE NOTICE 'Added location column to users table';
    END IF;

    -- Add location accuracy column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'location_accuracy') THEN
        ALTER TABLE users ADD COLUMN location_accuracy FLOAT;
        RAISE NOTICE 'Added location_accuracy column to users table';
    END IF;

    -- Add location updated timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'location_updated_at') THEN
        ALTER TABLE users ADD COLUMN location_updated_at TIMESTAMPTZ;
        RAISE NOTICE 'Added location_updated_at column to users table';
    END IF;

    -- Add location sharing preferences
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'location_sharing_enabled') THEN
        ALTER TABLE users ADD COLUMN location_sharing_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added location_sharing_enabled column to users table';
    END IF;

    -- Add tribe discovery settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'tribe_discovery_radius_km') THEN
        ALTER TABLE users ADD COLUMN tribe_discovery_radius_km INT DEFAULT 5;
        RAISE NOTICE 'Added tribe_discovery_radius_km column to users table';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_location_gist_idx ON users USING GIST (location) 
WHERE location IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_location_updated_at_idx ON users (location_updated_at DESC) 
WHERE location_updated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_location_sharing_idx ON users (location_sharing_enabled) 
WHERE location_sharing_enabled = true;

-- Create a spatial index specifically for tribe discovery
CREATE INDEX IF NOT EXISTS users_tribe_discovery_idx ON users USING GIST (location) 
WHERE location IS NOT NULL AND location_sharing_enabled = true;

-- Add Row Level Security policies for location data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only update their own location
CREATE POLICY "Users can update own location" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Users can view location of users who have sharing enabled
CREATE POLICY "View shared locations" ON users
    FOR SELECT USING (
        location_sharing_enabled = true 
        OR auth.uid() = id 
        OR EXISTS (
            SELECT 1 FROM friendships f 
            WHERE (f.user_id = auth.uid() AND f.friend_id = users.id)
               OR (f.friend_id = auth.uid() AND f.user_id = users.id)
            AND f.status = 'accepted'
        )
    );

-- Create a function to update user location with validation
CREATE OR REPLACE FUNCTION update_user_location(
    user_location GEOMETRY,
    accuracy_meters FLOAT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID := auth.uid();
BEGIN
    -- Validate that user is authenticated
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    -- Validate geometry is a point
    IF ST_GeometryType(user_location) != 'ST_Point' THEN
        RAISE EXCEPTION 'Location must be a point geometry';
    END IF;

    -- Validate coordinates are within valid range
    IF ST_X(user_location) < -180 OR ST_X(user_location) > 180 THEN
        RAISE EXCEPTION 'Longitude must be between -180 and 180';
    END IF;
    
    IF ST_Y(user_location) < -90 OR ST_Y(user_location) > 90 THEN
        RAISE EXCEPTION 'Latitude must be between -90 and 90';
    END IF;

    -- Update user location
    UPDATE users 
    SET 
        location = user_location,
        location_accuracy = accuracy_meters,
        location_updated_at = NOW(),
        last_active = NOW()
    WHERE id = user_id;

    RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_location TO authenticated;

-- Create a trigger to automatically update last_active when location changes
CREATE OR REPLACE FUNCTION update_last_active_on_location_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only update last_active if location actually changed
    IF OLD.location IS DISTINCT FROM NEW.location THEN
        NEW.last_active = NOW();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_last_active_on_location
    BEFORE UPDATE OF location ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active_on_location_change();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎯 TribeFind location migration completed successfully!';
    RAISE NOTICE '✅ Location columns added to users table';
    RAISE NOTICE '✅ Spatial indexes created for performance';
    RAISE NOTICE '✅ Row Level Security policies configured';
    RAISE NOTICE '✅ Location validation functions created';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Users can now:';
    RAISE NOTICE '   - Share their location with tribe members';
    RAISE NOTICE '   - Discover nearby tribe members';
    RAISE NOTICE '   - Control location sharing preferences';
    RAISE NOTICE '   - Track location accuracy and timestamps';
END $$; 