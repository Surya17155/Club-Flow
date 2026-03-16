
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS club_type text;

-- Create storage bucket for club logos if not exists
INSERT INTO storage.buckets (id, name, public) VALUES ('club-logos', 'club-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: presidents can upload club logos
CREATE POLICY "Presidents can upload club logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'club-logos'
  AND (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.user_id = auth.uid()
      AND club_members.club_id::text = (storage.foldername(name))[1]
      AND club_members.role = 'president'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
);

CREATE POLICY "Presidents can update club logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'club-logos'
  AND (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.user_id = auth.uid()
      AND club_members.club_id::text = (storage.foldername(name))[1]
      AND club_members.role = 'president'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
);

CREATE POLICY "Anyone can view club logos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'club-logos');

-- Allow presidents to update their own club
CREATE POLICY "Presidents can update their club"
ON public.clubs FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_members.club_id = clubs.id
    AND club_members.user_id = auth.uid()
    AND club_members.role = 'president'
  )
);
