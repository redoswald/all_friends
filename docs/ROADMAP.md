# Tend Roadmap

Canonical forward-looking spec for Tend. Consolidated 2026-07-08 from two sources:
the open items in `specs/tend_audit.md` (marked **[audit]**) and the loose task list
that had accumulated on the Tend project in the Intend app (marked **[intend]**).
This file wins over both; the Intend-app tasks now point here.

---

## Tier 1 — Mobile & Daily Use

- [x] **Quick event logging on mobile** — THE mobile use case: you just hung out, log it now [audit §8, High]
      — shipped natively 2026-07-10 in tend-ios (`mobile-first-flows` branch): quick-log sheet
      reachable from every tab, due-first people picker, one-tap Log from Today/People rows
- [ ] **Contacts integration (iOS)** [ios, 2026-07-10] — after "who to hang with" comes
      "who to call": link Tend contacts to Apple Contacts (`CNContactStore`) so phone/email/photo
      come from the system address book instead of manual `ContactField` entry. Shape:
      per-contact link (store `CNContact` identifier) + match-by-name suggestions + import flow
      for new people; the contact-detail Text/Call/Email action row then works for everyone,
      not just contacts with hand-entered fields. Related: "CSV / Google Contacts import" (Tier 6)
      covers the web side of the same need.
- [ ] **Event editing on mobile** [intend]
- [ ] Touch target audit — buttons are h-9/h-8/h-6; all interactive elements need ≥44px [audit §8, High]
- [ ] PWA / Add to Home Screen [audit §8, Medium]
- [ ] Streaming/Suspense on page transitions so navigation doesn't feel painful [intend] — pairs with optimistic updates [audit §4, Medium]

## Tier 2 — Trust & Safety

- [ ] Soft delete in database (`deleted_at`) — all deletes are currently hard [audit §2, High]
- [ ] Undo after delete — toast with 5-second undo window (depends on soft delete) [audit §2, Medium]
- [ ] Error boundaries (`error.tsx`) + client-side 401 handling on fetch calls [audit §3/§13, High]
- [ ] Bulk delete with typed confirmation [audit §2/§5, Medium]

## Tier 3 — Reminders & Integrations

- [ ] **Due-contact alerts → Intend task + email** [intend, reworded] — original note said
      "Send alerts to Todoist"; Todoist has since been replaced by Intend as the task system,
      so alerts should create an Intend task (cross-app, both live in the shared Supabase
      project) and/or send an email
- [ ] Notification preferences in settings (prerequisite for alerts) [audit §1, Medium]

## Tier 4 — Relationship Intelligence

- [ ] Statistics pane — deeper analytics than the dashboard stat cards (trends over time,
      per-tag/per-stage breakdowns; `tend-mcp`'s `get_social_summary` shows the shape) [intend]
- [ ] Time-sensitive notes — dated notes about a person that aren't events
      ("job interview next week", "moving in March") [intend]
- [ ] Combine/merge duplicate contacts [intend]
- [ ] Action plans [intend] — **needs definition**: the `ActionItem` model (todos attached
      to events) already exists with MCP support; clarify whether this means surfacing
      action items as a first-class view, or something new

## Tier 5 — AI

- [ ] "Develop the AI" [intend, reframed] — per `../../docs/future-phases.md` Phase 1, Tend
      gets **no embedded chat**. The AI strategy is MCP-first: `tend-mcp` already exists;
      remaining work is contextual handoff buttons ("Plan a catch-up with Katie in Claude")
      with invested prompt templates, plus the one-time connector onboarding page

## Tier 6 — Onboarding & Growth

- [ ] Welcome screen for new users — "here's the idea, add your first 5 people" [audit §7, High]
- [ ] Smart defaults — pre-populated tags (Family, Close friends, Work) [audit §7, Medium]
- [ ] CSV / Google Contacts import [audit §1/§7, Medium]
- [ ] Pricing / "is this free?" statement on landing page [audit §12, Medium]
- [ ] Privacy policy [audit §12, Medium] · Terms of service [audit §12, Low]

## Tier 7 — Power User & Polish

- [ ] Keyboard navigation of lists (j/k, arrows) [audit §6, Medium]
- [ ] Global hotkeys: add contact, log event [audit §6, Medium]
- [ ] Focus return after dialog close [audit §6, Medium]
- [ ] Filter events by contact and date range [audit §9, Medium]
- [ ] Saved filters / smart views ("Overdue + Close friends") [audit §9, Low]
- [ ] Calendar week view [audit §11, Low]
- [ ] Contact avatars/photos [audit §10, Low]
- [ ] Sample/demo data option [audit §7, Low]
- [ ] Shared component library across the suite [audit §13, Medium]
