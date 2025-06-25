-- 🔧 Fix for nearby_tribe_members function
-- This fixes the type mismatch error between UUID and INTEGER

-- Drop and recreate the function with correct UUID[] parameter type
DROP FUNCTION IF EXISTS get_nearby_tribe_members(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, INTEGER[]);

CREATE OR REPLACE FUNCTION get_nearby_tribe_members(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER,
  activity_ids UUID[]
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

-- Success message
SELECT '✅ Fixed nearby_tribe_members function - UUID parameter type issue resolved!' as status; 