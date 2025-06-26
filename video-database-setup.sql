-- Video Storage Infrastructure Setup for TribeFind
-- Run this in Supabase SQL Editor to enable video functionality

-- ===================================
-- 1. CREATE VIDEOS TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 10, -- Duration in seconds (3, 5, 10, 30)
  caption TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_videos_updated_at 
  BEFORE UPDATE ON videos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 2. CREATE VIDEOS STORAGE BUCKET
-- ===================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- ===================================
-- 3. SET UP ROW LEVEL SECURITY POLICIES
-- ===================================

-- Enable RLS on videos table
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view public videos and their own videos
CREATE POLICY "Users can view public videos and own videos" ON videos
  FOR SELECT USING (
    is_public = true OR 
    auth.uid() = user_id
  );

-- Policy: Users can insert their own videos
CREATE POLICY "Users can insert own videos" ON videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own videos
CREATE POLICY "Users can update own videos" ON videos
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own videos
CREATE POLICY "Users can delete own videos" ON videos
  FOR DELETE USING (auth.uid() = user_id);

-- ===================================
-- 4. STORAGE BUCKET POLICIES
-- ===================================

-- Policy: Users can upload videos to their own folder
CREATE POLICY "Users can upload videos to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Anyone can view videos (public bucket)
CREATE POLICY "Anyone can view videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

-- Policy: Users can update videos in their own folder
CREATE POLICY "Users can update own videos in storage" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete videos from their own folder
CREATE POLICY "Users can delete own videos from storage" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ===================================
-- 5. UPDATE USERS TABLE FOR VIDEO STATS
-- ===================================

-- Add videos_shared to user stats if it doesn't exist
-- This is done safely by updating the jsonb stats column
UPDATE users 
SET stats = COALESCE(stats, '{}'::jsonb) || '{"videos_shared": 0}'::jsonb
WHERE stats IS NULL OR NOT stats ? 'videos_shared';

-- ===================================
-- 6. CREATE HELPFUL INDEXES
-- ===================================

-- Index for efficient video queries
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_public ON videos(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_videos_duration ON videos(duration);

-- ===================================
-- 7. CREATE HELPER FUNCTIONS
-- ===================================

-- Function to get user's video count
CREATE OR REPLACE FUNCTION get_user_video_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM videos 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get videos by duration
CREATE OR REPLACE FUNCTION get_videos_by_duration(duration_seconds INTEGER)
RETURNS SETOF videos AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM videos 
  WHERE duration = duration_seconds 
    AND is_public = true
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- 8. GRANT NECESSARY PERMISSIONS
-- ===================================

-- Grant usage on videos table to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON videos TO authenticated;

-- ===================================
-- VERIFICATION QUERIES
-- ===================================

-- Verify videos table was created
SELECT 'Videos table created successfully' as status 
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'videos'
);

-- Verify storage bucket was created
SELECT 'Videos storage bucket created successfully' as status
WHERE EXISTS (
  SELECT 1 FROM storage.buckets 
  WHERE id = 'videos'
);

-- Check RLS policies
SELECT 'RLS policies created successfully' as status
WHERE EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE tablename = 'videos'
);

-- ===================================
-- SUCCESS MESSAGE
-- ===================================

SELECT 
  '🎥 Video infrastructure setup completed successfully!' as message,
  'You can now record and store videos in TribeFind' as description; 