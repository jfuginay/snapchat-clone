-- ============================================================================
-- TWITTER AUTHENTICATION DATABASE MIGRATION
-- ============================================================================
-- This migration adds support for Twitter OAuth authentication to TribeFind
-- Run this in your Supabase SQL Editor after setting up Twitter OAuth
-- ============================================================================

-- Add social accounts column to store Twitter and other social platform data
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS social_accounts JSONB DEFAULT '{}';

-- Add auth provider column to track how user signed up
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- Add profile completion status
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;

-- Update existing users to mark them as having complete profiles
UPDATE users 
SET profile_complete = true 
WHERE auth_provider = 'email' OR auth_provider IS NULL;

-- Create index for efficient Twitter ID lookups
CREATE INDEX IF NOT EXISTS idx_users_twitter_id 
ON users USING gin((social_accounts->'twitter'->>'id'));

-- Create index for auth provider filtering
CREATE INDEX IF NOT EXISTS idx_users_auth_provider 
ON users (auth_provider);

-- Create index for profile completion status
CREATE INDEX IF NOT EXISTS idx_users_profile_complete 
ON users (profile_complete);

-- Add comments for documentation
COMMENT ON COLUMN users.social_accounts IS 'JSONB column storing social media account data (Twitter, etc.)';
COMMENT ON COLUMN users.auth_provider IS 'Authentication method used: email, twitter, google, etc.';
COMMENT ON COLUMN users.profile_complete IS 'Whether user has completed their profile setup';

-- Example social_accounts structure:
-- {
--   "twitter": {
--     "id": "1234567890",
--     "username": "johndoe",
--     "verified": false,
--     "followers": 150,
--     "following": 300
--   }
-- }

-- ============================================================================
-- ROW LEVEL SECURITY UPDATES
-- ============================================================================

-- No changes needed to existing RLS policies as they work with auth.uid()
-- Twitter users will have their user_id set to their Twitter ID

-- ============================================================================
-- FUNCTIONS FOR TWITTER AUTHENTICATION
-- ============================================================================

-- Function to find user by Twitter ID
CREATE OR REPLACE FUNCTION get_user_by_twitter_id(twitter_id TEXT)
RETURNS TABLE (
    id TEXT,
    username TEXT,
    display_name TEXT,
    email TEXT,
    social_accounts JSONB,
    auth_provider TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.display_name,
        u.email,
        u.social_accounts,
        u.auth_provider
    FROM users u
    WHERE u.social_accounts->'twitter'->>'id' = twitter_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if Twitter username is available
CREATE OR REPLACE FUNCTION is_twitter_username_available(desired_username TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM users 
        WHERE username = desired_username
    ) INTO user_exists;
    
    RETURN NOT user_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique username for Twitter users
CREATE OR REPLACE FUNCTION generate_unique_twitter_username(base_username TEXT)
RETURNS TEXT AS $$
DECLARE
    final_username TEXT;
    counter INTEGER := 1;
BEGIN
    final_username := 'tw_' || base_username;
    
    -- If base username is available, return it
    IF is_twitter_username_available(final_username) THEN
        RETURN final_username;
    END IF;
    
    -- Otherwise, append counter until we find available username
    LOOP
        final_username := 'tw_' || base_username || '_' || counter;
        
        IF is_twitter_username_available(final_username) THEN
            RETURN final_username;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 999 THEN
            RETURN 'tw_' || base_username || '_' || extract(epoch from now())::int;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert a sample Twitter user (for testing only - remove in production)
/*
INSERT INTO users (
    id,
    username,
    display_name,
    email,
    avatar,
    bio,
    auth_provider,
    social_accounts,
    profile_complete,
    settings,
    stats
) VALUES (
    'twitter_123456789',
    'tw_testuser',
    'Test Twitter User',
    'testuser@twitter.local',
    '🐦',
    'Twitter user testing TribeFind integration',
    'twitter',
    '{"twitter": {"id": "123456789", "username": "testuser", "verified": false, "followers": 100, "following": 200}}',
    true,
    '{
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
    }',
    '{
        "snaps_shared": 0,
        "friends_count": 0,
        "stories_posted": 0
    }'
) ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if migration was successful
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND column_name IN ('social_accounts', 'auth_provider', 'profile_complete');

-- Check if indexes were created
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'users' 
    AND indexname LIKE '%twitter%' 
    OR indexname LIKE '%auth_provider%' 
    OR indexname LIKE '%profile_complete%';

-- Check if functions were created
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'get_user_by_twitter_id',
    'is_twitter_username_available', 
    'generate_unique_twitter_username'
);

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

/*
-- To rollback this migration, run these commands:

-- Drop functions
DROP FUNCTION IF EXISTS get_user_by_twitter_id(TEXT);
DROP FUNCTION IF EXISTS is_twitter_username_available(TEXT);
DROP FUNCTION IF EXISTS generate_unique_twitter_username(TEXT);

-- Drop indexes
DROP INDEX IF EXISTS idx_users_twitter_id;
DROP INDEX IF EXISTS idx_users_auth_provider;
DROP INDEX IF EXISTS idx_users_profile_complete;

-- Drop columns (WARNING: This will delete data!)
ALTER TABLE users DROP COLUMN IF EXISTS social_accounts;
ALTER TABLE users DROP COLUMN IF EXISTS auth_provider;
ALTER TABLE users DROP COLUMN IF EXISTS profile_complete;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE 'Twitter authentication migration completed successfully!';
    RAISE NOTICE 'You can now use Twitter OAuth in your TribeFind app.';
    RAISE NOTICE 'Remember to:';
    RAISE NOTICE '1. Add Twitter credentials to your .env file';
    RAISE NOTICE '2. Configure callback URL in Twitter Developer Portal';
    RAISE NOTICE '3. Test the authentication flow';
END $$; 