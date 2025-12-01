-- Add new columns to worker_profiles for enhanced features
ALTER TABLE worker_profiles
ADD COLUMN hourly_rate_min numeric,
ADD COLUMN hourly_rate_max numeric,
ADD COLUMN rate_negotiable boolean DEFAULT false,
ADD COLUMN location_constraints text,
ADD COLUMN travel_time_minutes integer,
ADD COLUMN total_hours_per_week numeric,
ADD COLUMN availability_exceptions jsonb DEFAULT '[]';

-- Update finance_role enum to add new roles
ALTER TYPE finance_role ADD VALUE IF NOT EXISTS 'finance_manager';
ALTER TYPE finance_role ADD VALUE IF NOT EXISTS 'cfo_fpa';

-- Create qualification_type enum
CREATE TYPE qualification_type AS ENUM (
  'aat_level_2',
  'aat_level_3',
  'aat_level_4',
  'acca_part_qualified',
  'acca_qualified',
  'cima_part_qualified',
  'cima_qualified',
  'aca_part_qualified',
  'aca_qualified',
  'degree',
  'masters',
  'other'
);

-- Create worker_qualifications table
CREATE TABLE worker_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id uuid REFERENCES worker_profiles(id) ON DELETE CASCADE NOT NULL,
  qualification_type qualification_type NOT NULL,
  details text,
  year_obtained integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE worker_qualifications ENABLE ROW LEVEL SECURITY;

-- Create worker_system_proficiency table
CREATE TABLE worker_system_proficiency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id uuid REFERENCES worker_profiles(id) ON DELETE CASCADE NOT NULL,
  system_name text NOT NULL,
  proficiency_level integer NOT NULL CHECK (proficiency_level BETWEEN 0 AND 4),
  created_at timestamptz DEFAULT now(),
  UNIQUE(worker_profile_id, system_name)
);

ALTER TABLE worker_system_proficiency ENABLE ROW LEVEL SECURITY;

-- Create worker_languages table
CREATE TABLE worker_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id uuid REFERENCES worker_profiles(id) ON DELETE CASCADE NOT NULL,
  language_name text NOT NULL,
  written_level text CHECK (written_level IN ('basic', 'intermediate', 'fluent', 'native')),
  spoken_level text CHECK (spoken_level IN ('basic', 'intermediate', 'fluent', 'native')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(worker_profile_id, language_name)
);

ALTER TABLE worker_languages ENABLE ROW LEVEL SECURITY;

-- Create test_questions table
CREATE TABLE test_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role finance_role NOT NULL,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;

-- Create test_attempts table
CREATE TABLE test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id uuid REFERENCES worker_profiles(id) ON DELETE CASCADE NOT NULL,
  role finance_role NOT NULL,
  score integer NOT NULL,
  passed boolean NOT NULL,
  questions_answered jsonb,
  attempted_at timestamptz DEFAULT now(),
  lockout_until timestamptz
);

ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

-- Create worker_references table
CREATE TABLE worker_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id uuid REFERENCES worker_profiles(id) ON DELETE CASCADE NOT NULL,
  referee_name text NOT NULL,
  referee_email text NOT NULL,
  referee_role text,
  referee_company text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'verified', 'declined')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE worker_references ENABLE ROW LEVEL SECURITY;

-- RLS Policies for worker_qualifications
CREATE POLICY "Anyone can view worker qualifications"
ON worker_qualifications FOR SELECT
USING (true);

CREATE POLICY "Workers can manage their own qualifications"
ON worker_qualifications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM worker_profiles
    JOIN profiles ON profiles.id = worker_profiles.profile_id
    WHERE worker_profiles.id = worker_qualifications.worker_profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- RLS Policies for worker_system_proficiency
CREATE POLICY "Anyone can view system proficiency"
ON worker_system_proficiency FOR SELECT
USING (true);

CREATE POLICY "Workers can manage their own system proficiency"
ON worker_system_proficiency FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM worker_profiles
    JOIN profiles ON profiles.id = worker_profiles.profile_id
    WHERE worker_profiles.id = worker_system_proficiency.worker_profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- RLS Policies for worker_languages
CREATE POLICY "Anyone can view worker languages"
ON worker_languages FOR SELECT
USING (true);

CREATE POLICY "Workers can manage their own languages"
ON worker_languages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM worker_profiles
    JOIN profiles ON profiles.id = worker_profiles.profile_id
    WHERE worker_profiles.id = worker_languages.worker_profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- RLS Policies for test_questions
CREATE POLICY "Authenticated users can view test questions"
ON test_questions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage test questions"
ON test_questions FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for test_attempts
CREATE POLICY "Workers can view their own test attempts"
ON test_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM worker_profiles
    JOIN profiles ON profiles.id = worker_profiles.profile_id
    WHERE worker_profiles.id = test_attempts.worker_profile_id
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Workers can insert their own test attempts"
ON test_attempts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM worker_profiles
    JOIN profiles ON profiles.id = worker_profiles.profile_id
    WHERE worker_profiles.id = test_attempts.worker_profile_id
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all test attempts"
ON test_attempts FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for worker_references
CREATE POLICY "Workers can view their own references"
ON worker_references FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM worker_profiles
    JOIN profiles ON profiles.id = worker_profiles.profile_id
    WHERE worker_profiles.id = worker_references.worker_profile_id
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Workers can manage their own references"
ON worker_references FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM worker_profiles
    JOIN profiles ON profiles.id = worker_profiles.profile_id
    WHERE worker_profiles.id = worker_references.worker_profile_id
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all references"
ON worker_references FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at on worker_references
CREATE TRIGGER update_worker_references_updated_at
BEFORE UPDATE ON worker_references
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();