-- Add worker approval status to worker_profiles
ALTER TABLE public.worker_profiles 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'active', 'declined')),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approval_notes text;

-- Add insurance field to id_verifications table
ALTER TABLE public.id_verifications
ADD COLUMN IF NOT EXISTS is_insurance boolean DEFAULT false;