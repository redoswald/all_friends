# Personal Relationship Manager (PRM)

## Overview

A personal CRM web application for managing relationships with intention. The core problem: maintaining meaningful relationships requires tracking who you haven't seen in a while, what you talked about, and what level of investment each relationship needs. Spreadsheets work but lack visibility, richness, and a good UX.

**This is not an enterprise CRM.** The UX should be consumer-friendly, visually clean, and fast. Think "what if a thoughtful designer built a CRM for their own friendships" rather than "Salesforce but for friends."

---

## Technical Architecture

### Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma
- **Auth:** Supabase Auth (email + OAuth for Google, to enable future Calendar integration)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Deployment:** Vercel
- **Calendar (future):** Google Calendar API, ICS import/export

### Why These Choices

- **Supabase** gives us hosted Postgres, auth, and row-level security in one place. It's also free-tier friendly for MVP.
- **Prisma** provides type-safe database access that plays well with TypeScript.
- **shadcn/ui** gives us accessible, customizable components without the bloat of a full component library.
- **Google OAuth early** because we'll need it for Calendar integration later—better to set up auth correctly from the start.

---

## Data Model

### Core Entities

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  contacts  Contact[]
  events    Event[]
  tags      Tag[]
}

model Contact {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name      String
  nickname  String?  // Optional familiar name
  notes     String?  // General notes about this person
  
  // Cadence tracking
  cadenceDays    Int?      // Desired days between contact (null = no target)
  
  // Funnel stage (relationship investment level)
  funnelStage    FunnelStage @default(ACQUAINTANCE)
  
  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  tags      ContactTag[]
  events    EventContact[]
  
  // Derived (computed at query time, not stored)
  // - lastEventDate
  // - daysSinceLastEvent  
  // - daysUntilDue
  // - isDue (boolean)
  // - isOverdue (boolean)
}

model Tag {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name      String   // e.g., "High School", "Work", "Zoe's Friends"
  color     String?  // Hex color for UI
  
  contacts  ContactTag[]
  
  @@unique([userId, name])
}

model ContactTag {
  contactId String
  tagId     String
  contact   Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([contactId, tagId])
}

model Event {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  title     String?          // Optional title, e.g., "Dinner at Zaytinya"
  date      DateTime         // When it happened/will happen
  eventType EventType        @default(HANGOUT)
  
  // Rich content (Phase 2+)
  notes         String?      // What you discussed
  actionItems   ActionItem[] // To-dos that came out of this
  
  // Calendar integration (Phase 3+)
  externalId    String?      // Google Calendar event ID, etc.
  externalSource String?     // "google_calendar", "ics_import", etc.
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations - events can have multiple contacts (group hangouts)
  contacts  EventContact[]
}

model EventContact {
  eventId   String
  contactId String
  event     Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  contact   Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  
  @@id([eventId, contactId])
}

model ActionItem {
  id        String   @id @default(cuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  description String
  completed   Boolean  @default(false)
  dueDate     DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum FunnelStage {
  PROSPECT      // Someone you want to get to know better
  ACQUAINTANCE  // You've met, early relationship
  DEVELOPING    // Building the relationship
  ESTABLISHED   // Solid friendship, regular contact
  CLOSE         // Inner circle
  DORMANT       // Intentionally lower priority right now
}

enum EventType {
  HANGOUT       // In-person meetup
  CALL          // Phone/video call
  MESSAGE       // Text/DM exchange (if you want to track these)
  EVENT         // Attended same event (party, wedding, etc.)
  OTHER
}
```

### Key Derived Fields

These are computed at query time, not stored:

```typescript
interface ContactWithDerived extends Contact {
  lastEventDate: Date | null;
  daysSinceLastEvent: number | null;
  daysUntilDue: number | null;      // null if no cadence set
  isDue: boolean;                    // within 7 days of cadence target
  isOverdue: boolean;                // past cadence target
}
```

---

## Feature Phases

### Phase 1: Contacts + Events + Cadence Alerts (MVP)

**Goal:** Replace the spreadsheet with something that works as well and looks better.

#### Features

1. **Contact List View**
   - Table/list of all contacts
   - Columns: Name, Tags, Last Seen, Cadence, Status (due/overdue/ok)
   - Sort by: name, last seen, days until due
   - Filter by: tag, funnel stage, due status
   - Quick search by name

2. **Contact Detail View**
   - Name, nickname, notes
   - Tags (add/remove)
   - Cadence setting (dropdown: weekly, biweekly, monthly, quarterly, custom days)
   - Funnel stage (dropdown)
   - Event history for this contact

3. **Event Logging**
   - Quick "log a hangout" flow: select contact(s), date, optional title
   - Events list view (all events, chronological)
   - Edit/delete events

4. **Dashboard / Home**
   - "Needs Attention" section: contacts that are due or overdue, sorted by urgency
   - Quick stats: X contacts, Y events this month, Z overdue

5. **Basic Auth**
   - Sign up / sign in with email
   - Google OAuth (for future calendar integration)

#### UI Notes

- The contact list is the primary view. Make it fast and scannable.
- Use color coding for status: green (good), yellow (due soon), red (overdue)
- Tags should be visually distinct (colored pills)
- Mobile-responsive from the start

#### API Routes (App Router)

```
GET    /api/contacts          - List contacts with derived fields
POST   /api/contacts          - Create contact
GET    /api/contacts/[id]     - Get single contact with events
PATCH  /api/contacts/[id]     - Update contact
DELETE /api/contacts/[id]     - Delete contact

GET    /api/events            - List events (with pagination)
POST   /api/events            - Create event
PATCH  /api/events/[id]       - Update event
DELETE /api/events/[id]       - Delete event

GET    /api/tags              - List user's tags
POST   /api/tags              - Create tag
DELETE /api/tags/[id]         - Delete tag

GET    /api/dashboard         - Dashboard stats + due contacts
```

---

### Phase 2: Calendar View

**Goal:** Visualize your relationship activity over time.

#### Features

1. **Monthly Calendar**
   - Shows events plotted on a calendar grid
   - Click on a day to see events or log a new one
   - Color-code by contact or by tag
   - Navigate months

2. **Event Quick-View**
   - Click an event on the calendar to see details
   - Quick edit from the popover

3. **Patterns View** (stretch)
   - "You hung out with Alex 4 times in October, 0 times in November"
   - Simple frequency insights

---

### Phase 3: Rich Events + Action Items

**Goal:** Remember what you talked about and capture follow-ups.

#### Features

1. **Event Notes**
   - Rich text field for what you discussed
   - Lightweight—not a full document editor, just markdown or plain text

2. **Action Items**
   - Capture to-dos from a hangout ("I said I'd send them that article")
   - Action items list view across all events
   - Mark complete, set due date
   - Optional: integrate with external task managers via export

3. **Contact Timeline**
   - On contact detail, show a timeline of all events with notes previews
   - "Last time you talked about: X, Y, Z"

---

### Phase 4: Friend Funnel / Pipeline View

**Goal:** Visualize and manage relationship investment levels.

#### Features

1. **Kanban View**
   - Columns for each funnel stage
   - Drag contacts between stages
   - Show key info: last seen, cadence status

2. **Funnel Transitions**
   - Log when and why someone moved stages
   - "Promoted Alex to Close on 2024-01-15"

3. **Suggested Promotions/Demotions**
   - "You've hung out with Jamie 6 times in 2 months—consider promoting to Established"
   - "You haven't seen Morgan in 6 months—move to Dormant?"

---

### Phase 5: Calendar Integration

**Goal:** Auto-populate events from your actual calendar.

#### Features

1. **Google Calendar Sync**
   - Connect Google account
   - Import events that match certain criteria (attendee name matching, manual tagging)
   - Two-way sync or import-only (start with import-only)

2. **ICS Import**
   - Upload .ics file
   - Parse and create events

3. **ICS Export**
   - Export your PRM events as .ics for use elsewhere

4. **CalDAV** (stretch)
   - For users on Apple Calendar, Fastmail, etc.

---

## UI/UX Guidelines

### General Principles

1. **Speed over features.** Every interaction should feel instant. Optimistic updates, minimal loading states.

2. **Density is okay.** This is a tool for someone managing 50-200 relationships. Don't waste space with huge cards and excessive whitespace. Take cues from Notion, Linear, or Superhuman rather than consumer social apps.

3. **Keyboard-friendly.** Power users will want shortcuts. Plan for: `c` to create contact, `e` to create event, `/` to search, `j/k` to navigate lists.

4. **Gentle color.** Status colors (green/yellow/red) should be muted, not traffic-light garish. Think subtle background tints, not loud badges.

5. **Progressive disclosure.** Show the essential info by default; reveal details on interaction (expand, hover, click through).

### Key Screens

1. **Dashboard** (`/`)
   - Primary: "Needs Attention" list (due + overdue contacts)
   - Secondary: Quick stats, recent activity

2. **Contacts** (`/contacts`)
   - Full contact list with filters and search
   - Click through to contact detail

3. **Contact Detail** (`/contacts/[id]`)
   - All info about one person
   - Inline editing
   - Event history

4. **Events** (`/events`)
   - Chronological event list
   - Calendar view toggle (Phase 2)

5. **Pipeline** (`/pipeline`) — Phase 4
   - Kanban funnel view

---

## Development Guidelines

### Code Style

- Use TypeScript strictly. No `any` types without justification.
- Prefer server components where possible; use client components for interactivity.
- Keep API routes thin; put business logic in `/lib` or `/services`.
- Use Zod for runtime validation of API inputs.

### File Structure

```
/app
  /api
    /contacts
    /events
    /tags
    /dashboard
  /(auth)
    /login
    /signup
  /(app)
    /page.tsx           # Dashboard
    /contacts
      /page.tsx         # Contact list
      /[id]/page.tsx    # Contact detail
    /events
      /page.tsx         # Events list/calendar
    /pipeline
      /page.tsx         # Funnel view (Phase 4)
  /layout.tsx
  /globals.css

/components
  /ui                   # shadcn components
  /contacts             # Contact-specific components
  /events               # Event-specific components
  /dashboard            # Dashboard components

/lib
  /db.ts                # Prisma client
  /auth.ts              # Supabase auth helpers
  /utils.ts             # General utilities
  /cadence.ts           # Cadence calculation logic

/prisma
  /schema.prisma

/types
  /index.ts             # Shared TypeScript types
```

### Cadence Calculation Logic

```typescript
// lib/cadence.ts

export function calculateContactStatus(
  lastEventDate: Date | null,
  cadenceDays: number | null
): {
  daysSinceLastEvent: number | null;
  daysUntilDue: number | null;
  isDue: boolean;
  isOverdue: boolean;
} {
  if (!lastEventDate || !cadenceDays) {
    return {
      daysSinceLastEvent: lastEventDate 
        ? daysBetween(lastEventDate, new Date()) 
        : null,
      daysUntilDue: null,
      isDue: false,
      isOverdue: false,
    };
  }

  const daysSince = daysBetween(lastEventDate, new Date());
  const daysUntil = cadenceDays - daysSince;
  
  return {
    daysSinceLastEvent: daysSince,
    daysUntilDue: daysUntil,
    isDue: daysUntil <= 7 && daysUntil > 0,
    isOverdue: daysUntil <= 0,
  };
}

function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
```

---

## Environment Setup

### Required Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (Supabase Postgres connection string)
DATABASE_URL=

# Google OAuth (for future calendar integration)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in Supabase credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

---

## Open Questions / Decisions for Later

1. **Group events:** An event can have multiple contacts (dinner party). The schema supports this. UI needs to handle multi-select gracefully.

2. **Recurring cadences:** Should cadence recalculate from *target date* or *actual last event*? Currently assuming actual last event (more forgiving).

3. **Notifications:** Eventually want reminders ("Alex is due in 3 days"). Out of scope for MVP—could be email, push, or just in-app.

4. **Data export:** Users should be able to export all their data (contacts, events) as JSON or CSV. Add this before launch.

5. **Mobile app:** Start with responsive web. Native app is a future consideration, possibly via React Native or Capacitor.

---

## Success Criteria for MVP

The MVP is done when:

1. A user can sign up/log in
2. A user can create contacts with names, tags, and cadence targets
3. A user can log events (hangouts) with one or more contacts
4. The dashboard shows which contacts are due/overdue, sorted by urgency
5. The contact list is filterable by tag and status
6. It's deployed and usable on mobile and desktop
7. It's at least as functional as the spreadsheet it replaces

---

## Reference / Inspiration

- **Monica CRM** — open source personal CRM, good data model ideas, dated UI
- **Clay** — slick consumer-ish CRM, more focused on professional networking
- **Dex** — clean UI, relationship-focused
- **Notion** — UI density and keyboard shortcuts
- **Linear** — speed and polish
- **Superhuman** — keyboard-driven UX

The goal is to combine Monica's thoughtfulness about relationships with Linear's speed and polish.
