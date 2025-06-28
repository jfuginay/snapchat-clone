-- 🎯 DEMO ACCOUNTS FOR APPLE REVIEW - NO EMAIL CONSTRAINT VERSION
-- Run this script in your Supabase SQL Editor
-- This version avoids ON CONFLICT issues by checking for existing users first

-- First, let's check if the database is set up properly
SELECT 'Starting demo accounts creation...' as status;

-- ============================================
-- CREATE DEMO ACCOUNTS (Avoiding ON CONFLICT)
-- ============================================

DO $$
DECLARE
    demo_user_id UUID;
    test1_user_id UUID;
    test2_user_id UUID;
BEGIN
    -- Check if demo user already exists
    SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@tribefind.app';
    
    IF demo_user_id IS NULL THEN
        -- Create demo user
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            email_change_token_new,
            recovery_token,
            aud,
            role
        ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'demo@tribefind.app',
            crypt('DemoUser123!', gen_salt('bf')),
            now(),
            now(),
            now(),
            '',
            '',
            '',
            'authenticated',
            'authenticated'
        ) RETURNING id INTO demo_user_id;
        
        RAISE NOTICE 'Created demo user: %', demo_user_id;
    ELSE
        -- Update existing demo user password
        UPDATE auth.users 
        SET encrypted_password = crypt('DemoUser123!', gen_salt('bf')),
            updated_at = now()
        WHERE id = demo_user_id;
        
        RAISE NOTICE 'Updated existing demo user: %', demo_user_id;
    END IF;

    -- Check if test1 user already exists
    SELECT id INTO test1_user_id FROM auth.users WHERE email = 'test1@tribefind.app';
    
    IF test1_user_id IS NULL THEN
        -- Create test1 user
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            email_change_token_new,
            recovery_token,
            aud,
            role
        ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'test1@tribefind.app',
            crypt('TestUser123!', gen_salt('bf')),
            now(),
            now(),
            now(),
            '',
            '',
            '',
            'authenticated',
            'authenticated'
        ) RETURNING id INTO test1_user_id;
        
        RAISE NOTICE 'Created test1 user: %', test1_user_id;
    ELSE
        -- Update existing test1 user password
        UPDATE auth.users 
        SET encrypted_password = crypt('TestUser123!', gen_salt('bf')),
            updated_at = now()
        WHERE id = test1_user_id;
        
        RAISE NOTICE 'Updated existing test1 user: %', test1_user_id;
    END IF;

    -- Check if test2 user already exists
    SELECT id INTO test2_user_id FROM auth.users WHERE email = 'test2@tribefind.app';
    
    IF test2_user_id IS NULL THEN
        -- Create test2 user
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            email_change_token_new,
            recovery_token,
            aud,
            role
        ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'test2@tribefind.app',
            crypt('TestUser123!', gen_salt('bf')),
            now(),
            now(),
            now(),
            '',
            '',
            '',
            'authenticated',
            'authenticated'
        ) RETURNING id INTO test2_user_id;
        
        RAISE NOTICE 'Created test2 user: %', test2_user_id;
    ELSE
        -- Update existing test2 user password
        UPDATE auth.users 
        SET encrypted_password = crypt('TestUser123!', gen_salt('bf')),
            updated_at = now()
        WHERE id = test2_user_id;
        
        RAISE NOTICE 'Updated existing test2 user: %', test2_user_id;
    END IF;

    RAISE NOTICE 'All demo auth accounts processed successfully';
END $$;

-- ============================================
-- CREATE USER PROFILES (if public.users table exists)
-- ============================================

DO $$
DECLARE
    demo_user_id UUID;
    test1_user_id UUID;
    test2_user_id UUID;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Get user IDs
        SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@tribefind.app';
        SELECT id INTO test1_user_id FROM auth.users WHERE email = 'test1@tribefind.app';
        SELECT id INTO test2_user_id FROM auth.users WHERE email = 'test2@tribefind.app';

        -- Demo User Profile
        IF demo_user_id IS NOT NULL THEN
            INSERT INTO public.users (
                id,
                email,
                display_name,
                username,
                avatar,
                bio,
                snap_score,
                last_active,
                is_online,
                settings,
                stats
            ) VALUES (
                demo_user_id,
                'demo@tribefind.app',
                'Demo User',
                'demo_user',
                '👤',
                'Demo account for testing TribeFind features. Located in San Francisco area with diverse interests.',
                100,
                now(),
                true,
                '{
                    "share_location": true,
                    "allow_friend_requests": true,
                    "show_online_status": true,
                    "allow_message_from_strangers": true,
                    "ghost_mode": false,
                    "privacy_level": "friends",
                    "notifications": {
                        "push_enabled": true,
                        "location_updates": true,
                        "friend_requests": true,
                        "messages": true
                    }
                }'::JSONB,
                '{
                    "snaps_shared": 25,
                    "friends_count": 2,
                    "stories_posted": 8
                }'::JSONB
            ) ON CONFLICT (id) DO UPDATE SET
                display_name = EXCLUDED.display_name,
                bio = EXCLUDED.bio,
                last_active = now(),
                is_online = true;
        END IF;

        -- Test User 1 Profile
        IF test1_user_id IS NOT NULL THEN
            INSERT INTO public.users (
                id,
                email,
                display_name,
                username,
                avatar,
                bio,
                snap_score,
                last_active,
                is_online,
                settings,
                stats
            ) VALUES (
                test1_user_id,
                'test1@tribefind.app',
                'Test User One',
                'test_user_one',
                '🏔️',
                'First test account for beta testing and Apple review. Love outdoor activities and creative pursuits.',
                85,
                now() - interval '30 minutes',
                true,
                '{
                    "share_location": true,
                    "allow_friend_requests": true,
                    "show_online_status": true,
                    "allow_message_from_strangers": true,
                    "ghost_mode": false,
                    "privacy_level": "friends",
                    "notifications": {
                        "push_enabled": true,
                        "location_updates": true,
                        "friend_requests": true,
                        "messages": true
                    }
                }'::JSONB,
                '{
                    "snaps_shared": 18,
                    "friends_count": 1,
                    "stories_posted": 5
                }'::JSONB
            ) ON CONFLICT (id) DO UPDATE SET
                display_name = EXCLUDED.display_name,
                bio = EXCLUDED.bio,
                last_active = now() - interval '30 minutes',
                is_online = true;
        END IF;

        -- Test User 2 Profile
        IF test2_user_id IS NOT NULL THEN
            INSERT INTO public.users (
                id,
                email,
                display_name,
                username,
                avatar,
                bio,
                snap_score,
                last_active,
                is_online,
                settings,
                stats
            ) VALUES (
                test2_user_id,
                'test2@tribefind.app',
                'Test User Two',
                'test_user_two',
                '💪',
                'Second test account for interaction testing and Apple review. Focused on fitness and social activities.',
                92,
                now() - interval '15 minutes',
                true,
                '{
                    "share_location": true,
                    "allow_friend_requests": true,
                    "show_online_status": true,
                    "allow_message_from_strangers": true,
                    "ghost_mode": false,
                    "privacy_level": "friends",
                    "notifications": {
                        "push_enabled": true,
                        "location_updates": true,
                        "friend_requests": true,
                        "messages": true
                    }
                }'::JSONB,
                '{
                    "snaps_shared": 31,
                    "friends_count": 1,
                    "stories_posted": 12
                }'::JSONB
            ) ON CONFLICT (id) DO UPDATE SET
                display_name = EXCLUDED.display_name,
                bio = EXCLUDED.bio,
                last_active = now() - interval '15 minutes',
                is_online = true;
        END IF;

        RAISE NOTICE 'Created/updated profiles in public.users table';
    ELSE
        RAISE NOTICE 'public.users table not found - only auth accounts created';
    END IF;
END $$;

-- ============================================
-- CREATE SAMPLE FRIENDSHIPS (if table exists)
-- ============================================

DO $$
DECLARE
    demo_user_id UUID;
    test1_user_id UUID;
    test2_user_id UUID;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'friendships') THEN
        -- Get user IDs
        SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@tribefind.app';
        SELECT id INTO test1_user_id FROM auth.users WHERE email = 'test1@tribefind.app';
        SELECT id INTO test2_user_id FROM auth.users WHERE email = 'test2@tribefind.app';

        -- Make demo and test1 friends
        IF demo_user_id IS NOT NULL AND test1_user_id IS NOT NULL THEN
            INSERT INTO public.friendships (
                id,
                requester_id,
                addressee_id,
                status,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                demo_user_id,
                test1_user_id,
                'accepted',
                now() - interval '1 day',
                now() - interval '1 day'
            ) ON CONFLICT DO NOTHING;
        END IF;

        -- Make demo and test2 friends
        IF demo_user_id IS NOT NULL AND test2_user_id IS NOT NULL THEN
            INSERT INTO public.friendships (
                id,
                requester_id,
                addressee_id,
                status,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                demo_user_id,
                test2_user_id,
                'accepted',
                now() - interval '2 days',
                now() - interval '2 days'
            ) ON CONFLICT DO NOTHING;
        END IF;

        RAISE NOTICE 'Created friendships';
    ELSE
        RAISE NOTICE 'friendships table not found - skipping friendships';
    END IF;
END $$;

-- ============================================
-- CREATE SAMPLE CHAT ROOMS AND MESSAGES (if tables exist)
-- ============================================

DO $$
DECLARE
    demo_user_id UUID;
    test1_user_id UUID;
    chat_room_id UUID;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_rooms') THEN
        -- Get user IDs
        SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@tribefind.app';
        SELECT id INTO test1_user_id FROM auth.users WHERE email = 'test1@tribefind.app';

        -- Create chat room between demo and test1
        IF demo_user_id IS NOT NULL AND test1_user_id IS NOT NULL THEN
            INSERT INTO public.chat_rooms (
                id,
                name,
                type,
                participants,
                created_by,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                'Demo & Test1 Chat',
                'direct',
                ARRAY[demo_user_id, test1_user_id],
                demo_user_id,
                now() - interval '2 hours',
                now() - interval '1 hour'
            ) RETURNING id INTO chat_room_id;

            -- Add sample messages if messages table exists
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
                INSERT INTO public.messages (
                    id,
                    chat_room_id,
                    sender_id,
                    content,
                    message_type,
                    created_at,
                    updated_at
                ) VALUES 
                (
                    gen_random_uuid(),
                    chat_room_id,
                    demo_user_id,
                    'Hi there! I noticed we share a love for photography and hiking. Would you like to explore some trails together this weekend?',
                    'text',
                    now() - interval '2 hours',
                    now() - interval '2 hours'
                ),
                (
                    gen_random_uuid(),
                    chat_room_id,
                    test1_user_id,
                    'That sounds amazing! I''ve been wanting to check out the trails in Golden Gate Park. Are you free Saturday morning?',
                    'text',
                    now() - interval '1 hour 30 minutes',
                    now() - interval '1 hour 30 minutes'
                ),
                (
                    gen_random_uuid(),
                    chat_room_id,
                    demo_user_id,
                    'Perfect! Saturday morning works great. Should we meet at the park entrance around 9 AM?',
                    'text',
                    now() - interval '1 hour',
                    now() - interval '1 hour'
                );

                RAISE NOTICE 'Created sample messages';
            END IF;
        END IF;

        RAISE NOTICE 'Created chat rooms';
    ELSE
        RAISE NOTICE 'chat_rooms table not found - skipping chat rooms';
    END IF;
END $$;

-- ============================================
-- VERIFY DEMO ACCOUNTS CREATION
-- ============================================

-- Display created auth accounts
SELECT 
    'DEMO AUTH ACCOUNTS CREATED' as section,
    '' as email,
    '' as created_at
UNION ALL
SELECT 
    '===================' as section,
    '' as email,
    '' as created_at
UNION ALL
SELECT 
    'Auth Account' as section,
    email,
    created_at::text
FROM auth.users
WHERE email IN ('demo@tribefind.app', 'test1@tribefind.app', 'test2@tribefind.app')
ORDER BY email;

-- Success message
SELECT '✅ DEMO ACCOUNTS READY FOR APPLE REVIEW!' as status;

-- ============================================
-- AUTHENTICATION INSTRUCTIONS
-- ============================================

SELECT '📋 DEMO ACCOUNTS FOR APPLE REVIEW:' as instructions
UNION ALL
SELECT '===========================================' as instructions
UNION ALL
SELECT 'Primary Demo Account:' as instructions
UNION ALL
SELECT 'Email: demo@tribefind.app' as instructions
UNION ALL
SELECT 'Password: DemoUser123!' as instructions
UNION ALL
SELECT '' as instructions
UNION ALL
SELECT 'Test Accounts:' as instructions
UNION ALL
SELECT 'Email: test1@tribefind.app (Password: TestUser123!)' as instructions
UNION ALL
SELECT 'Email: test2@tribefind.app (Password: TestUser123!)' as instructions
UNION ALL
SELECT '' as instructions
UNION ALL
SELECT 'Instructions for Apple Reviewers:' as instructions
UNION ALL
SELECT '1. Sign in with demo@tribefind.app / DemoUser123!' as instructions
UNION ALL
SELECT '2. Enable location services when prompted' as instructions
UNION ALL
SELECT '3. Test messaging with other demo accounts' as instructions
UNION ALL
SELECT '4. All accounts are pre-configured for testing' as instructions; 