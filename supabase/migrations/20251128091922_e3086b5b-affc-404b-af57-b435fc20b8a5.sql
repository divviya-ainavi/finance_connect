-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.user_type AS ENUM ('worker', 'business');
CREATE TYPE public.finance_role AS ENUM (
  'accounts_payable',
  'accounts_receivable', 
  'bookkeeper',
  'payroll_clerk',
  'management_accountant',
  'credit_controller',
  'financial_controller'
);
CREATE TYPE public.onsite_preference AS ENUM ('fully_remote', 'hybrid', 'onsite');
CREATE TYPE public.visibility_mode AS ENUM ('anonymous', 'fully_disclosed');
CREATE TYPE public.verification_status AS ENUM ('not_started', 'in_progress', 'completed', 'verified', 'passed');
CREATE TYPE public.connection_status AS ENUM ('pending', 'accepted', 'declined');

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type public.user_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Worker profiles table
CREATE TABLE public.worker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pseudonym TEXT,
  roles public.finance_role[] NOT NULL DEFAULT '{}',
  location TEXT,
  max_commute_km INTEGER,
  onsite_preference public.onsite_preference,
  max_days_onsite INTEGER,
  availability JSONB DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  company_sizes TEXT[] DEFAULT '{}',
  qualifications TEXT,
  languages JSONB DEFAULT '{}',
  systems TEXT[] DEFAULT '{}',
  own_equipment BOOLEAN DEFAULT false,
  visibility_mode public.visibility_mode DEFAULT 'anonymous',
  cv_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Worker skills table
CREATE TABLE public.worker_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_level INTEGER NOT NULL CHECK (skill_level >= 0 AND skill_level <= 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business profiles table
CREATE TABLE public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification status table
CREATE TABLE public.verification_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL UNIQUE REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  testing_status public.verification_status DEFAULT 'not_started',
  references_status public.verification_status DEFAULT 'not_started',
  interview_status public.verification_status DEFAULT 'not_started',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connection requests table
CREATE TABLE public.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  message TEXT,
  hours_per_week INTEGER,
  remote_onsite TEXT,
  rate_offered DECIMAL(10, 2),
  status public.connection_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shortlist table
CREATE TABLE public.shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_profile_id, worker_profile_id)
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Worker profiles policies (public read for search, own write)
CREATE POLICY "Anyone can view worker profiles"
  ON public.worker_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own worker profile"
  ON public.worker_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = worker_profiles.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own worker profile"
  ON public.worker_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = worker_profiles.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Worker skills policies
CREATE POLICY "Anyone can view worker skills"
  ON public.worker_skills FOR SELECT
  USING (true);

CREATE POLICY "Workers can manage their own skills"
  ON public.worker_skills FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.worker_profiles
      JOIN public.profiles ON profiles.id = worker_profiles.profile_id
      WHERE worker_profiles.id = worker_skills.worker_profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Business profiles policies
CREATE POLICY "Authenticated users can view business profiles"
  ON public.business_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own business profile"
  ON public.business_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = business_profiles.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own business profile"
  ON public.business_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = business_profiles.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Verification statuses policies
CREATE POLICY "Workers can view their own verification status"
  ON public.verification_statuses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.worker_profiles
      JOIN public.profiles ON profiles.id = worker_profiles.profile_id
      WHERE worker_profiles.id = verification_statuses.worker_profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage verification statuses"
  ON public.verification_statuses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Connection requests policies
CREATE POLICY "Workers can view connection requests sent to them"
  ON public.connection_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.worker_profiles
      JOIN public.profiles ON profiles.id = worker_profiles.profile_id
      WHERE worker_profiles.id = connection_requests.worker_profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Businesses can view connection requests they sent"
  ON public.connection_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles
      JOIN public.profiles ON profiles.id = business_profiles.profile_id
      WHERE business_profiles.id = connection_requests.business_profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Businesses can create connection requests"
  ON public.connection_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_profiles
      JOIN public.profiles ON profiles.id = business_profiles.profile_id
      WHERE business_profiles.id = connection_requests.business_profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Workers can update connection requests sent to them"
  ON public.connection_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.worker_profiles
      JOIN public.profiles ON profiles.id = worker_profiles.profile_id
      WHERE worker_profiles.id = connection_requests.worker_profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Shortlist policies
CREATE POLICY "Businesses can view their own shortlist"
  ON public.shortlists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles
      JOIN public.profiles ON profiles.id = business_profiles.profile_id
      WHERE business_profiles.id = shortlists.business_profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Businesses can manage their own shortlist"
  ON public.shortlists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles
      JOIN public.profiles ON profiles.id = business_profiles.profile_id
      WHERE business_profiles.id = shortlists.business_profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- User roles policies
CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create function and trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_worker_profiles_updated_at
  BEFORE UPDATE ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_verification_statuses_updated_at
  BEFORE UPDATE ON public.verification_statuses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connection_requests_updated_at
  BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Automatically create verification status when worker profile is created
CREATE OR REPLACE FUNCTION public.handle_new_worker_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.verification_statuses (worker_profile_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_worker_profile_created
  AFTER INSERT ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_worker_profile();