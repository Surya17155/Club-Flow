CREATE INDEX IF NOT EXISTS idx_club_members_user_club_role ON public.club_members (user_id, club_id, role);
CREATE INDEX IF NOT EXISTS idx_club_members_club_role_user ON public.club_members (club_id, role, user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club_joined ON public.club_members (club_id, joined_at);

CREATE INDEX IF NOT EXISTS idx_delegated_powers_club_user ON public.delegated_powers (club_id, user_id);

CREATE INDEX IF NOT EXISTS idx_events_club_date ON public.events (club_id, event_date);
CREATE INDEX IF NOT EXISTS idx_events_date_id ON public.events (event_date, id);

CREATE INDEX IF NOT EXISTS idx_attendance_student_scanned ON public.attendance (student_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_event_status ON public.attendance (event_id, status);

CREATE INDEX IF NOT EXISTS idx_forms_published_deadline ON public.forms (is_published, deadline);
CREATE INDEX IF NOT EXISTS idx_forms_club_created ON public.forms (club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forms_published_created ON public.forms (is_published, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_form_responses_user_form_submitted ON public.form_responses (user_id, form_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_submitted ON public.form_responses (form_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_form_views_user_form ON public.form_views (user_id, form_id);
CREATE INDEX IF NOT EXISTS idx_form_views_form_started ON public.form_views (form_id, started);

CREATE INDEX IF NOT EXISTS idx_club_join_requests_club_status_created ON public.club_join_requests (club_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_club_join_requests_user_status ON public.club_join_requests (user_id, status);