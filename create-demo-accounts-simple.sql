-- 🎯 SIMPLIFIED DEMO ACCOUNTS FOR APPLE REVIEW
-- Run this script in your Supabase SQL Editor
-- This version avoids ON CONFLICT issues with auth.users

-- ============================================
-- DEMO ACCOUNT 1: Primary for Apple Reviewers
-- ============================================

-- First, let's create the user profiles directly in the users table
-- The auth will be handled through the app's sign-up process

INSERT INTO users (
    id,
    email,
    username,
    display_name,
    avatar,
    bio,
    snap_score,
    last_active,
    is_online,
    settings,
    stats
) VALUES (
    gen_random_uuid(),
    'demo@tribefind.app',
    'demo_user',
    'Demo User',
    '👤',
    'Demo account for testing TribeFind features. Located in San Francisco area with diverse interests. This account is configured for Apple App Store review and testing purposes.',
    100,
    now(),
    true,
    jsonb_build_object(
        'share_location', true,
        'allow_friend_requests', true,
        'show_online_status', true,
        'allow_message_from_strangers', true,
        'ghost_mode', false,
        'privacy_level', 'friends',
        'notifications', jsonb_build_object(
            'push_enabled', true,
            'location_updates', true,
            'friend_requests', true,
            'messages', true
        )
    ),
    jsonb_build_object(
        'snaps_shared', 25,
        'friends_count', 2,
        'stories_posted', 8
    )
) ON CONFLICT (email) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio,
    last_active = now(),
    is_online = true;

-- ============================================
-- TEST ACCOUNT 1: For interaction testing
-- ============================================

INSERT INTO users (
    id,
    email,
    username,
    display_name,
    avatar,
    bio,
    snap_score,
    last_active,
    is_online,
    settings,
    stats
) VALUES (
    gen_random_uuid(),
    'test1@tribefind.app',
    'test_user_one',
    'Test User One',
    '🏔️',
    'First test account for beta testing and Apple review. Love outdoor activities and creative pursuits. Available for testing messaging and interaction features.',
    85,
    now() - interval '30 minutes',
    true,
    jsonb_build_object(
        'share_location', true,
        'allow_friend_requests', true,
        'show_online_status', true,
        'allow_message_from_strangers', true,
        'ghost_mode', false,
        'privacy_level', 'friends',
        'notifications', jsonb_build_object(
            'push_enabled', true,
            'location_updates', true,
            'friend_requests', true,
            'messages', true
        )
    ),
    jsonb_build_object(
        'snaps_shared', 18,
        'friends_count', 1,
        'stories_posted', 5
    )
) ON CONFLICT (email) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio,
    last_active = now() - interval '30 minutes',
    is_online = true;

-- ============================================
-- TEST ACCOUNT 2: For interaction testing
-- ============================================

INSERT INTO users (
    id,
    email,
    username,
    display_name,
    avatar,
    bio,
    snap_score,
    last_active,
    is_online,
    settings,
    stats
) VALUES (
    gen_random_uuid(),
    'test2@tribefind.app',
    'test_user_two',
    'Test User Two',
    '💪',
    'Second test account for interaction testing and Apple review. Focused on fitness and social activities. Great for demonstrating messaging and discovery features.',
    92,
    now() - interval '15 minutes',
    true,
    jsonb_build_object(
        'share_location', true,
        'allow_friend_requests', true,
        'show_online_status', true,
        'allow_message_from_strangers', true,
        'ghost_mode', false,
        'privacy_level', 'friends',
        'notifications', jsonb_build_object(
            'push_enabled', true,
            'location_updates', true,
            'friend_requests', true,
            'messages', true
        )
    ),
    jsonb_build_object(
        'snaps_shared', 31,
        'friends_count', 1,
        'stories_posted', 12
    )
) ON CONFLICT (email) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio,
    last_active = now() - interval '15 minutes',
    is_online = true;

-- ============================================
-- ADD LOCATION DATA FOR DEMO ACCOUNTS
-- ============================================

-- Demo User location (San Francisco)
INSERT INTO locations (
    id,
    user_id,
    latitude,
    longitude,
    timestamp,
    accuracy
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE email = 'demo@tribefind.app'),
    37.7749,
    -122.4194,
    now(),
    10.0
) ON CONFLICT DO NOTHING;

-- Test User 1 location (nearby in SF)
INSERT INTO locations (
    id,
    user_id,
    latitude,
    longitude,
    timestamp,
    accuracy
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE email = 'test1@tribefind.app'),
    37.7849,
    -122.4094,
    now() - interval '30 minutes',
    10.0
) ON CONFLICT DO NOTHING;

-- Test User 2 location (nearby in SF)
INSERT INTO locations (
    id,
    user_id,
    latitude,
    longitude,
    timestamp,
    accuracy
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE email = 'test2@tribefind.app'),
    37.7649,
    -122.4294,
    now() - interval '15 minutes',
    10.0
) ON CONFLICT DO NOTHING;

-- ============================================
-- CREATE SAMPLE CONVERSATIONS FOR TESTING
-- ============================================

-- Conversation between demo and test1
INSERT INTO conversations (
    id,
    user_1_id,
    user_2_id,
    last_message,
    last_message_at,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    (SELECT id FROM users WHERE email = 'demo@tribefind.app'),
    (SELECT id FROM users WHERE email = 'test1@tribefind.app'),
    'Hey! I see we both love photography and hiking. Want to explore some trails together?',
    now() - interval '1 hour',
    now() - interval '2 hours',
    now() - interval '1 hour'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'demo@tribefind.app')
  AND EXISTS (SELECT 1 FROM users WHERE email = 'test1@tribefind.app')
ON CONFLICT DO NOTHING;

-- Add sample messages to the conversation
DO $$
DECLARE
    conv_id UUID;
    demo_id UUID;
    test1_id UUID;
BEGIN
    SELECT id INTO demo_id FROM users WHERE email = 'demo@tribefind.app';
    SELECT id INTO test1_id FROM users WHERE email = 'test1@tribefind.app';
    
    SELECT id INTO conv_id FROM conversations 
    WHERE (user_1_id = demo_id AND user_2_id = test1_id)
       OR (user_1_id = test1_id AND user_2_id = demo_id);

    IF conv_id IS NOT NULL THEN
        INSERT INTO messages (
            id,
            conversation_id,
            sender_id,
            content,
            timestamp,
            created_at
        ) VALUES 
        (
            gen_random_uuid(),
            conv_id,
            demo_id,
            'Hi there! I noticed we share a love for photography and hiking. Would you like to explore some trails together this weekend?',
            now() - interval '2 hours',
            now() - interval '2 hours'
        ),
        (
            gen_random_uuid(),
            conv_id,
            test1_id,
            'That sounds amazing! I''ve been wanting to check out the trails in Golden Gate Park. Are you free Saturday morning?',
            now() - interval '1 hour 30 minutes',
            now() - interval '1 hour 30 minutes'
        ),
        (
            gen_random_uuid(),
            conv_id,
            demo_id,
            'Perfect! Saturday morning works great. Should we meet at the park entrance around 9 AM?',
            now() - interval '1 hour',
            now() - interval '1 hour'
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- VERIFY DEMO ACCOUNTS CREATION
-- ============================================

-- Display created accounts for verification
SELECT 
    'DEMO ACCOUNTS SUMMARY' as section,
    '' as email,
    '' as display_name,
    '' as username,
    '' as bio_preview
UNION ALL
SELECT 
    '===================' as section,
    '' as email,
    '' as display_name,
    '' as username,
    '' as bio_preview
UNION ALL
SELECT 
    'Account' as section,
    email,
    display_name,
    username,
    LEFT(bio, 50) || '...' as bio_preview
FROM users
WHERE email IN ('demo@tribefind.app', 'test1@tribefind.app', 'test2@tribefind.app')
ORDER BY email;

-- Display location data
SELECT 
    u.email,
    u.display_name,
    l.latitude,
    l.longitude,
    'San Francisco, CA' as location_name
FROM users u
LEFT JOIN locations l ON u.id = l.user_id
WHERE u.email IN ('demo@tribefind.app', 'test1@tribefind.app', 'test2@tribefind.app')
ORDER BY u.email;

-- Display conversation count
SELECT 
    'Sample conversations created: ' || count(*)::text as summary
FROM conversations c
JOIN users u1 ON c.user_1_id = u1.id
JOIN users u2 ON c.user_2_id = u2.id
WHERE u1.email IN ('demo@tribefind.app', 'test1@tribefind.app', 'test2@tribefind.app')
   OR u2.email IN ('demo@tribefind.app', 'test1@tribefind.app', 'test2@tribefind.app');

-- Success message
SELECT '✅ DEMO ACCOUNTS READY FOR APPLE REVIEW!' as status;

-- ============================================
-- IMPORTANT: AUTHENTICATION SETUP
-- ============================================

SELECT '📋 NEXT STEPS FOR DEMO ACCOUNTS:' as instructions
UNION ALL
SELECT '1. Use the app to sign up with these emails:'
UNION ALL
SELECT '   - demo@tribefind.app (password: DemoUser123!)'
UNION ALL
SELECT '   - test1@tribefind.app (password: TestUser123!)'
UNION ALL
SELECT '   - test2@tribefind.app (password: TestUser123!)'
UNION ALL
SELECT '2. The profiles above will be linked automatically'
UNION ALL
SELECT '3. Test interactions between the accounts'
UNION ALL
SELECT '4. Provide demo@tribefind.app credentials to Apple reviewers'; 