
CREATE TABLE public.delegated_powers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    power text NOT NULL,
    granted_by uuid NOT NULL,
    granted_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (club_id, user_id, power)
);

ALTER TABLE public.delegated_powers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view delegated powers"
ON public.delegated_powers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.club_members
        WHERE club_members.club_id = delegated_powers.club_id
        AND club_members.user_id = auth.uid()
    )
);

CREATE POLICY "Presidents can grant powers"
ON public.delegated_powers
FOR INSERT
TO authenticated
WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
        SELECT 1 FROM public.club_members
        WHERE club_members.club_id = delegated_powers.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = 'president'::app_role
    )
);

CREATE POLICY "Presidents can revoke powers"
ON public.delegated_powers
FOR DELETE
TO authenticated
USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
        SELECT 1 FROM public.club_members
        WHERE club_members.club_id = delegated_powers.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = 'president'::app_role
    )
);
