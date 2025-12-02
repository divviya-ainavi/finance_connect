-- Add photo_url column to worker_profiles
ALTER TABLE worker_profiles ADD COLUMN photo_url text;

-- Create profile-photos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true);

-- RLS policy for photo uploads (workers can upload their own)
CREATE POLICY "Workers can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy for viewing photos (public)
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- RLS policy for workers to update their own photos
CREATE POLICY "Workers can update their own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy for workers to delete their own photos
CREATE POLICY "Workers can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);