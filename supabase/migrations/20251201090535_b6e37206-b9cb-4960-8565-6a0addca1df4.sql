-- Phase 1: Remove anonymous profile option
-- Update all existing worker profiles to fully_disclosed
UPDATE worker_profiles 
SET visibility_mode = 'fully_disclosed', 
    pseudonym = NULL 
WHERE visibility_mode = 'anonymous';

-- Phase 3: Add availability calendar feature
-- Add available_from column for Airbnb-style availability
ALTER TABLE worker_profiles 
ADD COLUMN available_from DATE DEFAULT NULL;

COMMENT ON COLUMN worker_profiles.available_from IS 'Date when the worker becomes available for new work. NULL means available immediately.';