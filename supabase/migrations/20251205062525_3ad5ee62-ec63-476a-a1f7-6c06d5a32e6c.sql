-- Allow admins to update worker profiles (for approval)
CREATE POLICY "Admins can update worker profiles"
ON public.worker_profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Drop the problematic recursive policy on business_profiles
DROP POLICY IF EXISTS "Users can view own or connected business profiles" ON public.business_profiles;

-- Create a simpler non-recursive policy
CREATE POLICY "Users can view business profiles"
ON public.business_profiles
FOR SELECT
USING (
  -- Own profile
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = business_profiles.profile_id AND p.user_id = auth.uid())
  OR
  -- Admins can view all
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Any authenticated user can view (for search/connection purposes)
  auth.uid() IS NOT NULL
);