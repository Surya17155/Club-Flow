# Phase 1: IILM Multi-Club Attendance System — Core Build

## Overview

Build the core attendance management web app for IILM University clubs with QR-based attendance, role-based dashboards, and the distinctive warm golden/amber UI from the reference images.

**Backend:** Supabase (Lovable Cloud) for auth, database, and edge functions.

---

## 1. Design System & Theme

- Warm golden/amber gradient backgrounds matching the reference images
- Card-based layout with subtle shadows and rounded corners
- Soft cream/gold color palette with accent colors for different clubs
- Mini sparkline-style decorative charts on stat cards
- Clean typography, professional look

## 2. Authentication & Registration

- **Student signup** with college email restriction (`@iilm.edu` domain only)
- Required fields: Name, Programme, Section, Year/Semester, Admission No./Roll No., Phone, College Email, Profile Photo
- **Admin accounts** can use any email (admin whitelists external emails)
- Email verification flow
- Login/logout with session management
- Password reset flow

## 3. Database Schema (Supabase)

- **profiles** — student details (name, programme, section, year, semester, roll no., phone, avatar, social links)
- **clubs** — club info (name, description, logo, about text)
- **club_members** — links users to clubs with roles
- **user_roles** — separate roles table (admin, president, vp, secretary, member, etc.)   
  
- (admin can create the post holders using their dashboard, they can create new post holders and deligate student to that post and that student dashboard automatically made changes, like in their dashboard, how any clubs they have joined will increase and a Tagof post holder will added in their bio, like Vive predident of XYZ club, Secretary or Social Media head of XYZ club like that, the changes will be sync in real time)  

- **events** — event name, type, category (mandatory/optional/selective), access type (restricted/open_club/open_college), date/time, description, QR token, TTL
- **attendance** — student_id, event_id, scanned_at, status (present/manual_override)
- **event_participants** — pre-approved list for restricted events
- Row-Level Security on all tables

## 4. Admin Dashboard (matches reference image)

- Left sidebar: Admin profile card with photo, name, role, About section, class/programme/semester, social links
- **Top stats row:** Total Members, Total Events, Avg. Attendance Rate, Overall Growth %
- **Center:** Attendance Analytics chart (bar + line chart with engagement score)
- **Right sidebar:** Upcoming Events list, Task Progress section
- **Bottom:** Feedback Summary area (placeholder for future AI)
- Toggle between Personal/Club view
- Create a chat feature button on top right cornor where club admins and members can communicate with an AI. Members can ask questions related to their activities, inquire about upcoming club events, and check the tasks assigned to them. The AI will only provide information relevant to the specific member who is asking the questions. However, if an admin interacts with the AI, it can provide information about the entire club. The AI will be connected to the backend of the app to ensure accurate and personalized responses.

## 5. Club Dashboard (matches reference image)

- Club logo and name, About section, Current Post-holders list
- **Top stats:** Total Members, All-Time Attendance, Engagement Index
- **Monthly Calendar** showing events color-coded by club
- **Right sidebar:** Upcoming Events, Previous Events with quick links
- **Bottom:** Participation Analytics line chart
- Create a chat feature button same as admin dashboard

## 6. Student/Member Dashboard (matches reference image)

- Profile card with photo, name, role (Member/Lead), About section
- **Top stats:** Clubs Joined, Events Attended, Total Tasks
- **Calendar view** of upcoming events across all clubs
- **Right sidebar:** My Assigned Tasks list
- **Bottom:** Upcoming events for you, Attendance History
- Create a chat feature button same as admin dashboard

## 7. Event Management

- **Create Event** form: name, type (workshop, seminar, industrial visit, guest lecture, meeting), category, access type, date/time, description
- **Event types** as tags — admin can add custom types
- Events list/grid view with filters (date, type)
- For restricted events: upload Excel/CSV of approved students
- Delete/archive events

## 8. QR Code Attendance System

- Admin generates unique QR code per event (contains a URL with event token)
- QR code displayed on screen for students to scan with phone camera
- Student scans → opens web URL → if logged in, attendance auto-marked → success confirmation message
- If not registered, redirected to signup first
- **One scan per student per event** (duplicate prevention server-side)
- **TTL enforcement** — QR only valid during event time window
- Admin can manually add/remove attendance with audit logging
- And Admin can give access of his powers to other post holders in his club, so admin can just manage on top level and his subordinate can manage things on his own.

## 9. Navigation & Routing

- `/` — Landing/Login page
- `/signup` — Student registration
- `/dashboard` — Role-based dashboard (redirects to appropriate view)
- `/admin` — Admin dashboard
- `/club/:id` — Club dashboard
- `/events` — Events list
- `/events/:id` — Event detail with QR
- `/profile/:id` — User profile view
- `/mark-attendance/:token` — QR scan landing page (marks attendance)

## 10. Key Features for Phase 1

- Search functionality across the app
- Filter events by date range (7/30/90/365 days)
- Member profiles viewable by other members (limited info) and admins (full info)
- Attendance percentage calculation per club (mandatory events only)
- Manual attendance override with audit log
- Responsive design (works on mobile for scanning)

---

**Phase 2 (future):** Task management, Google Sheets sync via n8n, geo-fencing, AI feedback summaries, notifications, data retention settings, photo gallery, reviews/ratings system.