
-- Add suspension columns to worker_profiles
ALTER TABLE public.worker_profiles 
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Add suspension columns to business_profiles
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Add moderation columns to reviews
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason text,
ADD COLUMN IF NOT EXISTS moderated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS moderated_by uuid;

-- Create admin_action_logs table
CREATE TABLE public.admin_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all action logs"
ON public.admin_action_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert action logs"
ON public.admin_action_logs FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create disputes table
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_profile_id uuid NOT NULL REFERENCES public.profiles(id),
  reported_profile_id uuid NOT NULL REFERENCES public.profiles(id),
  connection_request_id uuid REFERENCES public.connection_requests(id),
  dispute_type text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open',
  resolution text,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all disputes"
ON public.disputes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own disputes"
ON public.disputes FOR SELECT
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE id = reporter_profile_id
  UNION
  SELECT user_id FROM public.profiles WHERE id = reported_profile_id
));

CREATE POLICY "Users can create disputes"
ON public.disputes FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = reporter_profile_id AND user_id = auth.uid()
));

-- Create id_verifications table
CREATE TABLE public.id_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id uuid NOT NULL REFERENCES public.worker_profiles(id),
  document_type text NOT NULL,
  document_url text NOT NULL,
  status text DEFAULT 'pending',
  verified_at timestamp with time zone,
  verified_by uuid,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.id_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all ID verifications"
ON public.id_verifications FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Workers can view their own ID verifications"
ON public.id_verifications FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.worker_profiles wp
  JOIN public.profiles p ON p.id = wp.profile_id
  WHERE wp.id = id_verifications.worker_profile_id AND p.user_id = auth.uid()
));

CREATE POLICY "Workers can submit ID verifications"
ON public.id_verifications FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.worker_profiles wp
  JOIN public.profiles p ON p.id = wp.profile_id
  WHERE wp.id = worker_profile_id AND p.user_id = auth.uid()
));

-- Create qualification_uploads table
CREATE TABLE public.qualification_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id uuid NOT NULL REFERENCES public.worker_profiles(id),
  qualification_type text NOT NULL,
  document_url text NOT NULL,
  status text DEFAULT 'pending',
  verified_at timestamp with time zone,
  verified_by uuid,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.qualification_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all qualification uploads"
ON public.qualification_uploads FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Workers can view their own qualification uploads"
ON public.qualification_uploads FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.worker_profiles wp
  JOIN public.profiles p ON p.id = wp.profile_id
  WHERE wp.id = qualification_uploads.worker_profile_id AND p.user_id = auth.uid()
));

CREATE POLICY "Workers can submit qualification uploads"
ON public.qualification_uploads FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.worker_profiles wp
  JOIN public.profiles p ON p.id = wp.profile_id
  WHERE wp.id = worker_profile_id AND p.user_id = auth.uid()
));

-- Create platform_settings table
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage platform settings"
ON public.platform_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view platform settings"
ON public.platform_settings FOR SELECT
USING (true);

-- Insert default platform settings
INSERT INTO public.platform_settings (setting_key, setting_value, description) VALUES
('ranking_weights', '{"rating": 25, "review_count": 10, "availability": 15, "verification": 15, "rate_match": 15, "role_match": 10, "location_match": 10}'::jsonb, 'Weights for candidate ranking algorithm'),
('daily_connection_limit', '10'::jsonb, 'Maximum connection requests per business per day'),
('test_pass_threshold', '80'::jsonb, 'Minimum percentage to pass skills test'),
('test_lockout_days', '30'::jsonb, 'Days before retesting allowed after failure'),
('max_cv_size_mb', '10'::jsonb, 'Maximum CV file size in MB'),
('platform_maintenance', 'false'::jsonb, 'Platform maintenance mode flag');
