
CREATE TABLE public.form_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  started boolean NOT NULL DEFAULT false,
  started_at timestamptz,
  UNIQUE (form_id, user_id)
);

GRANT SELECT, INSERT, UPDATE ON public.form_views TO authenticated;
GRANT ALL ON public.form_views TO service_role;

ALTER TABLE public.form_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert/update own form views"
ON public.form_views FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own form views"
ON public.form_views FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User or club president read views"
ON public.form_views FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.forms f
    WHERE f.id = form_views.form_id
      AND public.is_club_president(auth.uid(), f.club_id)
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.forms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.form_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.form_views;
