

## Plan: Verified Tick Badges, Delegated Powers Verification, Super Admin Editing, AI Chatbot Scoping, and Data Export

### Overview

This plan implements the approved features plus the new verified tick badge feature. The ticks will appear as small, 3D-styled badges next to names — purple for President/VP, blue for post-holders (Secretary, Social Media Head).

---

### 1. Verified Tick Badge Component

**New file**: `src/components/ui/VerifiedBadge.tsx`

Create a reusable SVG component that renders the starburst-checkmark icon (like Instagram/X verified badges):
- Props: `variant: 'purple' | 'blue'`, `size?: number` (default ~16px)
- Purple variant: gradient fill from `#9b59b6` to `#8e44ad` with white checkmark, subtle drop shadow for 3D effect
- Blue variant: gradient fill from `#3498db` to `#2980b9` with white checkmark, same 3D shadow
- Uses SVG `<defs>` for gradient + filter for the shiny/3D look
- Small inline element that sits right next to the name text

**Where to display the tick** (next to member names, based on role):

| Role | Tick Color |
|------|-----------|
| `president` | Purple |
| `vice_president` | Purple |
| `secretary` | Blue |
| `social_media_head` | Blue |
| `member` | None |

**Files to update** (add `<VerifiedBadge>` next to name spans):
- `src/components/club-dashboard/MemberManagement.tsx` — member list rows and view profile dialog
- `src/components/club-dashboard/ClubProfileSidebar.tsx` — post-holders list
- `src/components/mobile/ClubDetailOverlay.tsx` — post-holders in expanded club card
- `src/pages/SuperAdminDashboard.tsx` — member profile dialog
- `src/components/dashboard/AssignPowersModal.tsx` — member list
- `src/components/dashboard/ProfileDropdown.tsx` — club list (role display)

Logic: Check `role` value, render `<VerifiedBadge variant="purple" />` for president/VP, `<VerifiedBadge variant="blue" />` for secretary/social_media_head, nothing for member.

---

### 2. Verify Delegated Powers Work End-to-End

**Audit these files** for proper `hasPower()` checks:
- `src/pages/CreateEvent.tsx` — verify `hasPower('create_event')` gates access
- `src/pages/ClubDashboard.tsx` — verify `hasPower('manage_club')` gates dashboard access
- `src/components/dashboard/ProfileDropdown.tsx` — verify chatbot option checks `hasPower('use_chatbot')`

**Fix if needed**: Ensure that when a president grants a power via AssignPowersModal, the target user's UI immediately reflects the change on next login/navigation.

---

### 3. Super Admin Enhanced Editing

**File**: `src/pages/SuperAdminDashboard.tsx`

- Add "Edit Profile" button in the member profile dialog (alongside existing "Change Role")
- Open inline edit form for: full_name, programme, section, year, roll_no, phone
- Call `manage-outsider` edge function with `action: "update"` (already supports this)
- Add "Edit Club" option in club card dropdown menu
- Open dialog to edit: name, description, about, category, social_instagram, social_linkedin
- Direct Supabase update via `supabase.from('clubs').update(...)`

---

### 4. AI Chatbot Strict Scoping Verification

**File**: `supabase/functions/club-chat/index.ts`

The backend already enforces scoping correctly:
- Super Admin: `clubIds = []` → fetches ALL data
- Non-admin with `active_club_id`: verifies membership, scopes to that club only
- System prompt explicitly forbids cross-club data for non-admins

**Enhancement**: Add `use_chatbot` power check for non-president post-holders:
- Before processing, verify the user is either a president of the active club OR has `use_chatbot` in `delegated_powers`
- Return 403 if unauthorized

**Enhancement**: Add per-event attendee names to context (currently only counts):
- For each event, include list of attendee names from profiles table
- This enables the chatbot to answer "who attended X event?"

---

### 5. CSV/Excel Export for Super Admin

**File**: `src/pages/SuperAdminDashboard.tsx`

- Add "Export Data" button in the header area
- Generate downloadable Excel file using the existing `xlsx` library (already imported in MemberManagement)
- Sheets: Clubs summary, All Members (with club + role), All Events, Attendance records
- Each club gets member + event data in organized sheets
- Client-side generation, no new edge function needed

---

### Implementation Order

1. Create `VerifiedBadge` component and add to all relevant locations
2. Audit and fix delegated powers gating
3. Add Super Admin edit member/club capabilities
4. Strengthen chatbot scoping + add attendee details to context
5. Add CSV export feature

### Files to Create
- `src/components/ui/VerifiedBadge.tsx`

### Files to Modify
- `src/components/club-dashboard/MemberManagement.tsx`
- `src/components/club-dashboard/ClubProfileSidebar.tsx`
- `src/components/mobile/ClubDetailOverlay.tsx`
- `src/pages/SuperAdminDashboard.tsx`
- `src/components/dashboard/AssignPowersModal.tsx`
- `src/components/dashboard/ProfileDropdown.tsx`
- `supabase/functions/club-chat/index.ts`
- `src/pages/CreateEvent.tsx` (audit)
- `src/pages/ClubDashboard.tsx` (audit)

