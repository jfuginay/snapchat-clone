-- ======================================
-- COMPLETE CHAT DATABASE FIX
-- ======================================
-- This fixes the missing RLS policies for chat_rooms table
-- Run this in your Supabase SQL Editor

-- Step 1: Check if chat_rooms table exists and verify structure
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'chat_rooms'
    ) THEN
        -- Create chat_rooms table if missing
        CREATE TABLE public.chat_rooms (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            type TEXT DEFAULT 'direct', -- 'direct', 'group'
            participants UUID[] NOT NULL,
            created_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE '✅ Created missing chat_rooms table';
    ELSE
        RAISE NOTICE 'ℹ️  chat_rooms table already exists';
    END IF;
END $$;

-- Step 2: Enable RLS on chat_rooms if not already enabled
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing chat_rooms policies to start fresh
DROP POLICY IF EXISTS "Users can view their chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can update their chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can delete their chat rooms" ON public.chat_rooms;

-- Step 4: Create comprehensive RLS policies for chat_rooms

-- Allow users to SELECT chat rooms where they are participants
CREATE POLICY "Users can view their chat rooms" ON public.chat_rooms
    FOR SELECT USING (auth.uid() = ANY(participants));

-- Allow users to INSERT chat rooms where they are a participant
CREATE POLICY "Users can create chat rooms" ON public.chat_rooms
    FOR INSERT WITH CHECK (
        auth.uid() = ANY(participants) 
        AND auth.uid() = created_by
    );

-- Allow users to UPDATE chat rooms where they are participants
CREATE POLICY "Users can update their chat rooms" ON public.chat_rooms
    FOR UPDATE USING (auth.uid() = ANY(participants))
    WITH CHECK (auth.uid() = ANY(participants));

-- Allow users to DELETE chat rooms they created
CREATE POLICY "Users can delete their chat rooms" ON public.chat_rooms
    FOR DELETE USING (auth.uid() = created_by);

-- Step 5: Check if messages table exists and has proper policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) THEN
        -- Create messages table if missing
        CREATE TABLE public.messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
            sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            message_type TEXT DEFAULT 'text', -- 'text', 'image', 'location'
            metadata JSONB DEFAULT '{}'::JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE '✅ Created missing messages table';
    ELSE
        RAISE NOTICE 'ℹ️  messages table already exists';
    END IF;
END $$;

-- Step 6: Enable RLS on messages and fix policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing message policies
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- Create comprehensive message policies
CREATE POLICY "Users can view messages in their chats" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_rooms
            WHERE chat_rooms.id = messages.chat_room_id
            AND auth.uid() = ANY(chat_rooms.participants)
        )
    );

CREATE POLICY "Users can send messages to their chats" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.chat_rooms
            WHERE chat_rooms.id = messages.chat_room_id
            AND auth.uid() = ANY(chat_rooms.participants)
        )
    );

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE USING (auth.uid() = sender_id);

-- Step 7: Create helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participants ON public.chat_rooms USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON public.chat_rooms (created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_updated_at ON public.chat_rooms (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_chat_room_id ON public.messages (chat_room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_room_created_at ON public.messages (chat_room_id, created_at DESC);

-- Step 8: Create a function to verify the fix
CREATE OR REPLACE FUNCTION verify_chat_database_setup()
RETURNS TABLE (
    table_name TEXT,
    exists_status TEXT,
    rls_enabled TEXT,
    policy_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        CASE WHEN t.table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END::TEXT as exists_status,
        CASE WHEN c.relrowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END::TEXT as rls_enabled,
        COALESCE(p.policy_count, 0) as policy_count
    FROM (
        SELECT 'chat_rooms'::TEXT as table_name
        UNION SELECT 'messages'::TEXT
    ) t
    LEFT JOIN pg_class c ON c.relname = t.table_name AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LEFT JOIN (
        SELECT tablename, COUNT(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename IN ('chat_rooms', 'messages')
        GROUP BY tablename
    ) p ON p.tablename = t.table_name
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Test the setup with verification
SELECT * FROM verify_chat_database_setup();

-- Step 10: Show success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 CHAT DATABASE FIX COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ chat_rooms table: Created/verified with RLS policies';
    RAISE NOTICE '✅ messages table: Created/verified with RLS policies';
    RAISE NOTICE '✅ Performance indexes: Created for fast queries';
    RAISE NOTICE '';
    RAISE NOTICE '📱 Next steps:';
    RAISE NOTICE '1. Test chat creation in your app';
    RAISE NOTICE '2. Check console logs for "✅ Chat room created successfully"';
    RAISE NOTICE '3. Verify chats appear in chat list';
    RAISE NOTICE '';
    RAISE NOTICE 'If issues persist, check the app console for detailed error logs.';
END $$;