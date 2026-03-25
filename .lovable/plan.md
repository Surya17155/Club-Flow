## Completed: Verified Tick Badges, Delegated Powers, Super Admin Editing, AI Chatbot Scoping, Data Export

All features implemented:

1. **Verified Badges** — Purple 3D tick for President/VP, Blue for Secretary/Social Media Head. Added to MemberManagement, ClubProfileSidebar, ClubDetailOverlay, SuperAdminDashboard, AssignPowersModal.

2. **Delegated Powers Audit** — Verified `hasPower()` checks in CreateEvent (create_event), ClubDashboard (manage_club), ProfileDropdown (use_chatbot). All correct.

3. **Super Admin Editing** — Edit Profile button in member profile dialog (uses manage-outsider edge function). Edit Club option in club dropdown menu (direct Supabase update). Both mobile and desktop.

4. **AI Chatbot Strict Scoping** — Added `use_chatbot` power check for non-president members. Per-event attendee names added to context for richer responses.

5. **Excel Export** — Export Data button on Super Admin dashboard (mobile + desktop). Generates Excel with Clubs, Members, and Events sheets.
