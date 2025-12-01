-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_request_id UUID NOT NULL REFERENCES public.connection_requests(id) ON DELETE CASCADE,
  reviewer_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('worker', 'business')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL CHECK (LENGTH(content) >= 50),
  rating_categories JSONB DEFAULT '{}',
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_review_per_connection UNIQUE(connection_request_id, reviewer_profile_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all reviews
CREATE POLICY "Authenticated users can view reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

-- Users can create reviews for connections they're part of
CREATE POLICY "Users can create reviews for their connections"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.connection_requests cr
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE cr.id = connection_request_id
    AND cr.status = 'accepted'
    AND (
      (reviewer_type = 'worker' AND EXISTS (
        SELECT 1 FROM public.worker_profiles wp
        WHERE wp.profile_id = p.id AND wp.id = cr.worker_profile_id
      ))
      OR
      (reviewer_type = 'business' AND EXISTS (
        SELECT 1 FROM public.business_profiles bp
        WHERE bp.profile_id = p.id AND bp.id = cr.business_profile_id
      ))
    )
  )
);

-- Users can update their own reviews (within 7 days)
CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = reviewer_profile_id
    AND profiles.user_id = auth.uid()
  )
  AND created_at > NOW() - INTERVAL '7 days'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = reviewer_profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_reviews_reviewee ON public.reviews(reviewee_profile_id);
CREATE INDEX idx_reviews_connection ON public.reviews(connection_request_id);