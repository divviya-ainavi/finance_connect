-- Create messages table for internal messaging
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_request_id UUID NOT NULL REFERENCES public.connection_requests(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Users can view messages for their connections"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM connection_requests cr
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE cr.id = messages.connection_request_id
    AND cr.status = 'accepted'
    AND (
      (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.profile_id = p.id AND wp.id = cr.worker_profile_id))
      OR
      (EXISTS (SELECT 1 FROM business_profiles bp WHERE bp.profile_id = p.id AND bp.id = cr.business_profile_id))
    )
  )
);

CREATE POLICY "Users can send messages for their connections"
ON public.messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM connection_requests cr
    JOIN profiles p ON p.user_id = auth.uid() AND p.id = messages.sender_profile_id
    WHERE cr.id = messages.connection_request_id
    AND cr.status = 'accepted'
    AND (
      (EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.profile_id = p.id AND wp.id = cr.worker_profile_id))
      OR
      (EXISTS (SELECT 1 FROM business_profiles bp WHERE bp.profile_id = p.id AND bp.id = cr.business_profile_id))
    )
  )
);

CREATE POLICY "Users can mark messages as read"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM connection_requests cr
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE cr.id = messages.connection_request_id
    AND cr.status = 'accepted'
    AND messages.sender_profile_id != p.id
  )
);

-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  features JSONB DEFAULT '[]'::jsonb,
  connection_limit INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'inactive',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
ON public.subscription_plans FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = subscriptions.profile_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Users can insert their own subscription"
ON public.subscriptions FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = subscriptions.profile_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Users can update their own subscription"
ON public.subscriptions FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = subscriptions.profile_id AND profiles.user_id = auth.uid())
);

-- Create notification_logs table for email tracking
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view notification logs
CREATE POLICY "Admins can view notification logs"
ON public.notification_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert notification logs"
ON public.notification_logs FOR INSERT
WITH CHECK (true);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, features, connection_limit)
VALUES 
  ('Free', 'Basic access to the platform', 0, 0, '["5 connection requests/month", "Basic search", "Profile listing"]', 5),
  ('Professional', 'For growing businesses', 49.99, 479.88, '["50 connection requests/month", "Advanced search filters", "Priority support", "Analytics dashboard"]', 50),
  ('Enterprise', 'Unlimited access', 199.99, 1919.88, '["Unlimited connection requests", "All features", "Dedicated support", "Custom integrations", "API access"]', -1);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;