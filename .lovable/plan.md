# Design 2: "New Brutalism Style" — Full Dashboard Redesign

## What Changes

Add a second design theme ("Design 2 — New Brutalism Style") to the design system. When active, it transforms the desktop dashboard (sidebar + main content) into a Neo-Brutalist aesthetic: cream background, thick black borders, hard offset shadows, bold Space Grotesk typography, and colored cards with rounded (not sharp) corners. The profile dropdown options move into the sidebar contextually based on mode (Personal vs Club).

## Layout Structure (Design 2 Active)

```text
┌─────────────────────────────────────────────────────────────┐
│  Background: #FFFDF5 (cream)                                │
│  ┌──────────┬──────────────────────────────────────────────┐ │
│  │ SIDEBAR  │  Main Card (white, border-4 black,           │ │
│  │ Black bg │  rounded-2xl, shadow-[8px_8px_0_0_#000])     │ │
│  │ border-4 │                                              │ │
│  │ rounded  │  ┌─ Header: Greeting + Toggle ─────────────┐ │ │
│  │ corners  │  │                                         │ │ │
│  │          │  ├─ Personal: 2 stat cards (centered)      │ │ │
│  │ Context  │  │  [Clubs Joined]  [Events Attended]      │ │ │
│  │ -aware   │  │                                         │ │ │
│  │ nav items│  ├─ Bottom half: 50/50 split               │ │ │
│  │          │  │  [Profile Card]  [Upcoming Events]      │ │ │
│  │          │  │  (4:5 ratio)     (4:5 ratio)            │ │ │
│  │          │  └─────────────────────────────────────────┘ │ │
│  └──────────┴──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Technical Plan

### 1. Update DesignContext — Add Design 2

**File:** `src/contexts/DesignContext.tsx`

- Extend `DesignTheme` union: `'design-1' | 'design-2'`
- Add design entry: `{ id: 'design-2', name: 'Design 2', description: 'New Brutalism Style — Cream background, thick borders, hard shadows, Space Grotesk typography' }`

### 2. Redesign DashboardSidebar for Design 2

**File:** `src/components/layout/DashboardSidebar.tsx`

- Read `useDesign()` to check active design
- When `design-2`:
  - Background: `#1a1a1a` (near-black), `border-r-4 border-black`
  - Rounded corners on the inner panel (not outer edges — blends with background)
  - Nav items: thick black text, active state = cream/yellow pill with black border + hard shadow
  - Keep macOS magnification effect on collapsed hover (unchanged)
  - Keep collapse/expand toggle
  - **Move profile dropdown options into sidebar:**
    - In **Club mode** (president/admin): show Assign Powers, Club Settings, AI Chatbot, Switch Club, Manage Club
    - In **Personal mode**: show only core nav (Dashboard, Events, Clubs, Discover, Calendar, Profile, Settings)
    - Super Admin toggle moves to sidebar when applicable
  - Sign Out stays at bottom

### 3. Redesign AdminDashboard desktop view for Design 2

**File:** `src/pages/AdminDashboard.tsx`

- Wrap existing desktop return in a design check
- When `design-2` active:
  - Outer background: `#FFFDF5` (cream)
  - Main card: `bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_#000]` with generous padding
  - **Personal mode:**
    - Only 2 stat cards: "Clubs Joined" and "Events Attended" — centered in a `grid-cols-2` layout
    - Cards: `border-4 border-black rounded-2xl shadow-[4px_4px_0_0_#000]`, light yellow (`#FFF8E1`) and light orange (`#FFF3E0`)
    - Below: 50/50 split with Profile Card (left, 4:5 aspect) and Upcoming Events (right, 4:5 aspect)
    - Profile card: same blur-overlay style as MobileProfileCard but in neo-brutalist frame (border-4, hard shadow, rounded-2xl)
    - Upcoming Events: scrollable list inside bordered card
  - **Club mode:**
    - 3 stat cards remain (Total Members, Total Events, Avg Attendance) in neo-brutalist style
    - Analytics chart below in bordered card
  - Typography: Space Grotesk (bold/black weights), greeting in large bold text
  - View mode toggle: bordered pill with hard shadow, active button fills with accent color
  - Remove ProfileDropdown from header (options now in sidebar)

### 4. Redesign DesktopFrame and DashboardLayout for Design 2

**Files:** `src/components/layout/DesktopFrame.tsx`, `src/components/layout/DashboardLayout.tsx`

- When `design-2`: outer background becomes `#FFFDF5`, main card gets `border-4 border-black rounded-2xl shadow-[8px_8px_0_0_#000]`

### 5. Add Design 2 to Super Admin theme switcher

**File:** `src/pages/SuperAdminDashboard.tsx`

- The new design entry from DesignContext will automatically appear in the existing theme grid
- Remove the placeholder "More designs coming soon" card or keep it for future designs

### 6. Load Space Grotesk font

**File:** `index.html`

- Add Google Fonts link for Space Grotesk (400, 500, 700, 900 weights) — already referenced in `tailwind.config.ts` as `font-display`

## Style Tokens (Design 2)


| Element         | Value                                                                              |
| --------------- | ---------------------------------------------------------------------------------- |
| Background      | `#FFFDF5` (cream)                                                                  |
| Card BG         | `#FFFFFF`                                                                          |
| Borders         | `border-4 border-black` (all elements)                                             |
| Shadows         | `shadow-[6px_6px_0px_0px_#000]` (cards), `shadow-[4px_4px_0px_0px_#000]` (buttons) |
| Corners         | `rounded-2xl` (curved, not sharp per user request)                                 |
| Stat card 1     | `#FFF8E1` (light yellow)                                                           |
| Stat card 2     | `#FFF3E0` (light orange)                                                           |
| Club stat cards | light green, light purple, light blue                                              |
| Font            | Space Grotesk, weights 700/900 for headings, 500 for body                          |
| Active nav      | Cream/white pill, black text, hard shadow                                          |


## What Stays the Same

- Mobile views (untouched)
- macOS magnification effect on collapsed sidebar hover
- Collapse/expand sidebar toggle
- All data fetching and business logic
- Design 1 remains fully functional and switchable

## Implementation Order

1. Update DesignContext with Design 2
2. Load Space Grotesk font
3. Update DashboardSidebar (design-aware styling + moved profile options)
4. Update AdminDashboard desktop view (neo-brutalist cards, 2-card personal layout, profile card, upcoming events)
5. Update DesktopFrame/DashboardLayout shells
6. Verify Super Admin theme switcher shows both designs  
  
prompt for your help (Chatgpt master prompt using the reference orange colored neo brutalism style image,  have alo given you too):  
  
Design a desktop dashboard UI using a New Brutalism design style with a clean structured layout and a collapsible sidebar.
  ### CORE STYLE
  Use a bold, flat New Brutalism aesthetic:
  - No gradients
  - No blur effects
  - No soft shadows
  - Use strong borders and offset shadows
  - High contrast typography
  ---
  ### BACKGROUND
  Use a warm cream stone background:
  #F4EFE7
  ---
  ### SIDEBAR
  Create a collapsible sidebar:
  - Expanded width: 220px
  - Collapsed width: 64px
  - Background: #111111
  - Text: #FFFFFF
  Navigation items:
  Dashboard, Events, Clubs, Discover, Calendar, Profile, Settings
  Active item:
  - background: #E98A3A
  - color: #111111
  - border: 2px solid #111111
  Inactive:
  - color: #B0B0B0
  Hover:
  - background: #2A2A2A
  Transition:
  - 0.25s ease
  Main content shifts horizontally when sidebar collapses/expands.
  ---
  ### TYPOGRAPHY
  Headings:
  - Font: Clash Display
  - Weight: 600
  - Sizes:
    H1: 40px
    H2: 28px
    H3: 20px
  Body:
  - Font: Satoshi
  - Size: 14px
  Small text:
  - 12px
  Text color:
  - #111111 primary
  - #2A2A2A secondary
  ---
  ### CARDS
  Default card:
  - background: #FFFFFF
  - border: 2px solid #111111
  - border-radius: 12px
  - box-shadow: 4px 4px 0px #111111
  - padding: 16px
  Hover:
  - transform: translate(-2px, -2px)
  - box-shadow: 6px 6px 0px #111111
  Accent card:
  - background: #F6E1CF
  ---
  ### LAYOUT
  Main layout:
  [Sidebar] + [Main Content]
  Inside main content:
  Stats Row:
  - 3 cards (Clubs Joined, Events Attended, Upcoming Events)
  Main Grid:
  - Left: Calendar (large)
  - Right: Upcoming Events (scrollable)
  Grid:
  - grid-template-columns: 1fr 320px
  - gap: 20px
  ---
  ### SPACING
  - Page padding: 24px
  - Card padding: 16px
  - Gap: 20px
  ---
  ### UX FEEL
  - Bold, structured, high contrast
  - Minimal but expressive
  - Physical interaction feel (hover shifts)
  - No soft UI elements
  ---
  ### RESPONSIVE
  Sidebar hidden on mobile.
  ---
  Ensure strict consistency in borders, spacing, and typography. Do not introduce gradients, blur, or soft shadows.