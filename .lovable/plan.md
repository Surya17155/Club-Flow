

## Plan: User Profile System with Club Switching

This is a large feature with several interconnected parts. Here is the breakdown:

### 1. Storage Bucket for Avatars
Create a public `avatars` storage bucket so users can upload profile photos.

### 2. Profile Dropdown Menu (Header Button)
Convert the current user profile button (line 84-90 in AdminDashboard) into a dropdown menu with options:
- **My Profile** -- navigates to `/profile`
- **Switch Club** -- shows sub-menu of user's clubs with roles
- **Settings** -- navigates to `/settings`  
- **Sign Out**

### 3. New Profile Page (`src/pages/Profile.tsx`)
A dedicated page where users can view and edit their profile. Fields pulled from the `profiles` table:
- Avatar upload (to `avatars` bucket)
- Full name, about/bio
- Programme, semester, year
- Social links (GitHub, LinkedIn, Twitter)
- Club memberships (read-only, auto-populated from `club_members`)

Uses a form with validation (react-hook-form + zod). Saves via `supabase.from('profiles').update(...)`.

### 4. Settings Page (`src/pages/Settings.tsx`)
Basic settings page with account management (change password, etc.).

### 5. Club Switching Context
Create a `ClubContext` that:
- Fetches the user's club memberships (from `club_members` joined with `clubs`)
- Stores the currently selected club ID and the user's role in that club
- Persists selection in localStorage
- Provides `switchClub(clubId)` function

### 6. Dashboard Dynamic Updates
- The AdminDashboard reads the active club from `ClubContext`
- Profile card on the left shows the user's role badge for the *selected* club (President, Member, etc.)
- Club name updates dynamically
- Stats, events, and chart data filter by the selected club
- Social icons in the profile card link to actual URLs from the `profiles` table

### 7. Update Routes in App.tsx
- `/profile` -> `Profile.tsx` (new dedicated page, not reusing MemberDashboard)
- `/settings` -> `Settings.tsx` (new page, not reusing AdminDashboard)

### Technical Details

**Data flow for club switching:**
```text
club_members table (user_id, club_id, role)
        |
  ClubContext (fetches on auth)
        |
  activeClub = { id, name, role }
        |
  AdminDashboard reads activeClub
  -> filters events, stats by club_id
  -> shows role badge for that club
```

**Storage migration SQL:**
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- RLS: users can upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Avatars publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**New files:**
- `src/contexts/ClubContext.tsx` -- club switching state
- `src/pages/Profile.tsx` -- profile edit page
- `src/pages/Settings.tsx` -- settings page
- `src/components/dashboard/ProfileDropdown.tsx` -- header dropdown component
- `src/hooks/useProfile.ts` -- hook to fetch/update profile data
- `src/hooks/useUserClubs.ts` -- hook to fetch user's club memberships

**Modified files:**
- `src/pages/AdminDashboard.tsx` -- integrate ClubContext, dynamic profile card, real social links
- `src/App.tsx` -- wrap with ClubProvider, update routes
- `src/contexts/AuthContext.tsx` -- no changes needed

