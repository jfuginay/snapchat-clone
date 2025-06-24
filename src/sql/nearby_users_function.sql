-- TribeFind: PostGIS function to find nearby tribe members
-- This function should be run in your Supabase SQL Editor

-- Create the nearby_users RPC function
CREATE OR REPLACE FUNCTION nearby_users(
    user_lat FLOAT,
    user_lng FLOAT, 
    radius_meters INT DEFAULT 5000
)
RETURNS TABLE (
    id UUID,
    username TEXT,
    display_name TEXT,
    avatar TEXT,
    location GEOMETRY,
    last_active TIMESTAMPTZ,
    is_online BOOLEAN,
    distance_meters FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.display_name,
        u.avatar,
        u.location,
        u.last_active,
        u.is_online,
        ST_Distance(
            u.location::geography,
            ST_Point(user_lng, user_lat)::geography
        ) as distance_meters
    FROM users u
    WHERE 
        u.location IS NOT NULL
        AND u.id != auth.uid() -- Exclude current user
        AND ST_DWithin(
            u.location::geography,
            ST_Point(user_lng, user_lat)::geography,
            radius_meters
        )
    ORDER BY distance_meters ASC
    LIMIT 50; -- Limit to 50 nearby users for performance
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION nearby_users TO authenticated;

-- Create an index on location for better performance
CREATE INDEX IF NOT EXISTS users_location_gist_idx ON users USING GIST (location);

-- Create an index on location_updated_at for recent location queries
CREATE INDEX IF NOT EXISTS users_location_updated_at_idx ON users (location_updated_at DESC);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'TribeFind nearby_users function created successfully!';
    RAISE NOTICE 'Users can now find tribe members within specified radius.';
END $$; 