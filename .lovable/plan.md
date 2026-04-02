

# Desktop Dashboard Redesign — SaaS-Style with Collapsible Sidebar

## What Changes

Replace the current warm-glassmorphism desktop dashboard with a clean, modern SaaS layout featuring a dark collapsible sidebar and card-based UI on a soft blue-grey background.

## Layout

```text
┌─────────┬──────────────────────────────────────────────────┐
│         │  Header: Greeting + Toggle + Actions             │
│  Dark   │──────────────────────────────────────────────────│
│ Sidebar │  Stats: Clubs Joined | Events Attended | Upcoming│
│  (nav)  │──────────────────────────────────────────────────│
│         │  ┌──────────────────────┐  ┌──────────────────┐  │
│ 220px   │  │   Event Calendar     │  │ Upcoming Events  │  │
│  or     │  │   (large card)       │  │ (320px, scroll)  │  │
│  64px   │  └──────────────────────┘  └──────────────────┘  │
│         │                                                  │
└─────────┴──────────────────────────────────────────────────┘

Outer bg: #EAF1F7
Main container: white floating card with 24px radius + shadow
```

## Plan

### 1. Create `src/components/layout/DashboardSidebar.tsx`
- Dark gradient sidebar: `linear-gradient(180deg, #1C1C1E, #111113)`
- Border-radius: `20px 0 0 20px`
- Expanded: 220px with icon + label; Collapsed: 64px icons only
- Smooth `transition: all 0.3s ease`, labels fade with `opacity: 0`
- Nav items: Dashboard, Events, Clubs, Discover, Calendar, Profile, Settings (Lucide icons)
- Active: `rgba(255,255,255,0.08)` bg, white text, 12px radius
- Inactive: `#8A8F98` text
- Profile avatar at top, collapse toggle chevron at bottom
- Persist state in `localStorage`

### 2. Redesign desktop layout in `src/pages/AdminDashboard.tsx`
- Remove warm background blobs, glassmorphism cards, and profile left column
- Outer wrapper: `min-h-screen bg-[#EAF1F7] flex`
- Sidebar on left, main content in a white floating container:
  - `bg-white rounded-3xl shadow-[0px_20px_60px_rgba(0,0,0,0.08)] p-6`
- Main content shifts with sidebar width via smooth margin transition

### 3. Simplify stats to 3 cards
- Only: **Clubs Joined**, **Events Attended**, **Upcoming Events**
- Card style: `bg-[#F7F9FC] rounded-2xl p-[18px] h-[100px]` with subtle shadow
- Remove sparkline SVGs; use clean typography only

### 4. Main content grid
- `grid-template-columns: 1fr 320px; gap: 20px`
- Left: Calendar (large card)
- Right: Upcoming Events (scrollable list card)
- All cards: `bg-[#F7F9FC] rounded-2xl p-[18px] shadow-[0px_6px_20px_rgba(0,0,0,0.04)]`

### 5. Color system
- Background: `#EAF1F7`
- Container: `#FFFFFF`
- Cards: `#F7F9FC`
- Primary text: `#0F172A`, Secondary: `#6B7280`
- No heavy borders, high whitespace, minimal noise

### 6. Responsive rule
- Sidebar hidden on mobile (existing `isMobile` check)
- Mobile view remains untouched (`MobileDashboardView`)

## Files to Create
- `src/components/layout/DashboardSidebar.tsx`

## Files to Modify
- `src/pages/AdminDashboard.tsx` — desktop return block only

No database or backend changes needed.

