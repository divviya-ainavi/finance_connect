-- Add additional fields to business_profiles for richer profiles
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS company_size text;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS logo_url text;

-- Create logo storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for logo uploads
CREATE POLICY "Businesses can upload their own logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-logos' AND
  EXISTS (
    SELECT 1 FROM business_profiles bp
    JOIN profiles p ON p.id = bp.profile_id
    WHERE p.user_id = auth.uid()
    AND (storage.foldername(name))[1] = bp.id::text
  )
);

CREATE POLICY "Businesses can update their own logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-logos' AND
  EXISTS (
    SELECT 1 FROM business_profiles bp
    JOIN profiles p ON p.id = bp.profile_id
    WHERE p.user_id = auth.uid()
    AND (storage.foldername(name))[1] = bp.id::text
  )
);

CREATE POLICY "Businesses can delete their own logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-logos' AND
  EXISTS (
    SELECT 1 FROM business_profiles bp
    JOIN profiles p ON p.id = bp.profile_id
    WHERE p.user_id = auth.uid()
    AND (storage.foldername(name))[1] = bp.id::text
  )
);

CREATE POLICY "Anyone can view business logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-logos');