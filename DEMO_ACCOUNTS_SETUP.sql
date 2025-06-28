-- 🎯 DEMO ACCOUNTS FOR APPLE REVIEW
-- Run this script in your Supabase SQL Editor
-- These accounts are specifically for App Store Connect submission

-- ============================================
-- DEMO ACCOUNT 1: Primary for Apple Reviewers
-- ============================================
DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    -- Create auth user for demo account
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
    ) 
    ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt('DemoUser123!', gen_salt('bf')),
        updated_at = now()
    RETURNING id INTO demo_user_id;

    -- Get the user ID if it already existed
    IF demo_user_id IS NULL THEN
        SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@tribefind.app';
    END IF;

    -- Create user profile
    INSERT INTO users (
        id,
        email,
        name,
        bio,
        interests,
        location,
        latitude,
        longitude,
        created_at,
        updated_at
    ) VALUES (
        demo_user_id,
        'demo@tribefind.app',
        'Demo User',
        'Demo account for testing TribeFind features. Located in San Francisco area with diverse interests. This account is configured for Apple App Store review and testing purposes.',
        ARRAY['Photography', 'Coffee', 'Hiking', 'Technology', 'Music', 'Travel', 'Food', 'Art'],
        'San Francisco, CA',
        37.7749,
        -122.4194,
        now(),
        now()
    ) 
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        interests = EXCLUDED.interests,
        location = EXCLUDED.location,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        updated_at = now();

    -- Add location history
    INSERT INTO location_history (
        user_id,
        latitude,
        longitude,
        accuracy,
        created_at
    ) VALUES (
        demo_user_id,
        37.7749,
        -122.4194,
        10.0,
        now()
    ) ON CONFLICT DO NOTHING;

    -- Add user activities
    INSERT INTO user_activities (user_id, activity_name, is_active, created_at)
    VALUES 
        (demo_user_id, 'Photography', true, now()),
        (demo_user_id, 'Coffee', true, now()),
        (demo_user_id, 'Hiking', true, now()),
        (demo_user_id, 'Technology', true, now()),
        (demo_user_id, 'Music', true, now())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Demo account created: demo@tribefind.app';
END $$;

-- ============================================
-- TEST ACCOUNT 1: For interaction testing
-- ============================================
DO $$
DECLARE
    test1_user_id UUID;
BEGIN
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
    ) 
    ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt('TestUser123!', gen_salt('bf')),
        updated_at = now()
    RETURNING id INTO test1_user_id;

    IF test1_user_id IS NULL THEN
        SELECT id INTO test1_user_id FROM auth.users WHERE email = 'test1@tribefind.app';
    END IF;

    INSERT INTO users (
        id,
        email,
        name,
        bio,
        interests,
        location,
        latitude,
        longitude,
        created_at,
        updated_at
    ) VALUES (
        test1_user_id,
        'test1@tribefind.app',
        'Test User One',
        'First test account for beta testing and Apple review. Love outdoor activities and creative pursuits. Available for testing messaging and interaction features.',
        ARRAY['Hiking', 'Photography', 'Coffee', 'Art', 'Travel', 'Nature', 'Fitness'],
        'San Francisco, CA',
        37.7849,
        -122.4094,
        now(),
        now()
    ) 
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        interests = EXCLUDED.interests,
        location = EXCLUDED.location,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        updated_at = now();

    INSERT INTO location_history (
        user_id,
        latitude,
        longitude,
        accuracy,
        created_at
    ) VALUES (
        test1_user_id,
        37.7849,
        -122.4094,
        10.0,
        now()
    ) ON CONFLICT DO NOTHING;

    INSERT INTO user_activities (user_id, activity_name, is_active, created_at)
    VALUES 
        (test1_user_id, 'Hiking', true, now()),
        (test1_user_id, 'Photography', true, now()),
        (test1_user_id, 'Coffee', true, now()),
        (test1_user_id, 'Art', true, now())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Test account 1 created: test1@tribefind.app';
END $$;

-- ============================================
-- TEST ACCOUNT 2: For interaction testing
-- ============================================
DO $$
DECLARE
    test2_user_id UUID;
BEGIN
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
    ) 
    ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt('TestUser123!', gen_salt('bf')),
        updated_at = now()
    RETURNING id INTO test2_user_id;

    IF test2_user_id IS NULL THEN
        SELECT id INTO test2_user_id FROM auth.users WHERE email = 'test2@tribefind.app';
    END IF;

    INSERT INTO users (
        id,
        email,
        name,
        bio,
        interests,
        location,
        latitude,
        longitude,
        created_at,
        updated_at
    ) VALUES (
        test2_user_id,
        'test2@tribefind.app',
        'Test User Two',
        'Second test account for interaction testing and Apple review. Focused on fitness and social activities. Great for demonstrating messaging and discovery features.',
        ARRAY['Fitness', 'Music', 'Travel', 'Food', 'Sports', 'Dancing', 'Yoga'],
        'San Francisco, CA',
        37.7649,
        -122.4294,
        now(),
        now()
    ) 
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        interests = EXCLUDED.interests,
        location = EXCLUDED.location,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        updated_at = now();

    INSERT INTO location_history (
        user_id,
        latitude,
        longitude,
        accuracy,
        created_at
    ) VALUES (
        test2_user_id,
        37.7649,
        -122.4294,
        10.0,
        now()
    ) ON CONFLICT DO NOTHING;

    INSERT INTO user_activities (user_id, activity_name, is_active, created_at)
    VALUES 
        (test2_user_id, 'Fitness', true, now()),
        (test2_user_id, 'Music', true, now()),
        (test2_user_id, 'Travel', true, now()),
        (test2_user_id, 'Food', true, now())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Test account 2 created: test2@tribefind.app';
END $$;

-- ============================================
-- CREATE SAMPLE CONVERSATIONS FOR TESTING
-- ============================================

-- Create a sample conversation between demo and test1
INSERT INTO conversations (
    id,
    participant_1_id,
    participant_2_id,
    last_message,
    last_message_at,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    (SELECT id FROM auth.users WHERE email = 'demo@tribefind.app'),
    (SELECT id FROM auth.users WHERE email = 'test1@tribefind.app'),
    'Hey! I see we both love photography and hiking. Want to explore some trails together?',
    now() - interval '1 hour',
    now() - interval '2 hours',
    now() - interval '1 hour'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo@tribefind.app')
  AND EXISTS (SELECT 1 FROM auth.users WHERE email = 'test1@tribefind.app')
ON CONFLICT DO NOTHING;

-- Add sample messages to the conversation
DO $$
DECLARE
    conv_id UUID;
    demo_id UUID;
    test1_id UUID;
BEGIN
    SELECT id INTO demo_id FROM auth.users WHERE email = 'demo@tribefind.app';
    SELECT id INTO test1_id FROM auth.users WHERE email = 'test1@tribefind.app';
    
    SELECT id INTO conv_id FROM conversations 
    WHERE (participant_1_id = demo_id AND participant_2_id = test1_id)
       OR (participant_1_id = test1_id AND participant_2_id = demo_id);

    IF conv_id IS NOT NULL THEN
        INSERT INTO messages (
            id,
            conversation_id,
            sender_id,
            content,
            created_at
        ) VALUES 
        (
            gen_random_uuid(),
            conv_id,
            demo_id,
            'Hi there! I noticed we share a love for photography and hiking. Would you like to explore some trails together this weekend?',
            now() - interval '2 hours'
        ),
        (
            gen_random_uuid(),
            conv_id,
            test1_id,
            'That sounds amazing! I''ve been wanting to check out the trails in Golden Gate Park. Are you free Saturday morning?',
            now() - interval '1 hour 30 minutes'
        ),
        (
            gen_random_uuid(),
            conv_id,
            demo_id,
            'Perfect! Saturday morning works great. Should we meet at the park entrance around 9 AM?',
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
    '' as name,
    '' as location,
    '' as interests_count
UNION ALL
SELECT 
    '===================' as section,
    '' as email,
    '' as name,
    '' as location,
    '' as interests_count
UNION ALL
SELECT 
    'Account' as section,
    u.email,
    p.name,
    p.location,
    array_length(p.interests, 1)::text as interests_count
FROM auth.users u
LEFT JOIN users p ON u.id = p.id
WHERE u.email IN ('demo@tribefind.app', 'test1@tribefind.app', 'test2@tribefind.app')
ORDER BY u.email;

-- Display interests for each account
SELECT 
    u.email,
    unnest(p.interests) as interest
FROM auth.users u
JOIN users p ON u.id = p.id
WHERE u.email IN ('demo@tribefind.app', 'test1@tribefind.app', 'test2@tribefind.app')
ORDER BY u.email, interest;

-- Display conversation count
SELECT 
    'Sample conversations created: ' || count(*)::text as summary
FROM conversations c
JOIN auth.users u1 ON c.participant_1_id = u1.id
JOIN auth.users u2 ON c.participant_2_id = u2.id
WHERE u1.email IN ('demo@tribefind.app', 'test1@tribefind.app', 'test2@tribefind.app')
   OR u2.email IN ('demo@tribefind.app', 'test1@tribefind.app', 'test2@tribefind.app');

-- Success message
SELECT '✅ DEMO ACCOUNTS READY FOR APPLE REVIEW!' as status; 