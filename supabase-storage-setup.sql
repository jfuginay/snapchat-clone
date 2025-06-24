-- Supabase Storage Setup for Photos
-- Run this in your Supabase SQL Editor after running the main database setup

-- Create the photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload their own photos
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view all public photos
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

-- Policy: Users can update their own photos
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Photos storage bucket created successfully!';
  RAISE NOTICE 'Users can now upload, view, and manage photos.';
END $$; 