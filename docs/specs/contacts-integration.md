# Contacts Integration

Spec'd 2026-07-11. Covers the Tier 1 roadmap item "Contacts integration (iOS)" and the
Tier 6 item "CSV / Google Contacts import" — one philosophy, two transports.

## North star

**A "call this person" suggestion on the mobile Today page.** The user is holding their
phone; calls and texts are the lowest-friction way to tend a relationship in that moment.
Today should surface due/overdue people who are *reachable* — one tap to call or text,
then a prompt to quick-log the interaction as a CALL/MESSAGE event.

Everything below exists in service of that. The integration is not a data feature.

## Philosophy: link, don't sync

**Tend is where the relationship lives; Contacts is where the contact point lives.**
The user can manage (or mismanage) their address book however they want — the
relationship data stays pure.

- A Tend contact holds a **link** to an external contact (source + external ID), never an
  imported copy. On iOS, phone/email/photo render **live** from `CNContactStore` at
  display time. Nothing copied, nothing stale, nothing to reconcile.
- **One-way, pull-only.** Tend never writes to any address book. No write-back → no echo
  loops.
- Tend's sparse `ContactField` entry remains the manual fallback for people who aren't in
  any address book.

## Dedup: enforced at the door

Same three rules for every entry path (iOS picker, Google, CSV, vCard):

1. **No auto-create, ever.** Nothing enters Tend without a deliberate per-person user
   action. Connecting a source ≠ importing its contents.
2. **Match-before-create.** Every import/link candidate is fuzzy-matched against existing
   Tend contacts on normalized name + phone (E.164) + email. The default verb for a match
   is *link*, not *create*.
3. **Provenance + idempotency.** The external ID lives on the link; re-importing an
   already-linked person is a refresh, not an append. Any copied field carries its source
   so refreshes update in place.

## Data model

New model (or fields on Contact — decide at build time):

```
ContactLink {
  contactId    → Contact
  source       APPLE | GOOGLE
  externalId   String   // CNContact.identifier or People API resourceName
  fingerprint  String?  // normalized name + phone hash, for self-healing (see caveat)
  linkedAt     DateTime
}
```

**Caveat:** `CNContact.identifier` is stable per device but NOT across devices/restores.
Store the identifier for fast lookup plus a fingerprint server-side; if the identifier
misses on a new device, re-match by fingerprint and heal the link (confirm with the user
if ambiguous).

## iOS phases

1. **Link + reach (the core).** Contact detail → "Link to Apple Contact" →
   `CNContactPickerViewController` (requires no contacts permission at all — maximally
   intentional, works under iOS 18 limited access). Store the link; Text/Call/Email row
   and photo render live from the system contact.
2. **Today-page call suggestions (the payoff).** Due/overdue contacts who are linked with
   a phone number get a call/text affordance on Today ("You're free — call Granylo?").
   After launching a call/text, prompt to quick-log it (CALL/MESSAGE event pre-filled).
3. **Suggested links.** With contacts permission (or limited selection), exact-name
   matches surface as a review list — one tap to confirm each, never auto-linked.
4. **Add from Contacts.** New-person flow can start from the picker: prefills name,
   creates the link at birth.

## Web: CSV / vCard first, Google People API second

Shared pipeline for all file/API sources: **parse → normalize → match → review → commit.**

- **Phase 1: file import** (.csv from Google Takeout, .vcf from Apple export). The review
  screen — checkboxes per person, match-before-create verdicts inline — is the hard part
  and is required for the API version anyway.
- **Phase 2: Google People API** via OAuth. Same review screen, live search instead of a
  file. Import copies phone/email into `ContactField` with `source=GOOGLE` + external ID
  (web can't render live from Google the way iOS can from CNContactStore; provenance-
  tagged copy + manual "Refresh from Google" is the pragmatic web equivalent).
- No background sync in either phase. Refresh is user-initiated.

## Explicitly out of scope

- Writing to any external address book
- Background/two-way sync
- Bulk auto-import ("import all 900")
- Merging external duplicates on the user's behalf (their address book is their business)
