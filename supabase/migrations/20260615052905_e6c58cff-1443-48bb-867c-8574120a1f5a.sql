
-- 1) Add is_public flag for forms that should be visible to everyone
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- 2) Helper: check if a user is a member of a club (any role)
CREATE OR REPLACE FUNCTION public.is_club_member(_user_id uuid, _club_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE user_id = _user_id AND club_id = _club_id
  )
$$;

-- 3) Replace forms SELECT policy with club-scoped visibility
DROP POLICY IF EXISTS "Authenticated can view published forms" ON public.forms;

CREATE POLICY "View published forms (club-scoped or public)"
ON public.forms
FOR SELECT
TO authenticated
USING (
  public.is_club_president(auth.uid(), club_id)
  OR (
    is_published = true
    AND (
      is_public = true
      OR public.is_club_member(auth.uid(), club_id)
    )
  )
);
