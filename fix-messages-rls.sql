-- Fix for "new row violates row-level security policy for table messages" error

-- Drop the policy if it exists, to ensure a clean slate
DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;

-- Create a new RLS policy for inserting into messages
-- This policy allows a user to send a message if they are a participant in the chat room
CREATE POLICY "Users can send messages to their chats" 
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = messages.chat_room_id
    AND auth.uid() = ANY(chat_rooms.participants)
  )
);

-- Also ensure we have the SELECT policy for viewing messages
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = messages.chat_room_id
    AND auth.uid() = ANY(chat_rooms.participants)
  )
); 