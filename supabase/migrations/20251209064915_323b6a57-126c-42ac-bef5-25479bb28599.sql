-- Create in-app notifications table
CREATE TABLE public.in_app_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.in_app_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = in_app_notifications.recipient_profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.in_app_notifications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = in_app_notifications.recipient_profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- Service role and admins can insert notifications
CREATE POLICY "Service role and admins can insert notifications"
ON public.in_app_notifications
FOR INSERT
WITH CHECK (
  current_setting('request.jwt.claim.role', true) = 'service_role'
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
ON public.in_app_notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.in_app_notifications;