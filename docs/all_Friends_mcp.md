# All Friends MCP Server — Spec

> A lightweight MCP server that gives Claude Desktop direct access to the All Friends Supabase database. This is an experiment to test whether a conversation-first interface is better than opening the web app for day-to-day relationship management.

---

## 1. What This Is

A local Node.js process that runs on Aaron's Mac, speaks MCP over stdio, and makes HTTPS calls to the existing All Friends Supabase project. No new infrastructure. No changes to the existing web app. Claude Desktop spawns it on launch and every conversation gains access to the tools below.

## 2. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | Node.js (already installed via Homebrew) | Same ecosystem as the existing app |
| MCP SDK | `@modelcontextprotocol/sdk` | Official Anthropic SDK for MCP servers |
| Supabase client | `@supabase/supabase-js` | Same client the web app uses |
| Config | `.env` file in `mcp/` directory | `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` |

### Project setup

The MCP server lives inside this repo under `mcp/`. This keeps the schema reference in sync — when the Prisma schema changes, the MCP tools are right there to update in the same commit. It also lets the server share type definitions and utility logic (like cadence calculation) with the web app.

```
All_Friends/
├── mcp/
│   ├── package.json          # Standalone deps (sdk, supabase-js, dotenv)
│   ├── friends-server.js     # MCP server entry point
│   ├── lib/
│   │   ├── supabase.js       # Supabase client init
│   │   ├── cadence.js        # Cadence status calculation (port of lib/cadence.ts)
│   │   └── fuzzy.js          # Contact name matching
│   └── .env                  # Local-only credentials (gitignored)
├── prisma/schema.prisma      # Source of truth for both web app and MCP
├── lib/cadence.ts            # Web app cadence logic (reference for port)
└── ...
```

```bash
cd mcp
npm init -y
npm install @modelcontextprotocol/sdk @supabase/supabase-js dotenv
```

### Environment

```env
# mcp/.env (gitignored)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
FRIENDS_USER_ID=<aaron's user id from the User table>
```

We use the service role key (not the anon key) because this runs locally and needs to bypass RLS. This key never leaves your machine. The `FRIENDS_USER_ID` scopes all queries to your data — hardcoded for now since this is a single-user experiment.

---

## 3. Schema Reference

The MCP server reads from and writes to the same tables as the web app. **Do not create new tables.** The source of truth is `prisma/schema.prisma` — check it for the latest columns before implementing. Key models summarized below.

### Contact
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| name | String | Full name |
| nickname | String? | Optional familiar name |
| notes | String? | General notes |
| relationship | String? | How they know you (e.g., "College roommate") |
| cadenceDays | Int? | Desired days between contact (null = no target) |
| funnelStage | Enum | PROSPECT, ACQUAINTANCE, DEVELOPING, ESTABLISHED, CLOSE, DORMANT |
| location | String? | Free text address or city |
| metroArea | String? | Normalized metro area (e.g., "Washington, DC") |
| isSelf | Boolean | True for the user's own contact record |
| isArchived | Boolean | Hidden from active views but restorable |

### Event
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| title | String? | e.g. "Dinner at Zaytinya" |
| date | DateTime | When it happened/will happen |
| eventType | Enum | HANGOUT, CALL, MESSAGE, EVENT, OTHER |
| notes | String? | What you discussed |
| location | String? | Where it happened (e.g., "Zaytinya, Penn Quarter") |

### EventContact (junction)
| Column | Type | Notes |
|--------|------|-------|
| eventId | String | FK → Event |
| contactId | String | FK → Contact |

### Tag
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| name | String | e.g. "High School", "Work", "Zoe's Friends" |
| color | String? | Hex color |

### ContactTag (junction)
| Column | Type | Notes |
|--------|------|-------|
| contactId | String | FK → Contact |
| tagId | String | FK → Tag |

### ActionItem
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| eventId | String | FK → Event |
| description | String | |
| completed | Boolean | Default false |
| dueDate | DateTime? | |

### ContactOOOPeriod
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| contactId | String | FK → Contact |
| startDate | DateTime | Start of OOO period |
| endDate | DateTime | End of OOO period (day they return) |
| label | String? | e.g. "Cruise", "Work trip" |
| destination | String? | Where they're going (free text) |
| destinationMetro | String? | Normalized metro area of destination |

### ContactRelationship
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| contactId | String | FK → Contact |
| relatedId | String | FK → Contact |
| relationshipType | String | SPOUSE, PARTNER, PARENT, CHILD, SIBLING, FRIEND, COLLEAGUE, BOSS |

### ImportantDate
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| contactId | String | FK → Contact |
| dateType | String | BIRTHDAY, ANNIVERSARY, CUSTOM |
| day | Int | 1-31 |
| month | Int | 1-12 |
| year | Int? | Nullable for unknown year |

---

## 4. Tools

### Design Principles

- **Read-heavy, write-light.** Most interactions will be "who should I reach out to?" or "what's my social month look like?" Writes are occasional: logging an event, adding a contact.
- **Return enough context for Claude to reason.** Don't return just names — return cadence status, last event, tags, OOO status, location. Claude should be able to answer follow-up questions without another tool call.
- **Keep tool count small.** Fewer tools = Claude picks the right one more reliably. Target ~8 tools, not 20.
- **Descriptions matter enormously.** Claude chooses tools based on the description string. Be specific about when each tool is useful.
- **OOO-aware by default.** Contacts who are currently away should be deprioritized in overdue lists, and their return date surfaced as a nudge. The web app already shifts due dates past OOO — the MCP server should mirror this.

---

### 4.1 `get_contacts`

**Description for Claude:** "Search and list contacts from the All Friends relationship manager. Returns contacts with their tags, cadence status, last event date, funnel stage, location, and OOO status. Use this when the user asks about their contacts, wants to find someone specific, or asks broad questions about their social circle."

**Parameters:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| search | string | no | Fuzzy match on name or nickname |
| tag | string | no | Filter by tag name (exact match) |
| stage | string | no | Filter by funnel stage |
| metro_area | string | no | Filter by metroArea (e.g., "DC") |
| overdue_only | boolean | no | If true, only return contacts past their cadence |
| include_archived | boolean | no | Default false |
| limit | number | no | Default 25, max 100 |

**Returns:** Array of contact objects, each including:
```json
{
  "id": "clx...",
  "name": "Alex Chen",
  "nickname": "AC",
  "notes": "Works at Stripe. Loves hiking.",
  "cadenceDays": 30,
  "funnelStage": "ESTABLISHED",
  "metroArea": "DC",
  "tags": ["College", "DC"],
  "lastEventDate": "2026-03-15",
  "lastEventTitle": "Coffee at Compass",
  "lastEventLocation": "Compass Coffee, 14th St",
  "daysSinceLastEvent": 21,
  "daysUntilDue": 9,
  "isOverdue": false,
  "ooo": null
}
```

When a contact is currently OOO or has upcoming OOO:
```json
{
  "ooo": {
    "status": "away",
    "label": "Europe trip",
    "destination": "Paris",
    "returnDate": "2026-04-15"
  }
}
```

**Implementation notes:**
- Join through EventContact to find the most recent Event per contact
- Compute `daysSinceLastEvent` and `daysUntilDue` in the server, mirroring `lib/cadence.ts` (including OOO-aware due date shifting)
- Exclude `isSelf` contacts from results
- Exclude archived contacts by default
- Sort by urgency: overdue first (most overdue at top), then due soon, then the rest alphabetically
- Contacts currently OOO should sort after non-OOO overdue contacts (they're away — can't do anything about them right now)

---

### 4.2 `get_contact_detail`

**Description for Claude:** "Get full details about a specific contact, including their complete event history, tags, action items, cadence status, OOO periods, relationships, and important dates. Use this when the user asks about a specific person, wants to prepare for seeing someone, or asks 'what did I last talk about with [name]?'"

**Parameters:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| contact_id | string | yes* | |
| name | string | yes* | Lookup by name if no ID (* one of the two is required) |

**Returns:**
```json
{
  "contact": {
    "id": "clx...",
    "name": "Alex Chen",
    "nickname": "AC",
    "notes": "Works at Stripe. Loves hiking.",
    "metroArea": "DC",
    "funnelStage": "ESTABLISHED",
    "relationship": "College roommate"
  },
  "tags": ["College", "DC"],
  "cadenceStatus": {
    "cadenceDays": 30,
    "daysSinceLastEvent": 21,
    "daysUntilDue": 9,
    "isOverdue": false
  },
  "ooo": {
    "current": null,
    "upcoming": [
      { "startDate": "2026-05-01", "endDate": "2026-05-10", "label": "Beach trip", "destination": "Outer Banks" }
    ]
  },
  "relationships": [
    { "name": "Jamie Park", "type": "FRIEND" }
  ],
  "importantDates": [
    { "type": "BIRTHDAY", "month": 8, "day": 15, "year": 1994 }
  ],
  "events": [
    {
      "id": "clx...",
      "title": "Coffee at Compass",
      "date": "2026-03-15",
      "eventType": "HANGOUT",
      "location": "Compass Coffee, 14th St",
      "notes": "Talked about his Stripe promotion. He's thinking about buying in Shaw.",
      "otherContacts": ["Jamie Park"],
      "actionItems": [
        { "id": "clx...", "description": "Send him the Shaw real estate agent contact", "completed": false }
      ]
    }
  ],
  "totalEvents": 12,
  "firstEventDate": "2024-06-10"
}
```

**Implementation notes:**
- Events sorted reverse chronological (most recent first)
- Include `otherContacts` on each event — useful context ("oh, last time I saw Alex it was with Jamie")
- Include `location` on each event
- Cap events at the 20 most recent to keep response size reasonable; include `totalEvents` count
- Include all OOO periods (past ones are useful context: "Alex was in Paris in March")
- Include relationships and important dates for conversation prep

---

### 4.3 `get_upcoming`

**Description for Claude:** "Get planned future events and relevant OOO periods. Use when the user asks 'who am I seeing this week?', 'what's on my social calendar?', 'who's traveling?', or anything about upcoming plans."

**Parameters:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| days_ahead | number | no | Default 14, max 90 |

**Returns:**
```json
{
  "events": [
    {
      "id": "clx...",
      "title": "Dinner with Sarah",
      "date": "2026-04-08",
      "eventType": "HANGOUT",
      "location": "Le Diplomate",
      "contacts": [
        { "name": "Sarah Kim", "metroArea": "DC" }
      ]
    }
  ],
  "ooo": {
    "self": [
      { "startDate": "2026-04-20", "endDate": "2026-04-25", "label": "Beach trip", "destination": "Outer Banks" }
    ],
    "contacts": [
      { "contactName": "Alex Chen", "startDate": "2026-04-10", "endDate": "2026-04-15", "destination": "Paris", "label": "Europe trip" }
    ]
  }
}
```

**Implementation notes:**
- Include event locations
- Surface OOO periods (both self and contacts) that overlap the lookahead window — essential for planning ("don't try to schedule something with Alex next week, he's in Paris")
- Self-OOO appears separately so Claude can say "you're away the 20th–25th"

---

### 4.4 `get_social_summary`

**Description for Claude:** "Get a high-level summary of the user's relationship health. Returns overdue contacts (OOO-aware), upcoming events, who's currently away, who's returning soon, open action items, upcoming birthdays, and funnel stage distribution. Use this for morning briefings, weekly reviews, or when the user asks something general like 'how am I doing with keeping up with people?'"

**Parameters:** None.

**Returns:**
```json
{
  "overdue": [
    { "name": "Marcus", "daysSinceLastEvent": 67, "cadenceDays": 30, "metroArea": "DC" }
  ],
  "dueSoon": [
    { "name": "Alex Chen", "daysUntilDue": 3, "cadenceDays": 30, "metroArea": "DC" }
  ],
  "currentlyAway": [
    { "name": "Jamie Park", "destination": "Tokyo", "returnDate": "2026-04-10", "label": "Vacation" }
  ],
  "returningThisWeek": [
    { "name": "Jamie Park", "returnDate": "2026-04-10", "destination": "Tokyo" }
  ],
  "selfOOO": {
    "current": null,
    "next": { "startDate": "2026-04-20", "endDate": "2026-04-25", "label": "Beach trip" }
  },
  "upcomingEvents": [
    { "title": "Dinner with Sarah", "date": "2026-04-08", "location": "Le Diplomate", "contacts": ["Sarah Kim"] }
  ],
  "upcomingBirthdays": [
    { "name": "Alex Chen", "date": "August 15", "daysAway": 132 }
  ],
  "openActionItems": [
    { "id": "clx...", "description": "Send Alex the real estate contact", "fromEvent": "Coffee at Compass", "contact": "Alex Chen" }
  ],
  "stageDistribution": {
    "CLOSE": 5,
    "ESTABLISHED": 12,
    "DEVELOPING": 8,
    "ACQUAINTANCE": 15,
    "PROSPECT": 3,
    "DORMANT": 2
  },
  "stats": {
    "totalContacts": 43,
    "eventsThisMonth": 7,
    "eventsLastMonth": 11
  }
}
```

**Implementation notes:**
- This is the "daily briefing" tool. It's the most important read tool.
- **OOO-aware overdue:** Contacts currently OOO should NOT appear in `overdue` or `dueSoon` — they appear in `currentlyAway` instead. Contacts whose due date was shifted past their OOO period should show the shifted due date.
- `returningThisWeek` is a nudge bucket: "Jamie's back from Tokyo on Thursday — good time to reach out"
- Overdue sorted by severity (most overdue first)
- Cap overdue/dueSoon at 10 each to keep the response focused
- Upcoming events capped at next 7 days
- Upcoming birthdays: next 30 days, from ImportantDate where dateType = "BIRTHDAY"

---

### 4.5 `log_event`

**Description for Claude:** "Log a social interaction — a hangout, call, text, or other contact with one or more people. Use when the user says things like 'I just had coffee with Alex', 'I texted Sarah yesterday', or 'log that I saw Marcus and Jamie at the bar on Friday.' This updates the cadence clock for all involved contacts."

**Parameters:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| contact_names | string[] | yes | Names of people involved. Server fuzzy-matches to existing contacts. |
| date | string | no | ISO date. Defaults to today. |
| event_type | string | no | HANGOUT, CALL, MESSAGE, EVENT, OTHER. Defaults to HANGOUT. |
| title | string | no | Short description, e.g. "Coffee at Compass" |
| notes | string | no | What you discussed, freeform |
| location | string | no | Where it happened, e.g. "Zaytinya, Penn Quarter" |
| action_items | string[] | no | Follow-ups that came out of the conversation |

**Returns:**
```json
{
  "event": {
    "id": "clx...",
    "title": "Coffee at Compass",
    "date": "2026-04-05",
    "location": "Compass Coffee, 14th St",
    "contacts": ["Alex Chen"]
  },
  "contactsUpdated": [
    { "name": "Alex Chen", "newDaysUntilDue": 30 }
  ],
  "actionItemsCreated": 1,
  "warnings": []
}
```

**Implementation notes:**
- **Fuzzy matching strategy:** Match `contact_names` against existing contacts using case-insensitive substring first, then first-name-only matching (e.g., "Jake" matches "Jake Morrison" if there's only one Jake). If multiple matches, include a warning listing the candidates rather than guessing. If no match found, include a warning like `"Could not find contact 'Alx' — did you mean 'Alex Chen'?"` rather than failing silently or auto-creating.
- If `action_items` are provided, create ActionItem rows linked to the event.
- Date strings should be parsed as local dates at noon UTC (same as `lib/validations.ts` `parseLocalDateToUTC`).
- This is the most important write tool. It should feel effortless — "I saw Jake" should be enough.

---

### 4.6 `add_contact`

**Description for Claude:** "Add a new person to the relationship manager. Use when the user mentions someone new they want to track, like 'add my new coworker Priya — we should hang out monthly' or 'I met someone named Jordan at the party, add them as a prospect.'"

**Parameters:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | |
| nickname | string | no | |
| notes | string | no | |
| relationship | string | no | How user knows them (e.g., "College roommate") |
| cadence_days | number | no | Desired days between contact |
| stage | string | no | Default ACQUAINTANCE |
| metro_area | string | no | Where they live (e.g., "DC", "NYC") |
| tags | string[] | no | Tag names. Create new tags if they don't exist. |

**Returns:** The created contact object with tags.

---

### 4.7 `update_contact`

**Description for Claude:** "Update an existing contact's information — their cadence, funnel stage, notes, location, or tags. Use when the user says things like 'move Alex to Close', 'change Marcus's cadence to every two weeks', 'Alex moved to New York', or 'add the tag DC to Sarah.'"

**Parameters:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| contact_id | string | yes* | |
| name | string | yes* | Lookup by name if no ID |
| updates | object | yes | Any subset of: `cadenceDays`, `funnelStage`, `notes`, `nickname`, `relationship`, `metroArea`, `location` |
| add_tags | string[] | no | Tags to add (created if they don't exist) |
| remove_tags | string[] | no | Tags to remove |

**Returns:** The updated contact object with new cadence status.

---

### 4.8 `complete_action_item`

**Description for Claude:** "Mark an action item as completed. Use when the user says they've done a follow-up, like 'I sent Alex that real estate contact.'"

**Parameters:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| action_item_id | string | yes* | |
| description_search | string | yes* | Fuzzy match on description if no ID |

**Returns:** The updated action item with event context.

---

## 5. Name Matching Strategy

Fuzzy contact matching is critical for the conversational UX. The server should try these in order:

1. **Exact match** on `name` (case-insensitive)
2. **Exact match** on `nickname` (case-insensitive)
3. **Substring match** — "Alex" matches "Alex Chen"
4. **First name match** — "Jake" matches "Jake Morrison" (only if there's exactly one match)
5. **No match** — return a warning with the closest candidates (by Levenshtein distance or prefix match)

When there are **multiple matches** at any step, return a warning listing the candidates and don't pick one. Let Claude ask the user to clarify.

This logic lives in `mcp/lib/fuzzy.js` and is used by `log_event`, `get_contact_detail`, `update_contact`, and `complete_action_item`.

---

## 6. Claude Desktop Config

```json
{
  "mcpServers": {
    "all-friends": {
      "command": "node",
      "args": ["/Users/aaron/Desktop/code/aaronOS/All_Friends/mcp/friends-server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

The server reads `.env` from the `mcp/` directory for Supabase credentials.

---

## 7. What We're Testing

The hypothesis is: **daily relationship management is better as a conversation than as a CRUD app.**

Specifically, we want to learn:

1. **Is `get_social_summary` → conversation the new morning routine?** Does Aaron actually ask Claude "who should I reach out to?" more often than he opens the Friends dashboard?

2. **Is `log_event` via conversation lower friction than the web UI?** "I saw Jake at happy hour at The Pub, we talked about his new apartment" vs. clicking New Event → picking contacts → typing notes → saving.

3. **Does Claude add value as a co-thinker?** Not just reading data back, but saying things like "You've seen Alex 4 times this month but haven't talked to Marcus since January — want to shift some energy?" or "Jamie's back from Tokyo on Thursday — good time to grab lunch." This is the Maestro thesis applied to relationships.

4. **Does location data add value in conversation?** "You always go to Compass Coffee with Alex — want to try somewhere new?" or "You were in Penn Quarter a lot this month."

5. **What's missing?** After a week of using this, what tools does Aaron wish existed? What data does Claude need that it doesn't have?

## 8. What This Does NOT Do

- **Does not replace the web app.** The calendar view, the visual kanban, the contact detail page — those still live in the React app. This is an additional interface, not a replacement.
- **Does not handle auth.** It's a local process with a service role key. If/when this goes remote (for Zoe), auth becomes a real concern.
- **Does not sync with Google Calendar.** That's still a web app feature (Phase 5). The MCP server reads what's in Supabase.
- **Does not modify the schema.** Zero database migrations. It reads and writes the same tables the web app uses.
- **Does not auto-create contacts.** If `log_event` can't match a name, it warns rather than creating. Contact creation should be intentional via `add_contact`.
