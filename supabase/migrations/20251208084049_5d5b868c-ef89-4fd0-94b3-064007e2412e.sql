-- Add location constraints columns to business_profiles
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS max_commute_km integer,
ADD COLUMN IF NOT EXISTS travel_time_minutes integer,
ADD COLUMN IF NOT EXISTS location_constraints text;