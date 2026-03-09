

## Analysis: Root Cause of "An internal error occurred"

### Finding: Broken RLS policies for club presidents

The `club_members` table RLS policies for INSERT, UPDATE, and DELETE use `has_role(auth.uid(), 'president'::app_role)`. This function checks the `user_roles` table. However, **the `user_roles` table only ever contains `admin` and `member` roles** (confirmed by DB query). Presidents are tracked in `club_members.role`, not in `user_roles`.

This means:
- When a **president** tries to add, remove, or update club members via direct Supabase queries, **RLS silently denies the operation** or returns an internal error.
- Only **admins** can perform these operations because `has_role(uid, 'admin')` correctly resolves.
- The edge function (`create-member`) bypasses this because it uses `SUPABASE_SERVICE_ROLE_KEY`.

### Plan

#### 1. Fix `club_members` RLS policies (database migration)

Replace the three broken policies (`INSERT`, `UPDATE`, `DELETE`) on `club_members` to check the `club_members` table directly for president role instead of using `has_role`:

```sql
-- Drop old policies
DROP POLICY "Admins can delete club members" ON public.club_members;
DROP POLICY "Admins can manage club members" ON public.club_members;
DROP POLICY "Admins can update club members" ON public.club_members;

-- Recreate with correct president check
CREATE POLICY "Admins can delete club members" ON public.club_members
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM club_members cm
    WHERE cm.club_id = club_members.club_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'president'::app_role
  )
);

CREATE POLICY "Admins can manage club members" ON public.club_members
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM club_members cm
    WHERE cm.club_id = club_members.club_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'president'::app_role
  )
);

CREATE POLICY "Admins can update club members" ON public.club_members
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM club_members cm
    WHERE cm.club_id = club_members.club_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'president'::app_role
  )
);
```

#### 2. Add delete event button to ManageEventsModal

Update `ManageEventsModal.tsx` to add:
- Import `Trash2` icon and `useToast`
- A delete button on each event card (with confirmation)
- Delete handler that calls `supabase.from('events').delete().eq('id', eventId)` and also deletes related attendance records first
- Refresh the event list after deletion

#### 3. Improve error handling across key pages

Add explicit error message handling in places that currently let Supabase errors pass through as generic messages:
- `MemberManagement.tsx`: Wrap member operations with better error messages
- `Events.tsx`: Already has decent handling, but add fallback for RLS errors
- `ManageEventsModal.tsx`: Add error toasts for failed attendance/event queries

