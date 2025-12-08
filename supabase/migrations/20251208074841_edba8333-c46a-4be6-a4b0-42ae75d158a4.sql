-- Add latitude and longitude columns to worker_profiles
ALTER TABLE public.worker_profiles 
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;

-- Add latitude and longitude columns to business_profiles
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;