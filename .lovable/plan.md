

## Plan: Floating AI Chat Assistant

### Overview
Add a floating chatbot widget (bottom-right corner) accessible on all dashboard pages. It connects to an edge function that queries the database based on the user's role and club affiliation, then uses Lovable AI (Gemini) to generate natural-language answers.

### Architecture

```text
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  ChatWidget  │────▶│  club-chat EF    │────▶│ Lovable AI  │
│  (floating)  │◀────│  (role-gated DB  │◀────│ (Gemini)    │
│              │     │   queries)       │     │             │
└─────────────┘     └──────────────────┘     └─────────────┘
```

### 1. Edge Function: `supabase/functions/club-chat/index.ts`

- Accepts `{ message, conversation_history }` from the client
- Authenticates the user via the Authorization header
- Determines user role:
  - Checks `user_roles` for `admin` → **Super Admin** (unrestricted)
  - Otherwise checks `club_members` for their club memberships and roles
- Fetches relevant club data scoped to the user's clubs (or all clubs for super admin):
  - Club info, member counts, event stats, recent events, attendance summaries
- Builds a system prompt with the fetched data context and role restrictions
- Calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with streaming
- Returns SSE stream to the client
- For non-admin users, the system prompt explicitly instructs the AI to refuse cross-club queries

### 2. Frontend Component: `src/components/chat/FloatingChatWidget.tsx`

- Floating button (bottom-right, `fixed` position) with a chat icon
- Opens a chat panel (card-style, ~400px tall) with:
  - Message list with markdown rendering (`react-markdown`)
  - Input field + send button
  - Streaming token display for assistant responses
- Uses `useAuth` to pass the auth token, `useClub` for context
- Stores conversation in local state (no persistence needed)
- Handles 429/402 errors with user-friendly toasts

### 3. Integration: `src/components/layout/DashboardLayout.tsx`

- Import and render `<FloatingChatWidget />` inside the layout so it appears on all authenticated pages

### 4. Config

- Add `[functions.club-chat]` with `verify_jwt = false` to `supabase/config.toml`

### Security Model

| User Type | Data Access |
|-----------|------------|
| Super Admin (`user_roles.role = 'admin'`) | All clubs, all data |
| President/Post Holder | Only their own club(s) data |
| Regular Member | Only their own club(s) data |
| Non-club query | AI responds with security denial message |

### Files to Create/Edit

| File | Action |
|------|--------|
| `supabase/functions/club-chat/index.ts` | Create — edge function with role-gated DB queries + AI streaming |
| `src/components/chat/FloatingChatWidget.tsx` | Create — floating chat UI with streaming |
| `src/components/layout/DashboardLayout.tsx` | Edit — add `<FloatingChatWidget />` |

