

## Plan: Super Admin President Management & ClubBot Agentic Capabilities

---

### Feature 1: Super Admin President Management

#### Problem
Existing clubs created before the "president required" rule have no president. The Super Admin's club card three-dot menu only offers "Edit Club" and "Delete Club" -- there is no way to add, edit, swap, or remove a president.

#### Solution
Add a "Manage President" option to the club card dropdown menu. This opens a dialog with context-aware options depending on whether a president already exists.

#### UI Flow

**Case A: Club has no president**
- Dialog shows "No president assigned" with a form to add one
- Form fields: Full Name, Email, Programme, Year, Section, Roll No, Phone
- Uses the existing `create-member` edge function with `role: 'president'`

**Case B: Club has a president**
- Dialog shows current president's name, email, and details
- Two action buttons:
  1. **Edit Details** -- Opens inline editable fields to update the president's profile (name, programme, year, section, roll no, phone). This keeps the same user but updates their info via the `manage-outsider` edge function.
  2. **Replace President** -- Demotes the current president to "member" role (or removes them entirely via a toggle) and shows a form to assign a new president. The new president can be:
     - An existing club member (promoted via role update)
     - An existing app user (added to club as president via `create-member`)
     - A new user (created and added via `create-member`)

#### Data Flow
- Fetch president data: query `club_members` where `club_id = X` and `role = 'president'`, then fetch their profile
- Edit details: call `manage-outsider` edge function with `action: 'update'`
- Replace: update old president's role in `club_members` to 'member' (or delete the membership), then call `create-member` for the new one
- Remove: delete the president's `club_members` row or demote to member

#### Files Modified
- `src/pages/SuperAdminDashboard.tsx` -- Add "Manage President" dropdown item, new dialog with president management UI, and handler functions
- `src/hooks/useSuperAdminStats.ts` -- Extend club data to include president info (name, user_id) so the dialog knows the current state

---

### Feature 2: ClubBot Agentic Capabilities with File Upload

#### Problem
ClubBot is currently read-only -- it can answer questions about club data but cannot perform actions. Users want the bot to process uploaded files (Excel, PDF, images) and execute tasks like bulk-importing members.

#### Solution
Add a multi-step agentic pipeline to the ClubBot edge function and a file upload UI to the chat interface.

#### Architecture

```text
User uploads file + command
        │
        ▼
  Chat UI sends file to Supabase Storage
  (new bucket: "chat-uploads")
        │
        ▼
  Edge function receives:
  - message (user prompt)
  - file_urls[] (storage URLs)
  - conversation_history
  - active_club_id
        │
        ▼
  AI Agent (tool-calling loop):
  ┌─────────────────────────────┐
  │ 1. Analyze intent + files   │
  │ 2. Call available tools:    │
  │    - import_members         │
  │    - add_single_member      │
  │    - list_members           │
  │    - create_event           │
  │ 3. Return results to user   │
  └─────────────────────────────┘
```

#### Agent Tools (defined in edge function)
The AI model will use tool-calling (function calling) to execute actions:

1. **import_members** -- Parses file data and calls the existing `import-members` logic inline. Accepts raw spreadsheet rows + headers, runs AI mapping, and inserts members.
2. **add_single_member** -- Adds one member using the `create-member` logic. Parameters: name, email, programme, year, section, roll_no, phone, role.
3. **list_members** -- Returns current club member list (already available in context).
4. **create_event** -- Creates a new event for the club. Parameters: name, date, type, category, description.

#### File Upload Flow
1. User clicks a paperclip/attachment icon in the chat input area
2. File picker opens (accepts `.xlsx`, `.xls`, `.csv`, `.pdf`, `.png`, `.jpg`, `.jpeg`)
3. File is uploaded to a new `chat-uploads` storage bucket
4. For Excel/CSV files: the client-side parses the file using the existing `xlsx` library to extract headers and rows, then sends this structured data alongside the message
5. For PDF/images: the file URL is sent to the edge function, which passes it to the AI model as context (Gemini supports multimodal input)

#### Edge Function Changes
The `club-chat` edge function will be restructured to support an agentic tool-calling loop:

1. Define tools array matching the OpenAI function-calling format
2. Send initial request to AI with tools enabled
3. If AI responds with tool calls, execute them server-side, then send results back to AI
4. Continue the loop until AI produces a final text response
5. Stream the final response back to the user

Permission enforcement: all tool executions respect the same club scoping rules already in place. A user scoped to club X can only import members to club X.

#### UI Changes
- **Chat input area** (both mobile `MobileChat.tsx` and desktop `ChatPanel.tsx` / `FloatingChatWidget.tsx`):
  - Add a paperclip icon button next to the text input
  - File preview chip showing filename before sending
  - Upload progress indicator
- **ChatResponseRenderer**: Add rendering for tool execution results (e.g., "Successfully imported 15 members: 12 added, 2 updated, 1 skipped")

#### Storage
- New bucket: `chat-uploads` (public: false, RLS: authenticated users can upload/read their own files)

#### Files to Create
- `supabase/functions/club-chat-agent/index.ts` -- New edge function with agentic tool-calling loop (or refactor existing `club-chat/index.ts`)

#### Files to Modify
- `supabase/functions/club-chat/index.ts` -- Add tool definitions, agentic loop, file handling
- `src/components/chat/ChatPanel.tsx` -- Add file upload button and preview
- `src/components/chat/FloatingChatWidget.tsx` -- Add file upload button and preview
- `src/pages/MobileChat.tsx` -- Add file upload button and preview
- `src/components/chat/ChatResponseRenderer.tsx` -- Add tool result rendering blocks

#### Database Migration
- Create `chat-uploads` storage bucket with RLS policies

---

### Resources Needed From You

No additional MCP connections or external API keys are required. The implementation uses:
- **Lovable AI Gateway** (already configured with `LOVABLE_API_KEY`) for the agentic AI model with tool-calling
- **Gemini 3 Flash** supports multimodal input (images, text) and tool calling natively
- **Existing edge functions** (`create-member`, `import-members`) provide the action logic that will be inlined into the agent

Everything needed is already available in the project.

---

### Implementation Order
1. President management feature (Super Admin dashboard)
2. Storage bucket for chat uploads
3. File upload UI in chat components
4. Agentic tool-calling loop in edge function
5. Tool result rendering in ChatResponseRenderer

