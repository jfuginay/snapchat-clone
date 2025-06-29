-- ======================================
-- CHAT SYSTEM DIAGNOSTIC QUERIES
-- ======================================
-- Run these queries one by one to diagnose chat issues

-- 1. CHECK BASIC TABLE EXISTENCE
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'chat_rooms', 'messages', 'friendships')
ORDER BY table_name;

-- 2. CHECK RLS POLICIES FOR CHAT_ROOMS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read access'
    WHEN cmd = 'INSERT' THEN 'Create access'
    WHEN cmd = 'UPDATE' THEN 'Update access'
    WHEN cmd = 'DELETE' THEN 'Delete access'
    ELSE cmd
  END as description
FROM pg_policies 
WHERE tablename = 'chat_rooms'
ORDER BY cmd;

-- 3. CHECK YOUR USER EXISTS
SELECT 
  id,
  username,
  display_name,
  email,
  created_at,
  CASE 
    WHEN id IS NOT NULL THEN '✅ USER EXISTS'
    ELSE '❌ USER MISSING'
  END as status
FROM public.users 
WHERE id = auth.uid();

-- 4. CHECK ALL USERS (FOR TESTING CHAT PARTNERS)
SELECT 
  id,
  username,
  display_name,
  email,
  is_online,
  created_at
FROM public.users 
ORDER BY created_at DESC
LIMIT 10;

-- 5. CHECK EXISTING CHAT ROOMS (IF ANY)
SELECT 
  id,
  name,
  type,
  participants,
  created_by,
  created_at,
  CASE 
    WHEN auth.uid() = ANY(participants) THEN '✅ YOU ARE PARTICIPANT'
    ELSE '❌ NOT YOUR CHAT'
  END as access_status
FROM public.chat_rooms
ORDER BY created_at DESC;

-- 6. TEST CHAT ROOM CREATION PERMISSIONS
-- This will test if you can create a chat room
-- Replace 'OTHER_USER_ID_HERE' with an actual user ID from query #4
/*
INSERT INTO public.chat_rooms (
  name,
  type,
  participants,
  created_by
) VALUES (
  'test-chat-' || EXTRACT(EPOCH FROM NOW()),
  'direct',
  ARRAY[auth.uid(), 'OTHER_USER_ID_HERE'::uuid],
  auth.uid()
) RETURNING id, name, participants;
*/

-- 7. CHECK MESSAGES IN CHAT ROOMS (IF ANY EXIST)
SELECT 
  m.id,
  m.chat_room_id,
  m.sender_id,
  m.content,
  m.created_at,
  cr.name as chat_room_name,
  u.username as sender_username
FROM public.messages m
JOIN public.chat_rooms cr ON cr.id = m.chat_room_id
JOIN public.users u ON u.id = m.sender_id
WHERE auth.uid() = ANY(cr.participants)
ORDER BY m.created_at DESC
LIMIT 20;

-- 8. COMPREHENSIVE PERMISSIONS TEST
-- This checks if your current user can perform all chat operations
SELECT 
  'chat_rooms' as table_name,
  'SELECT' as operation,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.chat_rooms 
      WHERE auth.uid() = ANY(participants) 
      LIMIT 1
    ) OR NOT EXISTS (SELECT 1 FROM public.chat_rooms LIMIT 1)
    THEN '✅ CAN READ'
    ELSE '❌ CANNOT READ'
  END as status

UNION ALL

SELECT 
  'chat_rooms' as table_name,
  'INSERT' as operation,
  '🔄 TEST NEEDED - Try creating a chat in app' as status

UNION ALL

SELECT 
  'messages' as table_name,
  'SELECT' as operation,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.chat_rooms cr ON cr.id = m.chat_room_id
      WHERE auth.uid() = ANY(cr.participants)
      LIMIT 1
    ) OR NOT EXISTS (SELECT 1 FROM public.messages LIMIT 1)
    THEN '✅ CAN READ MESSAGES'
    ELSE '❌ CANNOT READ MESSAGES'
  END as status;

-- 9. GET YOUR USER ID FOR TESTING
-- Copy this ID to use in manual tests
SELECT 
  auth.uid() as your_user_id,
  'Copy this ID for testing' as note;

-- 10. FINAL HEALTH CHECK
SELECT 
  'Database Setup' as component,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'chat_rooms', 'messages')
    ) = 3
    AND (
      SELECT COUNT(*) FROM pg_policies 
      WHERE tablename = 'chat_rooms' AND schemaname = 'public'
    ) >= 3
    THEN '✅ READY FOR TESTING'
    ELSE '❌ NEEDS FIXES'
  END as status;