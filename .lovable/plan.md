
Goal: rebuild the ClubBot event-details card so it matches your exact flow, and harden the agent so event-detail requests consistently return the correct UI instead of plain text or the old glassy card.

1. Replace the current event-detail UI in `src/components/chat/ChatResponseRenderer.tsx`
- Remove the current “description card”, “event details card”, glassy popup/backdrop, and the “Access” row entirely.
- Rebuild the event view as one clean flat section using `bg-card` and normal borders only.
- New order:
  1) Club/Event title at top
  2) Date
  3) Time (start–end)
  4) Description as plain text directly in the section
  5) Important event details from creation flow
  6) Attendance button
- Event detail fields shown here will be only the ones that make sense from the event form, such as:
  - event type
  - category
  - attendance given: yes/no
  - open to all / club members only
- I will normalize raw stored values like `open`, `club_only`, `restricted`, `hackathon`, etc. into readable labels.

2. Convert Attendance into an in-section panel, not a fullscreen modal
- Replace the current fixed overlay with an internal same-size panel swap inside the same event card area.
- Clicking “Attendance” will switch this section into an attendance view of the same width/height.
- Add a top-left close/X button to return to the event summary.
- Add a visible vertical scrollbar in the attendance list area.
- Keep the card simple and non-glassy.

3. Rebuild attendee list tiles
- Each attendee will render as an individual tile with:
  - profile photo if available, otherwise fallback avatar
  - full name
  - programme
  - section
- Clicking a tile will smoothly expand it to reveal more details such as:
  - email
  - phone
  - roll number
  - year
  - class coordinator
  - scan time / attendance method
- This directly addresses the current problem where attendees are shown as chips/names instead of proper tiles.

4. Restore and correct Export behavior
- Add Export at the top of the attendance panel.
- Export dropdown will offer exactly:
  - PDF
  - CSV
- CSV will export all attendee rows.
- PDF export will produce the same attendance data in a readable tabular format.
- I will remove the current Excel-only wording/logic from this specific ClubBot event-details UI so it matches your requested flow.

5. Fix the agent response path so event-detail requests always use the correct renderer
- Update `supabase/functions/club-chat/index.ts` so requests like:
  - event details
  - attendance data
  - report
  - export
  - download event data
  reliably trigger `fetch_event_data`.
- Tighten the system instructions so the model must return `event-data-json` for those requests instead of generic `events-json` or plain text.
- Add a stricter post-tool response pattern so the final response always contains the structured `event-data-json` block the frontend expects.

6. Improve event data returned from the backend
- Ensure `fetch_event_data` sends all fields needed by the new UI:
  - club name
  - event name
  - event date
  - start/end time
  - event type
  - category
  - access label
  - attendance given
  - description
  - attendee profile details
  - avatar URL if available
- This is important because the current selected UI shows bad/placeholder values like “Access / Not Specified”.

7. Prevent fallback to the wrong old card
- The current chat renderer still has two different event UIs:
  - generic `events-json` cards
  - detailed `event-data-json` card
- I will keep the generic event list for normal “show events” requests, but ensure detailed/report/export requests render only the detailed event-data view.
- This avoids the old glassy expandable event card appearing when you actually asked for attendance/report details.

Technical details
- Files to update:
  - `src/components/chat/ChatResponseRenderer.tsx`
  - `supabase/functions/club-chat/index.ts`
- Likely frontend changes:
  - add internal “summary vs attendance panel” state
  - replace fixed overlay with same-container panel
  - add avatar rendering support
  - add PDF + CSV export helpers for event attendance
  - add readable label mappers for `event_type` and `access_type`
- Backend prompt/tooling changes:
  - strengthen intent routing for event-detail/report/export prompts
  - force `fetch_event_data` + `event-data-json` for detailed event responses
  - enrich payload so UI never has to guess missing labels

Implementation order
1. Fix backend response contract for event-detail requests
2. Rebuild the detailed event card layout
3. Replace fullscreen attendance modal with in-card attendance panel
4. Rebuild attendee tiles with expandable details and avatars
5. Add PDF/CSV export in the attendance panel
6. Verify that detailed event prompts no longer fall back to plain text or the old event card
