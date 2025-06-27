-- Demo Accounts for TestFlight and App Store Review
-- Run this in your Supabase SQL editor

-- Demo Account 1: Primary demo account for App Store review
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  'demo@tribefind.app',
  crypt('DemoUser123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Demo Account 2: Secondary test account
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  'test1@tribefind.app',
  crypt('TestUser123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Demo Account 3: Third test account for interactions
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  'test2@tribefind.app',
  crypt('TestUser123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create user profiles for demo accounts
INSERT INTO users (
  id,
  email,
  name,
  bio,
  interests,
  location,
  created_at,
  updated_at
) VALUES 
(
  (SELECT id FROM auth.users WHERE email = 'demo@tribefind.app'),
  'demo@tribefind.app',
  'Demo User',
  'Demo account for testing TribeFind features. Located in San Francisco area with diverse interests.',
  ARRAY['Photography', 'Coffee', 'Hiking', 'Technology', 'Music'],
  'San Francisco, CA',
  now(),
  now()
),
(
  (SELECT id FROM auth.users WHERE email = 'test1@tribefind.app'),
  'test1@tribefind.app',
  'Test User One',
  'First test account for beta testing. Love outdoor activities and creative pursuits.',
  ARRAY['Hiking', 'Photography', 'Coffee', 'Art', 'Travel'],
  'San Francisco, CA',
  now(),
  now()
),
(
  (SELECT id FROM auth.users WHERE email = 'test2@tribefind.app'),
  'test2@tribefind.app',
  'Test User Two',
  'Second test account for interaction testing. Focused on fitness and social activities.',
  ARRAY['Fitness', 'Music', 'Travel', 'Food', 'Sports'],
  'San Francisco, CA',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  bio = EXCLUDED.bio,
  interests = EXCLUDED.interests,
  location = EXCLUDED.location,
  updated_at = now();

-- Add some location history for demo accounts (optional)
INSERT INTO location_history (
  user_id,
  latitude,
  longitude,
  accuracy,
  created_at
) VALUES 
-- Demo User locations (San Francisco area)
(
  (SELECT id FROM auth.users WHERE email = 'demo@tribefind.app'),
  37.7749,
  -122.4194,
  10.0,
  now()
),
-- Test User 1 locations (nearby)
(
  (SELECT id FROM auth.users WHERE email = 'test1@tribefind.app'),
  37.7849,
  -122.4094,
  10.0,
  now()
),
-- Test User 2 locations (nearby)
(
  (SELECT id FROM auth.users WHERE email = 'test2@tribefind.app'),
  37.7649,
  -122.4294,
  10.0,
  now()
) ON CONFLICT DO NOTHING;

-- Create some sample activities for demo accounts
INSERT INTO user_activities (
  user_id,
  activity_name,
  is_active,
  created_at
) VALUES 
-- Demo User activities
(
  (SELECT id FROM auth.users WHERE email = 'demo@tribefind.app'),
  'Photography',
  true,
  now()
),
(
  (SELECT id FROM auth.users WHERE email = 'demo@tribefind.app'),
  'Coffee',
  true,
  now()
),
(
  (SELECT id FROM auth.users WHERE email = 'demo@tribefind.app'),
  'Hiking',
  true,
  now()
),
-- Test User 1 activities
(
  (SELECT id FROM auth.users WHERE email = 'test1@tribefind.app'),
  'Hiking',
  true,
  now()
),
(
  (SELECT id FROM auth.users WHERE email = 'test1@tribefind.app'),
  'Photography',
  true,
  now()
),
-- Test User 2 activities
(
  (SELECT id FROM auth.users WHERE email = 'test2@tribefind.app'),
  'Fitness',
  true,
  now()
),
(
  (SELECT id FROM auth.users WHERE email = 'test2@tribefind.app'),
  'Music',
  true,
  now()
) ON CONFLICT DO NOTHING;

-- Verify demo accounts were created
SELECT 
  u.email,
  p.name,
  p.bio,
  p.interests,
  p.location
FROM auth.users u
LEFT JOIN users p ON u.id = p.id
WHERE u.email IN ('demo@tribefind.app', 'test1@tribefind.app', 'test2@tribefind.app')
ORDER BY u.email; 