-- Add payment status to connection_requests
ALTER TABLE public.connection_requests 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';

-- Add payment_completed_at timestamp
ALTER TABLE public.connection_requests 
ADD COLUMN IF NOT EXISTS payment_completed_at timestamp with time zone;

-- Comment on columns
COMMENT ON COLUMN public.connection_requests.payment_status IS 'Payment status: unpaid, paid';
COMMENT ON COLUMN public.connection_requests.payment_completed_at IS 'Timestamp when payment was completed';