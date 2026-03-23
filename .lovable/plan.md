

## Plan: Fix Outsider Editing, Member Visibility, QR Code Access, and Assign Powers

### Problem Summary

1. **Outsider Profile Edit**: The manage-outsider edge function only supports list/create/delete — no edit action. Super Admin needs to edit outsider details.
2. **Members Not Reflecting**: Members exist in the database but the `AssignPowersModal` fetches members using `activeClub.club_id` from context, which may not match when navigating via Super Admin routes. The MemberManagement component works correctly (it receives `clubId` as a prop), but the issue is likely that the `create-member` edge function works but the UI doesn't refresh or the context isn't synced.
3. **QR Code Visible to Normal Users**: In `Events.tsx`, the QR code button shows for ALL users if `event.qr_token` exists — it should only show for presidents/post-holders of that club.
4. **Assign Powers**: The modal filters out presidents but shows members. The `AVAILABLE_POWERS` list is limited to 3 powers — needs review to ensure all relevant powers are included.

### Changes

#### 1. Add Edit Outsider Support

**Edge Function** (`supabase/functions/manage-outsider/index.ts`):
- Add an `action: "update"` handler in the POST block
- Accept `user_id` + editable fields (full_name, programme, section, year, roll_no, phone)
- Update the profile via admin client

**Frontend** (`src/pages/ManageOutsiders.tsx`):
- Add an "Edit" button in the outsider profile dialog
- Toggle between view and edit mode within the same dialog
- Pre-populate form fields with current outsider data
- Call the edge function with `action: "update"` on save
- Refresh the outsider list after successful update

#### 2. Fix Members Not Reflecting

**Root Cause Investigation**: The `MemberManagement` component and `AssignPowersModal` both query `club_members` — the data IS in the database. The likely issue is:
- `AssignPowersModal` uses `activeClub.club_id` from `ClubContext`, which relies on `useUserClubs` — this only returns clubs where the **current user** is a member. When Super Admin navigates to a club they don't belong to via route params, `activeClub` doesn't match.
- Fix: Pass `clubId` prop to `AssignPowersModal` instead of relying on context, matching how `MemberManagement` works.

**Files**: `src/components/dashboard/AssignPowersModal.tsx`, `src/hooks/useDelegatedPowers.ts`
- Update `AssignPowersModal` to accept an optional `clubId` prop and use it over `activeClub.club_id`
- Ensure `fetchMembers` in the modal uses the correct club ID

#### 3. Remove QR Code Button for Normal Users

**File**: `src/pages/Events.tsx`
- The QR code button currently renders for any event with a `qr_token` (line 221-225)
- Add a permission check: only show the QR button when `canManageEvents` is true (president/post-holder in club mode)
- This prevents normal attendees from viewing/screenshotting QR codes

#### 4. Verify Assign Powers Options

The current `AVAILABLE_POWERS` in `useDelegatedPowers.ts` has:
- `create_event` — Create Event
- `manage_club` — Official Dashboard access
- `use_chatbot` — ClubBot Access

These cover the main delegatable powers. No changes needed here unless you want additional powers added.

### Technical Details

- **Edge function update**: The edit handler will use `adminClient.from('profiles').update(...)` with the outsider's `user_id`
- **QR restriction**: Simply wrap the existing QR button with `{canManageEvents && ...}`
- **AssignPowersModal fix**: Accept `clubId` as prop, fallback to `activeClub?.club_id`
- No database schema changes needed

