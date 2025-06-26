-- ===================================
-- CREATE VIDEOS STORAGE BUCKET
-- ===================================
-- Run this in Supabase SQL Editor to create the videos bucket

-- Create the videos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'videos', 
  'videos', 
  true,  -- public bucket for easy access
  52428800,  -- 50MB file size limit (good for short videos)
  ARRAY['video/mp4', 'video/quicktime', 'video/mov']  -- allowed video formats
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ===================================
-- CREATE STORAGE POLICIES FOR VIDEOS
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
  ) WITH CHECK (
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
-- VERIFICATION
-- ===================================

-- Verify the bucket was created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'videos';

-- Show storage policies for videos bucket
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%video%';

-- Success message
SELECT '🎥 Videos storage bucket created successfully!' as status; 