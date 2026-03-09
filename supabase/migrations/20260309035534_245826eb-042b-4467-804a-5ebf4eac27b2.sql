
-- Create security definer function to check club president role without recursion
CREATE OR REPLACE FUNCTION public.is_club_president(_user_id uuid, _club_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE user_id = _user_id
    AND club_id = _club_id
    AND role = 'president'::app_role
  )
$$;

-- Drop old broken policies
DROP POLICY IF EXISTS "Admins can delete club members" ON public.club_members;
DROP POLICY IF EXISTS "Admins can manage club members" ON public.club_members;
DROP POLICY IF EXISTS "Admins can update club members" ON public.club_members;

-- Recreate with correct president check using security definer function
CREATE POLICY "Admins can delete club members" ON public.club_members
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_club_president(auth.uid(), club_id)
);

CREATE POLICY "Admins can manage club members" ON public.club_members
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_club_president(auth.uid(), club_id)
);

CREATE POLICY "Admins can update club members" ON public.club_members
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_club_president(auth.uid(), club_id)
);
