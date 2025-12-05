-- Add policy for businesses to update their own connection requests (for payment)
CREATE POLICY "Businesses can update their own connection requests"
ON public.connection_requests
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM business_profiles
  JOIN profiles ON profiles.id = business_profiles.profile_id
  WHERE business_profiles.id = connection_requests.business_profile_id
  AND profiles.user_id = auth.uid()
));