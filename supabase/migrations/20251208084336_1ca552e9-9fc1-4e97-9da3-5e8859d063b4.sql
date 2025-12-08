-- Add location constraints coordinates to worker_profiles and business_profiles
ALTER TABLE public.worker_profiles 
ADD COLUMN IF NOT EXISTS location_constraints_latitude numeric,
ADD COLUMN IF NOT EXISTS location_constraints_longitude numeric;

ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS location_constraints_latitude numeric,
ADD COLUMN IF NOT EXISTS location_constraints_longitude numeric;