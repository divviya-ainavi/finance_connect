-- Add RLS policy for cvs bucket to allow authenticated users to view CVs
CREATE POLICY "Authenticated users can view CVs"
ON storage.objects FOR SELECT
USING (bucket_id = 'cvs' AND auth.uid() IS NOT NULL);

-- Workers can upload their own CVs
CREATE POLICY "Workers can upload their own CVs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Workers can update their own CVs
CREATE POLICY "Workers can update their own CVs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Workers can delete their own CVs
CREATE POLICY "Workers can delete their own CVs"
ON storage.objects FOR DELETE
USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);