# Tend — Structured QoL Audit

## What We're Working With

**Current state (from screenshots + past conversations):**
- Landing page (hero + 6 feature cards)
- Dashboard with stats bar (Contacts: 66, Events: 12, Overdue: 0, Due soon: 7, Incomplete: 2)
- "Needs Attention" feed with contact cards showing tags, last-seen, due dates
- Navigation: Dashboard, Contacts, Events, Calendar
- ⌘K search
- Sign out link
- Supabase auth (shared with Intend)
- Contact detail pages, event logging, tags, cadence system, OOO scheduling, relationship stages

---

## 1. ACCOUNT & SETTINGS

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Profile/account page | ✅ | High | Settings page with profile section (name, email, avatar) |
| Change password | ✅ | High | Security section — verifies current password, updates via Supabase |
| Delete account | ✅ | Medium | Data section — confirmation dialog requiring typing "DELETE" |
| Notification preferences | ❌ | Medium | If you ever add email/push reminders |
| Theme/appearance toggle | ✅ | Low | Appearance section with dark/light/system toggle |
| Data export (JSON/CSV) | ✅ | Medium | Data section — exports all user data as JSON download |
| Data import (CSV/Google Contacts) | ❌ | Medium | Onboarding accelerator |

---

## 2. DESTRUCTIVE ACTION SAFETY

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Delete confirmation modals | ✅ | High | All single-item deletes (contacts, events, tags, fields, dates, relationships, OOO) use ConfirmDialog |
| Undo after delete | ❌ | Medium | Toast with "Undo" button (5-second window) |
| Archive vs. delete for contacts | ✅ | High | isArchived flag hides from all views, restore banner, bulk archive, Archived filter toggle |
| Soft delete in database | ❌ | High | All deletes are hard deletes — no `deleted_at` on any model |
| Bulk delete safety | ❌ | Medium | "You're about to delete 12 contacts. Type DELETE to confirm." |

---

## 3. EMPTY & EDGE STATES

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Zero contacts state | ✅ | High | EmptyState component with "Add your first contact" CTA in both list and kanban views |
| Zero events state | ✅ | High | EmptyState with "Log your first event" message |
| Empty search results | ✅ | Medium | CommandEmpty shows "No results found." (generic but functional) |
| Empty calendar month | ✅ | Low | Calendar renders full grid gracefully with no events, plus icon on hover |
| All contacts up-to-date | ✅ | Medium | Two distinct states: "No contacts yet" vs "You're all caught up!" with PartyPopper icon |
| Error states | ⚠️ | High | API routes have try/catch + error toasts, but no error.tsx boundaries and command palette silently swallows errors |

---

## 4. FEEDBACK & CONFIRMATION

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Toast notifications on actions | ✅ | High | 40+ success toasts across all CRUD operations via Sonner |
| Loading skeletons | ✅ | Medium | 6 loading pages with tailored skeleton shapes (contacts, dashboard, calendar, events, settings, contact detail) |
| Optimistic updates | ❌ | Medium | All forms use traditional async/await pattern — no useTransition/useActionState |
| Save indicator on forms | ✅ | Medium | All forms show "Saving.../Creating..." button text + disabled state |
| Error toasts | ✅ | High | Comprehensive — form validation + API errors surface to users via toast.error |

---

## 5. BULK OPERATIONS

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Multi-select contacts | ✅ | Medium | Checkboxes on contact list |
| Bulk tag/untag | ✅ | Medium | Bulk tag add/remove via API |
| Bulk delete | ❌ | Low | Rare but necessary |
| Bulk cadence change | ✅ | Medium | Bulk update via API |
| Bulk stage change | ✅ | Low | Bulk update via API |
| Select all / deselect all | ✅ | Low | Header checkbox toggles all, with indeterminate state |

---

## 6. KEYBOARD & POWER USER

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| ⌘K command palette | ✅ | — | Already exists — great |
| Keyboard navigation of lists | ❌ | Medium | No j/k or arrow key navigation for contacts/events |
| Shortcut to add contact | ❌ | Medium | No global hotkey — only available via button on /contacts |
| Shortcut to log event | ❌ | Medium | No global hotkey — only via button on /events or calendar click |
| Shortcut reference / help | ✅ | Low | `?` opens keyboard shortcut overlay |
| Focus management | ⚠️ | Medium | autoFocus on some inputs, but no explicit focus return after dialog close |

---

## 7. ONBOARDING & FIRST-RUN

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Welcome screen for new users | ❌ | High | Not a tutorial — just "Here's the idea, add your first 5 people" |
| Smart defaults | ❌ | Medium | Pre-populated tags ("Family," "Close friends," "Work") |
| Sample/demo data option | ❌ | Low | "See how it works with example contacts" |
| CSV import on first run | ❌ | Medium | "Already have a list? Import it" |
| Progress indicator | ❌ | Low | "You've added 3 contacts. Most people start with 10-20." |

---

## 8. MOBILE RESPONSIVENESS

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Responsive layout | ✅ | High | Dashboard uses grid-cols-2 on mobile, grid-cols-4 on desktop. Responsive padding throughout |
| Touch targets | ⚠️ | High | Default buttons h-9 (36px), some h-8/h-6 — not all meet 44px minimum |
| Mobile navigation | ✅ | High | Hamburger menu with Sheet component sliding from left on mobile |
| Quick event logging on mobile | ❌ | High | This is THE mobile use case: you just hung out, log it now |
| PWA / Add to Home Screen | ❌ | Medium | Makes it feel app-like on mobile without an App Store |

---

## 9. SEARCH & FILTERING

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| ⌘K global search | ✅ | — | Exists |
| Filter contacts by tag | ✅ | High | Tag filter dropdown with URL parameter ?tagId={id} |
| Filter contacts by stage | ✅ | Medium | Funnel stage filter dropdown with ?funnelStage={STAGE} |
| Filter contacts by status | ✅ | High | Status filter: "Overdue", "Due soon", "On track" |
| Sort contacts | ✅ | Medium | Sortable columns: name, tags, stage, cadence, lastSeen, status |
| Filter events by contact | ❌ | Medium | No filtering UI on events page |
| Filter events by date range | ❌ | Medium | Events shown in reverse chronological order only |
| Saved filters / smart views | ❌ | Low | "Overdue + Close friends" as a saved view |

---

## 10. CONTACT DETAIL POLISH

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Contact avatar/photo | ❌ | Low | No avatarUrl on Contact model — initials only |
| Phone / email / social links | ✅ | Medium | Click-to-call (tel:), click-to-email (mailto:), social links open in new window |
| Birthday field | ✅ | Medium | ImportantDate with BIRTHDAY type, age calculation, Cake icon |
| Custom fields | ✅ | Low | ContactField model with CUSTOM type + arbitrary label/value |
| Contact notes (persistent) | ✅ | High | Notes field on Contact model, editable in create/edit forms |
| Activity timeline | ✅ | Medium | "Event History" card with chronological list, edit/delete per event |
| Quick actions from detail | ✅ | Medium | Log Event button + dropdown with Edit, Set Away, Archive, Delete |

---

## 11. CALENDAR POLISH

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Calendar exists | ✅ | — | Confirmed from landing page + past conversations |
| Click-to-add on calendar | ✅ | Medium | Click date → LogEventForm dialog with date pre-filled, plus icon on hover |
| Color coding by tag or contact | ✅ | Medium | Events use contact colors, due dates show tag colors |
| Week view option | ❌ | Low | Month view only — no weekly toggle |
| Calendar event previews | ✅ | Medium | Hover shows tooltip (title, type, date, contacts, notes), click opens edit dialog |

---

## 12. LANDING PAGE & PUBLIC PRESENCE

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Landing page | ✅ | — | Exists, looks good |
| App switcher to Intend | ✅ | High | Apps section in settings with links to Tend and Intend |
| Pricing / "is this free?" | ❌ | Medium | Even if free, say so explicitly |
| Privacy policy | ❌ | Medium | Needed if other people are signing up |
| Terms of service | ❌ | Low | Basic CYA |
| "Built by Aaron" / about | ✅ | Low | About section in settings with link to aaronos.ai |

---

## 13. CROSS-APP / SHARED INFRASTRUCTURE (applies to both apps)

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Unified account settings page | ✅ | High | Settings page with Profile, Appearance, Security, Apps, Data, About |
| App switcher in nav | ✅ | High | Apps section in settings + account menu |
| Shared avatar/display name | ✅ | Medium | Profile section with editable display name, avatar from OAuth |
| Consistent auth error handling | ⚠️ | Medium | Server-side redirect to /login works, but no client-side 401 handling on fetch calls |
| Shared component library | ❌ | Medium | Buttons, modals, toasts — same look across apps |

---

## Summary: Top 10 Priorities

1. ~~**Account management page**~~ ✅ — Profile, password, data export
2. ~~**App switcher**~~ ✅ — Minimal nav element linking Tend ↔ Intend
3. ~~**Archive vs. delete**~~ ✅ — isArchived flag, restore, bulk archive
4. ~~**Toast/feedback system**~~ ✅ — Comprehensive toasts + loading skeletons
5. ~~**Empty states**~~ ✅ — All major pages have empty state handling
6. **Mobile responsiveness** — Touch targets undersized, no quick mobile event logging
7. **Error handling** — Need error.tsx boundaries, client-side 401 handling
8. **Welcome/onboarding flow** — First-run experience for new users
9. ~~**Contact notes (persistent)**~~ ✅ — Notes field on Contact model
10. ~~**Filter/sort on contacts**~~ ✅ — Tag, stage, status filters + sortable columns
