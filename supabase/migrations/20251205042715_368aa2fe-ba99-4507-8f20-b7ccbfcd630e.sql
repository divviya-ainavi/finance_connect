-- Fix worker_references exposure: Only owner and admins can see
DROP POLICY IF EXISTS "Workers can view their own references" ON public.worker_references;

CREATE POLICY "Workers can view their own references" 
ON public.worker_references 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM worker_profiles wp
    JOIN profiles p ON p.id = wp.profile_id
    WHERE wp.id = worker_references.worker_profile_id 
    AND p.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- Fix business_profiles exposure: Businesses see own, workers see those with active connections
DROP POLICY IF EXISTS "Authenticated users can view business profiles" ON public.business_profiles;

CREATE POLICY "Users can view own or connected business profiles" 
ON public.business_profiles 
FOR SELECT 
USING (
  -- Business can view their own profile
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = business_profiles.profile_id 
    AND p.user_id = auth.uid()
  )
  OR
  -- Workers can view businesses they have accepted connections with
  EXISTS (
    SELECT 1 FROM connection_requests cr
    JOIN worker_profiles wp ON wp.id = cr.worker_profile_id
    JOIN profiles p ON p.id = wp.profile_id
    WHERE cr.business_profile_id = business_profiles.id
    AND cr.status = 'accepted'
    AND p.user_id = auth.uid()
  )
  OR
  -- Admins can view all
  has_role(auth.uid(), 'admin')
);

-- Fix notification_logs unrestricted insert: Only allow service role / edge functions
DROP POLICY IF EXISTS "System can insert notification logs" ON public.notification_logs;

CREATE POLICY "Service role can insert notification logs" 
ON public.notification_logs 
FOR INSERT 
WITH CHECK (
  -- Only allow insert from service role (edge functions)
  -- This uses current_setting which returns 'service_role' for edge functions
  current_setting('request.jwt.claim.role', true) = 'service_role'
  OR has_role(auth.uid(), 'admin')
);