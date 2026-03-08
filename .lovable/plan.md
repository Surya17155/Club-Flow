

## Super Admin Dashboard & Global Reports -- Implementation Plan

This is a large feature that breaks into two main deliverables: (1) The Super Admin Command Center dashboard, and (2) The Global Reports page. Both are read-heavy, admin-only views.

---

### Part 1: Database -- Add `super_admin` role

The current `app_role` enum has: `admin, president, vice_president, secretary, social_media_head, member`. The "admin" role already exists and maps to the `has_role()` function. We will use the existing `admin` role in `user_roles` as the Super Admin identifier -- no new enum value needed. The `has_role(uid, 'admin')` check already gates all admin-level operations.

No schema changes are required. The existing tables (`clubs`, `club_members`, `events`, `attendance`, `profiles`, `delegated_powers`) already have RLS policies granting admins full SELECT access.

---

### Part 2: Super Admin Dashboard Page (`/super-admin`)

**New file: `src/pages/SuperAdminDashboard.tsx`**

Access control: Check `has_role` via `user_roles` table -- if user doesn't have `admin` role, show restricted access screen.

**Layout sections (matching the uploaded UI):**

1. **Header** -- "Super Admin Command Center" title, search bar, "Add New Club" button, "Platform Settings" button, user avatar.

2. **Top Stats Row** (4 cards, real data):
   - Total Active Clubs -- `SELECT count(*) FROM clubs`
   - Global Member Count -- `SELECT count(*) FROM club_members` (distinct user_id)
   - Total Events Managed -- `SELECT count(*) FROM events`
   - Growth Trends chart -- a small bar chart using Recharts showing monthly event/member counts

3. **Club Management Grid** (3-column scrollable grid):
   - Fetch all clubs with member count and event count per club
   - Each card shows: club name, first letter avatar, member count, event count
   - Buttons: "Edit" (future), "Delete" (future), "View Analytics" (navigates to `/club/:id`)
   - "View Analytics" redirects to the existing Club Dashboard for that club

4. **Manage All Members** (right sidebar panel):
   - Fetch all `club_members` joined with `profiles` 
   - Show avatar, name, and buttons: "Edit Details" (view profile dialog), "Change Role" (role change dialog)
   - The Super Admin can change a member's role within a club (update `club_members.role`)

5. **Global Event Feed** (bottom horizontal scroll):
   - Fetch upcoming events across ALL clubs with attendance counts
   - Show event name, club name, date, time, participant count

**New hook: `src/hooks/useSuperAdminStats.ts`** -- fetches all aggregate stats in parallel.

---

### Part 3: Global Reports Page (`/global-reports`)

**New file: `src/pages/GlobalReports.tsx`**

Access control: Same admin role check.

**Layout sections (matching the uploaded UI):**

1. **Header** -- Search bar, Admin View toggle, user profile

2. **Filters** -- Dropdowns for Club filter, Time Period, Role filter

3. **Main Table** (read-only, no add/delete for the Super Admin):
   - Columns: Event Name, Timing, Participating Club, Club Membership Stats (total members with post-holder/regular breakdown), Member Name, Role
   - Data source: Join `events` + `clubs` + `club_members` + `profiles`
   - "Export to Excel" button -- generates CSV download of the table data
   - No "Add Entry" or "Bulk Delete" buttons (read-only per requirements)

4. **Statistics Sidebar**:
   - Bar chart: Events conducted per club (Recharts BarChart)
   - Pie chart: Member distribution by programme (BBA, MBA, BTech, etc.) using Recharts PieChart

---

### Part 4: Routing & Navigation

- Add routes in `App.tsx`: `/super-admin` and `/global-reports`
- Update `Dashboard.tsx` to check `user_roles` for admin role and redirect to `/super-admin` instead of `/admin`
- Add "Super Admin" and "Global Reports" items to sidebar (`AppSidebar.tsx`) -- only visible when user has admin role (check via a new hook or inline query)

---

### Part 5: Event Sync (Already Works)

Events created by any club post-holder or president already go into the `events` table. The Global Reports page and all dashboards query this same table, so sync is automatic. The existing `EventCalendar` and upcoming events queries already fetch from the shared `events` table filtered by date range. No additional sync logic is needed.

---

### Implementation Order

1. **Create `useSuperAdminStats` hook** -- aggregate queries for stats
2. **Create `SuperAdminDashboard.tsx`** -- full page with stats, club grid, member management, event feed
3. **Create `GlobalReports.tsx`** -- table view with filters, export, and statistics sidebar
4. **Update routing** -- `App.tsx`, `Dashboard.tsx`, `AppSidebar.tsx`

### Technical Details

- Admin role check: query `user_roles` table where `user_id = auth.uid()` and `role = 'admin'`
- CSV export: build CSV string from table data in-browser, trigger download via `Blob` + `URL.createObjectURL`
- Club member role changes: `supabase.from('club_members').update({ role }).eq('id', membershipId)` -- existing RLS allows admins
- No new database tables or migrations needed
- Programme distribution for pie chart: group `profiles.programme` across all users

