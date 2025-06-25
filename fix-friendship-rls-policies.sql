-- 🔧 Fix Friendship RLS Policies
-- This fixes the issue where friendship status updates are blocked by RLS policies

-- Drop existing friendship policies
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can create friendship requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update friendships they're involved in" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete friendships they're involved in" ON public.friendships;

-- Create new comprehensive RLS policies for friendships table

-- 1. Allow users to view friendships they're involved in
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (
    requester_id = auth.uid() OR addressee_id = auth.uid()
  );

-- 2. Allow users to create friendship requests (as requester only)
CREATE POLICY "Users can create friendship requests" ON public.friendships
  FOR INSERT WITH CHECK (
    requester_id = auth.uid()
  );

-- 3. Allow BOTH users to update friendship status
-- This is the key fix - both requester and addressee can update the record
CREATE POLICY "Users can update friendships they're involved in" ON public.friendships
  FOR UPDATE USING (
    requester_id = auth.uid() OR addressee_id = auth.uid()
  ) WITH CHECK (
    requester_id = auth.uid() OR addressee_id = auth.uid()
  );

-- 4. Allow users to delete friendships they're involved in
CREATE POLICY "Users can delete friendships they're involved in" ON public.friendships
  FOR DELETE USING (
    requester_id = auth.uid() OR addressee_id = auth.uid()
  );

-- 5. Verify RLS is enabled
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎯 Friendship RLS Policies Fixed!';
  RAISE NOTICE '✅ Both requester and addressee can now update friendship status';
  RAISE NOTICE '✅ This should fix the accept friend request issue';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test by accepting a friend request again';
END $$; 