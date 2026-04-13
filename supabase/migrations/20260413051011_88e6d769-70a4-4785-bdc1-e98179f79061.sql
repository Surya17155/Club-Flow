
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_email TEXT NOT NULL DEFAULT 'surya.17155@gmail.com',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous/unauthenticated edge functions with service role) to insert
CREATE POLICY "Service role can insert contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Only service role can read (no public access)
CREATE POLICY "No public read access"
ON public.contact_messages
FOR SELECT
USING (false);
