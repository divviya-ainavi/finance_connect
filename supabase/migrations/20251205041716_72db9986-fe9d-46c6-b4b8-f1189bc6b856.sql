-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view worker profiles" ON public.worker_profiles;

-- Create new policy restricting access to authenticated users only
CREATE POLICY "Authenticated users can view worker profiles" 
ON public.worker_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);