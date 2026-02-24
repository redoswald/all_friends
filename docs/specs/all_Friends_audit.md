# All Friends — Structured QoL Audit

## What We're Working With

**Current state (from screenshots + past conversations):**
- Landing page (hero + 6 feature cards)
- Dashboard with stats bar (Contacts: 66, Events: 12, Overdue: 0, Due soon: 7, Incomplete: 2)
- "Needs Attention" feed with contact cards showing tags, last-seen, due dates
- Navigation: Dashboard, Contacts, Events, Calendar
- ⌘K search
- Sign out link
- Supabase auth (shared with Opus)
- Contact detail pages, event logging, tags, cadence system, OOO scheduling, relationship stages

---

## 1. ACCOUNT & SETTINGS (Missing entirely)

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
| Delete confirmation modals | ❓ Unknown | High | Contacts, events, tags — all need "Are you sure?" |
| Undo after delete | ❌ | Medium | Toast with "Undo" button (5-second window) |
| Archive vs. delete for contacts | ❌ | High | "I don't want to track this person right now" ≠ "erase them" |
| Soft delete in database | ❓ Unknown | High | `deleted_at` timestamp so nothing is truly gone immediately |
| Bulk delete safety | ❌ | Medium | "You're about to delete 12 contacts. Type DELETE to confirm." |

---

## 3. EMPTY & EDGE STATES

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Zero contacts state | ❓ Unknown | High | New user lands on dashboard and sees... what? Should see a friendly "Add your first contact" prompt |
| Zero events state | ❓ Unknown | High | Same — guide toward first event log |
| Empty search results | ❓ Unknown | Medium | "No contacts match 'xyz'" with suggestion to broaden search |
| Empty calendar month | ❓ Unknown | Low | "Nothing scheduled this month" rather than a blank grid |
| All contacts up-to-date | ❓ Unknown | Medium | Dashboard "Needs Attention" is empty — celebrate! "You're all caught up 🎉" |
| Error states | ❓ Unknown | High | What happens when Supabase is down? Network error? Auth expires mid-session? |

---

## 4. FEEDBACK & CONFIRMATION

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Toast notifications on actions | ❓ Unknown | High | "Contact saved," "Event logged," "Tag deleted" |
| Loading skeletons | ❓ Unknown | Medium | Placeholder shapes while data loads (dashboard stats, contact list) |
| Optimistic updates | ❓ Unknown | Medium | UI updates immediately, syncs in background |
| Save indicator on forms | ❓ Unknown | Medium | Auto-save with "Saved" / "Saving..." indicator, or explicit Save button with feedback |
| Error toasts | ❓ Unknown | High | "Failed to save — try again" rather than silent failure |

---

## 5. BULK OPERATIONS

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Multi-select contacts | ❌ | Medium | Checkboxes on contact list |
| Bulk tag/untag | ❌ | Medium | "Add tag 'College' to 8 selected contacts" |
| Bulk delete | ❌ | Low | Rare but necessary |
| Bulk cadence change | ❌ | Medium | "Set all selected to 30-day cadence" |
| Bulk stage change | ❌ | Low | Move multiple contacts between relationship stages |
| Select all / deselect all | ❌ | Low | Standard multi-select UX |

---

## 6. KEYBOARD & POWER USER

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| ⌘K command palette | ✅ | — | Already exists — great |
| Keyboard navigation of lists | ❓ Unknown | Medium | j/k or arrow keys to move through contacts/events |
| Shortcut to add contact | ❓ Unknown | Medium | `c` or `n` from any screen |
| Shortcut to log event | ❓ Unknown | Medium | `e` from any screen |
| Shortcut reference / help | ✅ | Low | `?` opens keyboard shortcut overlay |
| Focus management | ❓ Unknown | Medium | After creating a contact, focus goes... where? |

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
| Responsive layout | ❓ Unknown | High | The dashboard stats bar (5 cards) will break on mobile |
| Touch targets | ❓ Unknown | High | Buttons, tag pills, and due-date badges need ≥44px tap targets |
| Mobile navigation | ❓ Unknown | High | Top nav → hamburger or bottom tab bar |
| Quick event logging on mobile | ❌ | High | This is THE mobile use case: you just hung out, log it now |
| PWA / Add to Home Screen | ❌ | Medium | Makes it feel app-like on mobile without an App Store |

---

## 9. SEARCH & FILTERING

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| ⌘K global search | ✅ | — | Exists |
| Filter contacts by tag | ❓ Unknown | High | Click "High school friends" → see only those contacts |
| Filter contacts by stage | ❓ Unknown | Medium | "Show me all Acquaintances" |
| Filter contacts by status | ❓ Unknown | High | "Show me only overdue contacts" |
| Sort contacts | ❓ Unknown | Medium | By name, by last seen, by due date, by cadence |
| Filter events by contact | ❓ Unknown | Medium | "Show me all events with Connor" |
| Filter events by date range | ❓ Unknown | Medium | "Events in January" |
| Saved filters / smart views | ❌ | Low | "Overdue + Close friends" as a saved view |

---

## 10. CONTACT DETAIL POLISH

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Contact avatar/photo | ❓ Unknown | Low | Initials fallback is fine, but photo upload option |
| Phone / email / social links | ❓ Unknown | Medium | Click-to-call, click-to-email |
| Birthday field | ❓ Unknown | Medium | With optional annual reminder |
| Custom fields | ❌ | Low | "Favorite restaurant," "Partner's name," etc. |
| Contact notes (persistent) | ❓ Unknown | High | Not event notes — just a scratchpad for the contact ("Allergic to shellfish," "Just got promoted") |
| Activity timeline | ❓ Unknown | Medium | Scrollable history of all events on the contact detail |
| Quick actions from detail | ❓ Unknown | Medium | "Log event," "Edit," "Archive" buttons prominently placed |

---

## 11. CALENDAR POLISH

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Calendar exists | ✅ | — | Confirmed from landing page + past conversations |
| Click-to-add on calendar | ❓ Unknown | Medium | Click a date → "Log event on Feb 23" |
| Color coding by tag or contact | ❓ Unknown | Medium | Previous feedback flagged color system as arbitrary |
| Week view option | ❓ Unknown | Low | Monthly + weekly toggles |
| Calendar event previews | ❓ Unknown | Medium | Hover/click on a date dot → see event summary |

---

## 12. LANDING PAGE & PUBLIC PRESENCE

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Landing page | ✅ | — | Exists, looks good |
| App switcher to Opus | ✅ | High | Apps section in settings with links to All Friends and Opus |
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
| Consistent auth error handling | ❓ Unknown | Medium | Expired session → redirect to login, not a white screen |
| Shared component library | ❌ | Medium | Buttons, modals, toasts — same look across apps |

---

## Summary: Top 10 Priorities

1. **Account management page** — Profile, password, data export (shared infra)
2. **App switcher** — Minimal nav element linking All Friends ↔ Opus
3. **Delete confirmations + archive vs. delete** — Prevent data loss
4. **Toast/feedback system** — Users need to know their actions worked
5. **Empty states** — New users and zero-data screens need love
6. **Mobile responsiveness** — Quick event logging on phone is the killer mobile use case
7. **Error handling** — Network failures, auth expiry, API errors need graceful UI
8. **Welcome/onboarding flow** — First-run experience for new users (especially Zoë)
9. **Contact notes (persistent)** — Not event-tied, just "stuff I know about this person"
10. **Filter/sort on contacts** — With 66 contacts, you need more than scrolling