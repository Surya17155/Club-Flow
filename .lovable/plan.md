

## Plan: Strict Club Scoping for ClubBot

### Problem
When a user selects a specific club and opens ClubBot, it returns data from all clubs instead of only the selected one. This happens because:
1. If the user has `admin` role in `user_roles`, the edge function sets `isSuperAdmin = true` and fetches **all** clubs' data with no filtering
2. Even for super admins, when `active_club_id` is provided, the bot should scope to that club only

### Solution
Modify the edge function (`supabase/functions/club-chat/index.ts`) to respect `active_club_id` even for super admins. The "gate" logic:
- If `active_club_id` is provided → scope to that club only, regardless of role
- If no `active_club_id` and user is super admin → show all clubs (current behavior)
- If no `active_club_id` and user is regular member → show only their clubs

### Changes

**File: `supabase/functions/club-chat/index.ts`**

Move the `active_club_id` check **before** the super admin bypass:

```text
Current flow:
  isSuperAdmin? → clubIds = [] (all clubs)
  active_club_id? → scope to one club
  else → user's clubs

New flow:
  active_club_id provided? → scope to one club (for ALL users)
  isSuperAdmin (no active club)? → clubIds = [] (all clubs)
  else → user's clubs
```

Specifically:
- Check `active_club_id` first. If provided, set `clubIds = [active_club_id]` for everyone (super admin or not)
- Skip chatbot permission check for super admins even when scoped to a club
- Update the system prompt: when scoped to a club, always enforce the security rule that restricts answers to that club only — even for super admins

This is a single-file change in the edge function (~15 lines modified).

