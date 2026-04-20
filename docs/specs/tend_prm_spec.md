# All Friends PRM — Product Spec

A personal relationship manager that helps you nurture meaningful relationships with intention. Track interactions, set cadence-based reminders, log events, and organize your relationships at different investment levels.

**Tagline:** "Be the friend you wish you had."

---

## Core Concepts

### Contacts

A contact is someone you want to maintain a relationship with. Each contact has:

- **Name** (required) and optional **nickname**
- **Relationship** — free-text description of how you know them (e.g., "College roommate", "Wife's coworker")
- **Notes** — free-form text for anything you want to remember
- **Funnel stage** — where the relationship stands (see below)
- **Cadence** — how often you want to see/talk to this person
- **Tags** — user-defined, color-coded labels for organization
- **Contact fields** — structured info: email, phone, social media, custom
- **Important dates** — birthdays, anniversaries, custom (year optional)
- **Relationships** — bidirectional links to other contacts (spouse, sibling, colleague, etc.)
- **OOO periods** — date ranges when the contact is unavailable

### Funnel Stages

Every contact sits in one of six stages:

| Stage | Description |
|-------|-------------|
| Prospect | Someone you want to get to know |
| Acquaintance | You've met but aren't close yet |
| Developing | Actively building the relationship |
| Established | Solid, ongoing relationship |
| Close | Inner circle |
| Dormant | Intentionally on pause |

Contacts default to **Acquaintance** on creation.

### Cadence System

Each contact can have a target frequency — how often you want to interact with them.

**Presets:** Weekly (7d), Biweekly (14d), Monthly (30d), Quarterly (90d), or custom days. Contacts can also have no cadence target.

**Status calculation** based on days since last logged event:

| Status | Condition |
|--------|-----------|
| Overdue | Past due date |
| Due | Within 7 days of due date |
| Due Soon | Within 14 days of due date |
| OK | More than 14 days until due |
| Planned | Has an upcoming event scheduled |
| No cadence | No target set |

**Modifiers:**

- **Snooze** — temporarily pause reminders (1 week, 2 weeks, 1 month). Status resets when snooze expires.
- **OOO periods** — if a contact's due date falls within an OOO period, it shifts to the day after the period ends. While a contact is away, they show "Away for X days" instead of due/overdue.
- **Upcoming events** — if there's already a future event scheduled with this contact, due/overdue status is suppressed and shows "Planned in X days" instead.

### Events

An event is a logged interaction. Each event has:

- **Date** (required)
- **Event type** (required): Hangout, Call, Message, Event, Other
- **Title** (optional) — defaults to the event type name
- **Notes** (optional)
- **Contacts** (required, one or more) — can link multiple contacts to a single event
- **Action items** — todos attached to the event

Logging an event resets the cadence timer for all linked contacts.

### Tags

User-defined labels with optional color. Used for filtering and organization across the app. Tags are unique per user. Displayed as color-coded badges throughout the UI.

---

## Pages & Features

### Landing Page (`/`)

Public page, no auth required.

- **Hero:** Headline, subheading, illustration, CTA button ("Get Started" or "Go to Dashboard" if logged in)
- **Feature cards** (6): Contact management, event logging, smart reminders, OOO scheduling, tags & organization, relationship stages
- **Footer CTA:** "Ready to be a better friend?"

### Auth (`/login`, `/signup`)

- Email/password login and registration
- Google OAuth ("Sign in with Google" button)
- OAuth callback handled at `/auth/callback` — exchanges code for session, syncs Supabase user to Prisma

### Dashboard (`/dashboard`)

The home screen after login. Shows a high-level view of your relationships.

**Stat cards:**

| Card | Value |
|------|-------|
| Total Contacts | Count of all contacts |
| Events This Month | Events in current calendar month |
| Overdue | Contacts past their due date |
| Due Soon | Contacts due within 7 days |
| Incomplete Profiles | Contacts with only a name set (conditional — hidden if 0) |

**Needs Attention list:**
- Contacts that are due or overdue, sorted by urgency (most overdue first)
- Each row shows: name, funnel stage, last event date, tags
- Quick action: snooze (1 week / 2 weeks / 1 month)
- Click to navigate to contact detail

**Incomplete Profiles section** (if any):
- Contacts created but never fleshed out
- Links to contact detail for editing

### Contacts (`/contacts`)

The main contact management view.

**Two view modes:**

1. **List view** (table on desktop, cards on mobile)
   - Columns: checkbox, name (+ nickname), tags, funnel stage, cadence, last seen, status
   - Sortable by any column
   - "Last seen" shown as human-readable text ("Today", "3 days ago", "Never")

2. **Kanban view** (board by funnel stage)
   - Six columns, one per stage, with color-coded headers
   - Cards show: name, nickname, status badge, tags (max 2), last seen
   - Drag to move between stages (updates immediately)
   - Column headers show contact count

**Filters:**
- Search by name or nickname
- Filter by tag
- Filter by funnel stage
- Filter by status (overdue / due soon / on track)
- Clear all filters button

**Bulk operations** (appear when contacts are selected):
- Add/remove tags
- Change funnel stage
- Update cadence (presets or custom)
- Select all / clear selection

**Create contact:** "+ Add Contact" button opens a form with name, nickname, relationship, notes, funnel stage, cadence, and tags.

### Contact Detail (`/contacts/[id]`)

Full view and editing for a single contact.

**Sections:**

1. **Header** — name, status badge, cadence info, last/next event dates, edit/delete actions
2. **Core info** — name, nickname, relationship, notes, funnel stage, cadence, tags
3. **Contact fields** — email, phone, social media, custom fields (add/edit/delete per field)
   - Social options: WhatsApp, Telegram, Twitter/X, LinkedIn, Instagram, Facebook, Signal, Other
   - Fields have labels (e.g., "Work", "Personal") and optional protocol for clickable links
4. **Important dates** — birthdays, anniversaries, custom dates (year optional, auto-calculates age)
5. **OOO periods** — start/end date ranges with optional label, status indicator (active/future/past)
6. **Relationships** — bidirectional links to other contacts with type (spouse, parent, sibling, friend, colleague, boss, etc.)
7. **Events** — timeline of all events with this contact, grouped by month, newest first

### Events (`/events`)

Event logging and history.

- **Header** with "Log Event" button
- **Event list** grouped by month (reverse chronological)
- Each event shows: title/type, date, linked contacts (as clickable badges), notes
- Edit and delete via dropdown menu

**Log Event form:**
- Contact selector — search existing contacts or type a new name to create on the fly
- Date picker (defaults to today)
- Event type selector
- Optional title and notes
- Multi-contact support (log a group hangout as one event)

### Calendar (`/calendar`)

Month view of events and upcoming due dates.

- **Month grid** (6 weeks x 7 days) with prev/next month navigation
- **Events** appear on their date as colored badges
- **Contact due dates** shown as small circles with initials, calculated from cadence
- **Click a day** to open the log event form pre-filled to that date
- URL params for year/month allow bookmarking

### Command Palette (`Cmd+K` / `Ctrl+K`)

Quick search and navigation overlay.

**Search groups:**
1. **Contacts** — fuzzy search by name and nickname, click to navigate to detail page
2. **Pages** — Dashboard, Contacts, Events, Calendar

Contacts are lazy-loaded on first open. Arrow keys to navigate, Enter to select, Escape to close.

---

## Navigation

**Desktop** (md and above):
- Horizontal nav bar with "All Friends" logo
- Nav items: Dashboard, Contacts, Events, Calendar (with icons)
- Search button with Cmd+K hint
- Sign out button
- Active page indicated with coral underline

**Mobile** (below md):
- Hamburger menu in top-right
- Sheet/drawer slides in from right
- Same nav items stacked vertically with larger touch targets
- Active page highlighted with coral background

---

## Data Model

### User
- `id` (cuid)
- `supabaseId` — links to Supabase auth
- `email` (unique)
- `name`, `avatarUrl` (from Google OAuth)

### Contact
- `id`, `userId` (FK to User, cascade delete)
- `name`, `nickname`, `notes`, `relationship`
- `cadenceDays` (nullable int)
- `snoozedUntil`, `awayUntil` (nullable datetimes)
- `funnelStage` (string, default "ACQUAINTANCE")

### Event
- `id`, `userId` (FK to User, cascade delete)
- `title`, `date`, `eventType`, `notes`
- `externalId`, `externalSource` (reserved for calendar integration)
- Linked to contacts via `EventContact` join table

### Tag
- `id`, `userId` (FK to User, cascade delete)
- `name`, `color`
- Unique constraint on `[userId, name]`
- Linked to contacts via `ContactTag` join table

### ContactField
- `id`, `contactId` (FK to Contact, cascade delete)
- `fieldType` (EMAIL / PHONE / SOCIAL / CUSTOM)
- `label`, `value`, `protocol`, `sortOrder`

### ImportantDate
- `id`, `contactId` (FK to Contact, cascade delete)
- `dateType` (BIRTHDAY / ANNIVERSARY / CUSTOM)
- `label`, `day`, `month`, `year` (year nullable)
- Indexed on `[month, day]` for upcoming date queries

### ContactRelationship
- `id`, `contactId`, `relatedId` (both FK to Contact, cascade delete)
- `relationshipType` (SPOUSE / PARTNER / PARENT / CHILD / SIBLING / FRIEND / COLLEAGUE / BOSS)
- Unique constraint on `[contactId, relatedId]`
- Bidirectional — both incoming and outgoing shown on detail page

### ContactOOOPeriod
- `id`, `contactId` (FK to Contact, cascade delete)
- `startDate`, `endDate`, `label`
- Indexed on `[contactId, startDate]`

### ActionItem
- `id`, `eventId` (FK to Event, cascade delete)
- `description`, `completed` (default false), `dueDate`

---

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict)
- **Database:** PostgreSQL on Supabase, Prisma ORM
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Styling:** Tailwind CSS 4, shadcn/ui, Radix UI primitives, Lucide icons
- **Validation:** Zod
- **Toasts:** Sonner
- **Command palette:** cmdk
- **Dates:** date-fns, react-day-picker
- **Deployment:** Vercel
