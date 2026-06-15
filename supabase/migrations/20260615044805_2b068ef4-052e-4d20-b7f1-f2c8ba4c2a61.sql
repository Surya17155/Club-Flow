
CREATE TABLE public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  deadline TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT false,
  accepting_responses BOOLEAN NOT NULL DEFAULT true,
  allow_multiple BOOLEAN NOT NULL DEFAULT false,
  anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forms TO authenticated;
GRANT ALL ON public.forms TO service_role;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view published forms" ON public.forms FOR SELECT TO authenticated
  USING (is_published = true OR public.is_club_president(auth.uid(), club_id));
CREATE POLICY "Club presidents manage their forms" ON public.forms FOR ALL TO authenticated
  USING (public.is_club_president(auth.uid(), club_id))
  WITH CHECK (public.is_club_president(auth.uid(), club_id));

CREATE TABLE public.form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  required BOOLEAN NOT NULL DEFAULT false,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_questions TO authenticated;
GRANT ALL ON public.form_questions TO service_role;
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View questions of accessible forms" ON public.form_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id
    AND (f.is_published = true OR public.is_club_president(auth.uid(), f.club_id))));
CREATE POLICY "Presidents manage questions" ON public.form_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND public.is_club_president(auth.uid(), f.club_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND public.is_club_president(auth.uid(), f.club_id)));

CREATE TABLE public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  profile_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_responses TO authenticated;
GRANT ALL ON public.form_responses TO service_role;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own responses" ON public.form_responses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.is_published = true AND f.accepting_responses = true));
CREATE POLICY "Users view own responses" ON public.form_responses FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Presidents view club responses" ON public.form_responses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND public.is_club_president(auth.uid(), f.club_id)));
CREATE POLICY "Presidents delete club responses" ON public.form_responses FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND public.is_club_president(auth.uid(), f.club_id)));

CREATE TABLE public.form_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.form_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.form_questions(id) ON DELETE CASCADE,
  value JSONB,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_answers TO authenticated;
GRANT ALL ON public.form_answers TO service_role;
ALTER TABLE public.form_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert answers for own response" ON public.form_answers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.form_responses r WHERE r.id = response_id AND r.user_id = auth.uid()));
CREATE POLICY "Users view own answers" ON public.form_answers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.form_responses r WHERE r.id = response_id AND r.user_id = auth.uid()));
CREATE POLICY "Presidents view club answers" ON public.form_answers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.form_responses r JOIN public.forms f ON f.id = r.form_id
    WHERE r.id = response_id AND public.is_club_president(auth.uid(), f.club_id)));

CREATE TRIGGER trg_forms_updated BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_form_questions_updated BEFORE UPDATE ON public.form_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_form_questions_form ON public.form_questions(form_id, position);
CREATE INDEX idx_form_responses_form ON public.form_responses(form_id);
CREATE INDEX idx_form_responses_user ON public.form_responses(user_id);
CREATE INDEX idx_form_answers_response ON public.form_answers(response_id);
CREATE INDEX idx_forms_club ON public.forms(club_id);

-- Storage policies on form-uploads bucket (path: {form_id}/{user_id}/{filename})
CREATE POLICY "Users upload to own form folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'form-uploads' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "Users read own form files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'form-uploads' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "Presidents read club form files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'form-uploads' AND EXISTS (
    SELECT 1 FROM public.forms f WHERE f.id::text = (storage.foldername(name))[1]
      AND public.is_club_president(auth.uid(), f.club_id)));
