-- Fix for "Failed to create chat" RLS error

-- Drop the policy if it exists, to ensure a clean slate
DROP POLICY IF EXISTS "Users can create chat rooms they are a participant in" ON public.chat_rooms;

-- Create a new RLS policy for inserting into chat_rooms
-- This policy allows a user to create a chat room if their own user ID is in the "participants" array.
-- This is secure and ensures users can only create chats for themselves.
CREATE POLICY "Users can create chat rooms they are a participant in" 
ON public.chat_rooms
FOR INSERT
WITH CHECK (
  auth.uid() = ANY(participants)
);

-- Also, let's add a policy for viewing chat rooms, which seems to be missing from some older setup files.
DROP POLICY IF EXISTS "Users can view chat rooms they are a participant in" ON public.chat_rooms;
CREATE POLICY "Users can view chat rooms they are a participant in"
ON public.chat_rooms
FOR SELECT
USING (
  auth.uid() = ANY(participants)
); 