-- Debug script to check chat messages and participants
-- Run this in your Supabase SQL Editor to debug the chat issue

-- Check your current user ID (replace with your actual email)
SELECT id, email, username, display_name 
FROM auth.users 
WHERE email = 'james.markus.wylie@gmail.com';

-- Check all chat rooms you're participating in
SELECT 
    cr.id,
    cr.name,
    cr.type,
    cr.participants,
    cr.created_by,
    cr.created_at
FROM public.chat_rooms cr
WHERE 'your-user-id-here' = ANY(cr.participants);

-- Check messages in your chat rooms (replace 'your-chat-room-id' with actual chat room ID)
SELECT 
    m.id,
    m.content,
    m.sender_id,
    m.created_at,
    u.username as sender_username,
    u.display_name as sender_display_name
FROM public.messages m
JOIN public.users u ON m.sender_id = u.id
WHERE m.chat_room_id = 'your-chat-room-id-here'
ORDER BY m.created_at;

-- Check if you have duplicate user records
SELECT id, email, username, display_name 
FROM public.users 
WHERE email = 'james.markus.wylie@gmail.com'; 