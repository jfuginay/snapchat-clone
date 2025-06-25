-- PostGIS function to find nearby tribe members with shared activities
-- This function uses ST_DWithin for efficient spatial queries

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

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS users_location_gist_idx ON users USING GIST (location::geography);
CREATE INDEX IF NOT EXISTS users_is_online_idx ON users (is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS user_activities_user_id_idx ON user_activities (user_id);
CREATE INDEX IF NOT EXISTS user_activities_activity_id_idx ON user_activities (activity_id);

-- Example usage:
-- SELECT * FROM get_nearby_tribe_members(37.7749, -122.4194, 10000, ARRAY[1, 2, 3]); 