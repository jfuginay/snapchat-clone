-- Supabase Database Setup Script for Snapchat Clone
-- Run this in your Supabase SQL Editor to create the required tables

-- First, drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.chat_rooms CASCADE;
DROP TABLE IF EXISTS public.friendships CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT DEFAULT '😊',
  bio TEXT DEFAULT '',
  snap_score INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  is_online BOOLEAN DEFAULT true,
  auth_provider TEXT DEFAULT 'email',
  settings JSONB DEFAULT '{
    "share_location": false,
    "allow_friend_requests": true,
    "show_online_status": true,
    "allow_message_from_strangers": false,
    "ghost_mode": false,
    "privacy_level": "friends",
    "notifications": {
      "push_enabled": true,
      "location_updates": true,
      "friend_requests": true,
      "messages": true
    }
  }'::JSONB,
  stats JSONB DEFAULT '{
    "snaps_shared": 0,
    "friends_count": 0,
    "stories_posted": 0
  }'::JSONB,
  location JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create locations table for real-time location sharing
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  accuracy DECIMAL(8, 2),
  heading DECIMAL(6, 2),
  speed DECIMAL(8, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Create chat_rooms table
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'direct', -- 'direct', 'group'
  participants UUID[] NOT NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
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

-- Create photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  location JSONB,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_locations_user_id ON public.locations(user_id);
CREATE INDEX idx_locations_timestamp ON public.locations(timestamp);
CREATE INDEX idx_messages_chat_room_id ON public.messages(chat_room_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX idx_photos_user_id ON public.photos(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users table policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Locations table policies
DROP POLICY IF EXISTS "Users can view friend locations" ON public.locations;
CREATE POLICY "Users can view friend locations" ON public.locations
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE ((requester_id = auth.uid() AND addressee_id = user_id) OR
             (requester_id = user_id AND addressee_id = auth.uid()))
      AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Users can insert own location" ON public.locations;
CREATE POLICY "Users can insert own location" ON public.locations
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own location" ON public.locations;
CREATE POLICY "Users can update own location" ON public.locations
  FOR UPDATE USING (user_id = auth.uid());

-- Friendships table policies
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (requester_id = auth.uid() OR addressee_id = auth.uid());

DROP POLICY IF EXISTS "Users can create friendship requests" ON public.friendships;
CREATE POLICY "Users can create friendship requests" ON public.friendships
  FOR INSERT WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "Users can update friendships they're involved in" ON public.friendships;
CREATE POLICY "Users can update friendships they're involved in" ON public.friendships
  FOR UPDATE USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Messages table policies
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE chat_rooms.id = messages.chat_room_id
      AND auth.uid() = ANY(chat_rooms.participants)
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;
CREATE POLICY "Users can send messages to their chats" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE chat_rooms.id = messages.chat_room_id
      AND auth.uid() = ANY(chat_rooms.participants)
    )
  );

-- Photos table policies
DROP POLICY IF EXISTS "Users can view public photos and own photos" ON public.photos;
CREATE POLICY "Users can view public photos and own photos" ON public.photos
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own photos" ON public.photos;
CREATE POLICY "Users can insert own photos" ON public.photos
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own photos" ON public.photos;
CREATE POLICY "Users can update own photos" ON public.photos
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own photos" ON public.photos;
CREATE POLICY "Users can delete own photos" ON public.photos
  FOR DELETE USING (user_id = auth.uid());

-- Chat rooms policies
DROP POLICY IF EXISTS "Users can view their chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can view their chat rooms" ON public.chat_rooms
  FOR SELECT USING (auth.uid() = ANY(participants));

DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can create chat rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_locations_updated_at ON public.locations;
DROP TRIGGER IF EXISTS update_chat_rooms_updated_at ON public.chat_rooms;
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
DROP TRIGGER IF EXISTS update_friendships_updated_at ON public.friendships;
DROP TRIGGER IF EXISTS update_photos_updated_at ON public.photos;

-- Create triggers for updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON public.chat_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON public.photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time subscriptions (remove from publication first if exists)
DO $$
BEGIN
  -- Try to remove tables from publication (ignore errors if they don't exist)
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.users;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.locations;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.friendships;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;

-- Add tables to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;

COMMIT; 