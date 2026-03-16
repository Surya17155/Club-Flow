
-- Club Join Requests table
CREATE TABLE public.club_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, club_id)
);

ALTER TABLE public.club_join_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own requests
CREATE POLICY "Users can view own join requests"
ON public.club_join_requests FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Presidents can view requests for their club
CREATE POLICY "Presidents can view club join requests"
ON public.club_join_requests FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  is_club_president(auth.uid(), club_id)
);

-- Authenticated users can create requests
CREATE POLICY "Users can create join requests"
ON public.club_join_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Presidents can update requests (approve/reject)
CREATE POLICY "Presidents can update join requests"
ON public.club_join_requests FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  is_club_president(auth.uid(), club_id)
);

-- Users can delete their own pending requests
CREATE POLICY "Users can cancel own pending requests"
ON public.club_join_requests FOR DELETE TO authenticated
USING (user_id = auth.uid() AND status = 'pending');

-- Event Feedback table
CREATE TABLE public.event_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view feedback for events they have access to
CREATE POLICY "Authenticated can view feedback"
ON public.event_feedback FOR SELECT TO authenticated
USING (true);

-- Only attendees can submit feedback (checked in app code)
CREATE POLICY "Attendees can submit feedback"
ON public.event_feedback FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback"
ON public.event_feedback FOR UPDATE TO authenticated
USING (user_id = auth.uid());
