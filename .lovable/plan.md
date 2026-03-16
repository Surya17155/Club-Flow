## Feature Suggestions Plan

Based on the analysis, here are the **top features** ranked by impact, along with implementation approach for each:

---

### Feature 1: Post-Event Attendance Export to XLSX

**Why it matters**: This is the app's core value proposition — giving faculty a clean attendance sheet.

**Implementation**:

- Add an "Export Attendance" button on each event's detail view and in the Manage Events modal
- Use the `xlsx` npm package to generate proper `.xlsx` files
- Include columns: S.No, Student Name, Roll No, Programme, Section, Year, Scan Time, Status
- Available to presidents, delegated post-holders, and super admins

---

### Feature 2: Club Discovery & Join Request System

**Why it matters**: Currently only presidents can add members — no self-service path exists.

**Implementation**:

- Create a new `club_join_requests` table (user_id, club_id, status, message, created_at)
- Add a `/discover` page showing all clubs with search/filter
- Each club card shows name, logo, tagline, member count, and a "Request to Join" button
- Presidents see pending requests in their club dashboard with approve/reject actions
- On approval, auto-insert into `club_members`

**Database migration**:

```sql
CREATE TABLE public.club_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, club_id)
);
ALTER TABLE public.club_join_requests ENABLE ROW LEVEL SECURITY;
```

---

---

---

### Feature 3: Member Attendance History

**Why it matters**: Students need proof of participation for their records.

**Implementation**:

- Add an "Attendance History" section to the Member Dashboard
- Show a table/list of all events attended with date, club name, event name, and scan time
- Allow members to export their own attendance history as PDF or XLSX

&nbsp;

**Feature 4:** **🎯 Core Attendance Enhancements**

**Why it matters:** It will help the event coordinator make the last-minute mistakes and handle unplanned circumstances easily

**Implementation**:

#### **Manual Attendance Marking**

- For students without phones or QR scan issues
- Presidents can manually add attendees during/after the event
- Reason field (e.g., "phone died," "late arrival", "Extra Member/attendee")

(This feature will only work for Club Members only event types - Before this type of event, the president or club post holder will upload a list of the members attending. This applies to events designated as "club members only." If someone from outside the club attends, this feature will work specifically for them.)

**Other Features:**  
  
**📊 Reporting & Analytics**

#### **1. Attendance Trends & Reports**

- Show which members attend frequently vs. rarely
- Identify inactive members (haven't attended in X weeks)
- Club engagement metrics for presidents

**👥 Member Management**

#### **2. Attendance-Based Member Status**

- Auto-flag inactive members (no attendance in 30+ days)
- Option to archive/remove inactive members

### **📱 Mobile & UX**

#### **3. Offline QR Scanning**

- Scanning works without internet connection
- Syncs attendance when connection restored
- Useful for venues with poor connectivity

#### **4. QR Code Customisation**

- Add club logo/branding to QR codes
- Custom event details in QR data
- More professional appearance
  &nbsp;

**5. Mobile View UI**

The web app automatically adjusts its dashboards and views based on screen size. On desktop, it displays as intended, while on mobile, the UI adapts to ensure an optimal, visually appealing experience regardless of device or screen dimensions.

6. **Feedback feature**
  Members who attended the event can submit feedback afterwards. They can either use the dedicated feedback option or navigate to their Calender, select the event from the calender or date, and click the feedback button that appears along with the event details. This feature is restricted to attendees only—non-attendees cannot submit feedback. The system verifies attendance by checking whether the member’s record matches the list of attendees before enabling the feedback option.
    
    
  **Implement all features without making any errors and bugs in the existing webapp, make sure that everything should be synced or connected with each other at the backend level perfectly.**