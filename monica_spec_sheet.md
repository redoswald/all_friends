# Monica Contact Page Specification

> A 1:1 spec based on Monica CRM's contact page architecture

## Architecture Overview

Monica uses a **Template → Page → Module** hierarchy:

| Level | Description |
|-------|-------------|
| **Template** | The overall layout assigned to a contact. Each contact gets one template. Users can create multiple templates (e.g., "Personal", "Professional") |
| **Page** | A tab within a template. Groups related modules together. Examples: "Contact Info", "Social", "Life Events" |
| **Module** | A discrete section of data. The atomic unit of information. Can be enabled/disabled per template |

This is fundamentally different from most CRMs—Monica lets users customize *which* data types appear for *which* contacts.

---

## Contact Header

Always visible at the top of the contact page regardless of active tab.

### Layout
```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌─────────┐                                                         │
│  │         │   [First Name] [Nickname] [Last Name]     ☆ (favorite)  │
│  │ AVATAR  │   [Pronouns] · [Age] · [Job Title @ Company]           │
│  │         │                                                         │
│  └─────────┘   [Tag] [Tag] [Tag]                      [Edit] [···]   │
│                                                                       │
│  Last activity: [date] · Last updated: [date]                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `first_name` | string | ✓ | Only required field |
| `last_name` | string | | |
| `nickname` | string | | Displayed in parentheses |
| `maiden_name` | string | | |
| `middle_name` | string | | |
| `suffix` | string | | Jr., III, PhD, etc. |
| `pronouns` | string | | He/Him, She/Her, They/Them, or custom |
| `gender` | string | | Custom genders supported (not limited to M/F) |
| `avatar` | image | | Upload or auto-generated initials |
| `is_favorite` | boolean | | Star toggle |
| `is_deceased` | boolean | | |
| `deceased_date` | date | | |
| `tags` | Tag[] | | User-defined labels (Monica calls these "labels") |

### Avatar Logic
1. If photo uploaded → show photo
2. Else → generate colored circle with initials
3. Color assigned randomly on contact creation, stored as `default_avatar_color`

---

## Module: Contact Information

Ways to reach this person.

### Contact Fields

Each contact can have multiple **contact fields** of various types:

| Field Type | Icon | Protocol | Notes |
|------------|------|----------|-------|
| Email | envelope | `mailto:` | Primary communication |
| Phone | phone | `tel:` | |
| Cell Phone | mobile | `tel:` | |
| Work Phone | building | `tel:` | |
| Fax | fax | `tel:` | |
| Pager | pager | | Legacy support |
| WhatsApp | whatsapp | `https://wa.me/` | |
| Telegram | telegram | `https://t.me/` | |
| Facebook | facebook | URL | |
| Twitter/X | twitter | URL | |
| LinkedIn | linkedin | URL | |
| Instagram | instagram | URL | |
| Website | globe | URL | Personal site |
| Other | link | | Custom type |

### Data Model

```typescript
interface ContactField {
  id: string;
  contact_id: string;
  contact_field_type_id: string;
  data: string;  // The actual value (phone number, email, etc.)
  created_at: datetime;
  updated_at: datetime;
}

interface ContactFieldType {
  id: string;
  name: string;
  fontawesome_icon: string;  // e.g., "fa fa-envelope-open-o"
  protocol: string | null;   // e.g., "mailto:", "tel:"
  delible: boolean;          // Can user delete this type?
  type: string;              // Internal identifier
}
```

### Custom Field Types
Users can create custom contact field types in Settings → Personalize → Contact field types.

---

## Module: Addresses

Physical locations associated with the contact.

### Data Model

```typescript
interface Address {
  id: string;
  contact_id: string;
  name: string;           // "Home", "Work", "Parents' house"
  street: string;
  city: string;
  province: string;       // State/region
  postal_code: string;
  country: string;        // ISO country code
  latitude: number;       // Auto-geocoded
  longitude: number;      // Auto-geocoded
  is_past_address: boolean;
  created_at: datetime;
  updated_at: datetime;
}
```

### Features
- **Geocoding**: Addresses are automatically geocoded to lat/long for weather display
- **Weather**: First address shows current weather conditions (via DarkSky/external API)
- **Multiple addresses**: Unlimited addresses per contact
- **Address history**: Mark addresses as "past" to track where someone used to live

---

## Module: Relationships

Connections between contacts.

### Relationship Categories

| Category | Relationship Types |
|----------|-------------------|
| **Love** | partner, spouse, date, lover, ex-boyfriend, ex-girlfriend, ex-husband, ex-wife |
| **Family** | parent, child, sibling, grandparent, grandchild, uncle, aunt, cousin, nephew, niece, in-law, godparent, godchild, stepparent, stepchild, stepsibling |
| **Friend** | best friend, friend, acquaintance |
| **Work** | colleague, boss, subordinate, mentor, mentee |

### Data Model

```typescript
interface Relationship {
  id: string;
  contact_is: string;        // "the father of"
  of_contact: string;        // Contact ID of related person
  relationship_type_id: string;
  created_at: datetime;
  updated_at: datetime;
}
```

### Features
- **Bidirectional relationships**: When you mark A as B's parent, B automatically becomes A's child
- **Linked contacts**: Related people can be full contacts (clickable) or "partial" contacts (just a name)
- **Custom relationship types**: Users can define custom types in Settings

---

## Module: Pets

Animals owned by the contact.

### Pet Categories (default)
- Dog, Cat, Bird, Fish, Hamster, Horse, Rabbit, Rat, Reptile, Small pet, Other

### Data Model

```typescript
interface Pet {
  id: string;
  contact_id: string;
  pet_category_id: string;
  name: string;
  created_at: datetime;
  updated_at: datetime;
}
```

---

## Module: Important Dates

Key dates to remember about this person.

### Date Types

| Type | Auto-reminder | Notes |
|------|---------------|-------|
| Birthday | ✓ | Most important date |
| Deceased date | | |
| First met | | |
| Custom | Optional | User-defined (anniversary, graduation, etc.) |

### Data Model

```typescript
interface Date {
  id: string;
  contact_id: string;
  name: string;              // "Birthday", "Wedding anniversary"
  date: date;
  is_birthdate_approximate: 'exact' | 'approximate' | 'unknown';
  add_reminder: boolean;
  created_at: datetime;
  updated_at: datetime;
}
```

### Approximate Dates
Monica supports dates where you don't know the exact value:
- **Exact**: Full date known (1985-03-15)
- **Approximate**: Only year known (1985)
- **Age-based**: "They're about 35" → calculates approximate year
- **Unknown**: No date information

---

## Module: Reminders

Scheduled notifications about this contact.

### Data Model

```typescript
interface Reminder {
  id: string;
  contact_id: string;
  title: string;
  description: string;
  frequency_type: 'one_time' | 'day' | 'week' | 'month' | 'year';
  frequency_number: number;  // Every N days/weeks/months/years
  initial_date: date;
  last_triggered_at: datetime;
  next_expected_date: date;
  created_at: datetime;
  updated_at: datetime;
}
```

### Notification Channels
- Email
- Telegram
- (Webhooks via API)

---

## Module: Notes

Freeform text notes about the contact.

### Data Model

```typescript
interface Note {
  id: string;
  contact_id: string;
  body: string;           // Markdown supported
  is_favorited: boolean;
  created_at: datetime;
  updated_at: datetime;
}
```

### Features
- Markdown formatting supported
- Can be favorited/pinned
- Displayed in reverse chronological order

---

## Module: Activities

Interactions and time spent with this contact.

### Data Model

```typescript
interface Activity {
  id: string;
  summary: string;
  description: string;
  happened_at: date;
  activity_type_id: string;
  created_at: datetime;
  updated_at: datetime;
}

interface ActivityType {
  id: string;
  name: string;                    // "Went to restaurant"
  activity_type_category_id: string;
}

interface ActivityTypeCategory {
  id: string;
  name: string;  // "Food", "Sports", "Culture", etc.
}
```

### Default Activity Type Categories
- Simple activities
- Sport
- Food
- Cultural activities

### Features
- **Multiple contacts**: An activity can include multiple people (dinner with 3 friends)
- **Custom activity types**: Users can define their own types
- **Activity reports**: Dashboard showing activity frequency with each contact

---

## Module: Conversations

Logged conversations from various channels.

### Data Model

```typescript
interface Conversation {
  id: string;
  contact_id: string;
  happened_at: datetime;
  contact_field_type_id: string;  // WhatsApp, Email, SMS, etc.
  created_at: datetime;
  updated_at: datetime;
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  written_by_me: boolean;
  written_at: datetime;
}
```

### UI Pattern
Chat-bubble interface mimicking messaging apps:
- Your messages on right (or marked differently)
- Their messages on left
- Timestamps visible

---

## Module: Life Events

Significant occurrences in the contact's life.

### Life Event Categories

| Category | Example Events |
|----------|---------------|
| **Work & Education** | New job, Retirement, Graduation, Started school |
| **Family & Relationships** | Engagement, Marriage, New baby, Divorce, New relationship |
| **Home & Living** | Moved, New home, Bought house, Renovation |
| **Health & Wellness** | Surgery, Recovery, Diagnosis, Fitness milestone |
| **Travel & Experiences** | Trip, First time doing X, Achievement |

Monica provides 45+ predefined life event types.

### Data Model

```typescript
interface LifeEvent {
  id: string;
  contact_id: string;
  life_event_type_id: string;
  summary: string;
  description: string;
  happened_at: date;
  happened_at_month_unknown: boolean;
  happened_at_day_unknown: boolean;
  add_reminder: boolean;
  created_at: datetime;
  updated_at: datetime;
}
```

### Features
- **Partial dates**: Can log events without knowing exact month/day
- **Timeline view**: Chronological display of all life events
- **Yearly reminders**: Option to be reminded on anniversary

---

## Module: Documents & Photos

File attachments for the contact.

### Data Model

```typescript
interface Document {
  id: string;
  contact_id: string;
  original_filename: string;
  new_filename: string;
  mime_type: string;
  size: number;           // bytes
  created_at: datetime;
  updated_at: datetime;
}
```

### Features
- **Storage limit**: Configurable per account (512MB default on hosted version)
- **Photo gallery**: Images displayed in grid view
- **Avatar from photos**: Can set any photo as contact avatar

---

## Module: Gifts

Gift ideas and tracking.

### Data Model

```typescript
interface Gift {
  id: string;
  contact_id: string;
  name: string;
  comment: string;
  url: string;            // Link to buy
  amount: number;
  status: 'idea' | 'offered' | 'received';
  date: date;
  created_at: datetime;
  updated_at: datetime;
}
```

### Features
- **Gift ideas**: Track ideas before purchasing
- **Gift history**: Log gifts given/received
- **Price tracking**: Optional amount field
- **Links**: Direct URL to product page

---

## Module: Debts

Money owed to or by the contact.

### Data Model

```typescript
interface Debt {
  id: string;
  contact_id: string;
  in_debt: 'yes' | 'no';  // yes = they owe me, no = I owe them
  amount: number;
  currency_id: string;
  reason: string;
  status: 'pending' | 'complete';
  created_at: datetime;
  updated_at: datetime;
}
```

---

## Module: Tasks

Contact-specific to-do items.

### Data Model

```typescript
interface Task {
  id: string;
  contact_id: string;
  title: string;
  description: string;
  completed: boolean;
  completed_at: datetime;
  created_at: datetime;
  updated_at: datetime;
}
```

---

## Module: How We Met

Context about the relationship's origin.

### Data Model

```typescript
interface HowWeMet {
  contact_id: string;
  general_information: string;  // Freeform description
  first_met_date: date;
  first_met_through_contact_id: string;  // Introduced by another contact
  is_first_met_date_approximate: boolean;
  first_met_additional_info: string;
  created_at: datetime;
  updated_at: datetime;
}
```

### Features
- **Referral tracking**: Link to the person who introduced you
- **Location**: Where you met
- **Context**: Circumstances of meeting

---

## Module: Work Information

Professional details.

### Data Model

```typescript
interface WorkInformation {
  contact_id: string;
  job_title: string;
  company: string;
  // Work history tracked via Life Events
}
```

---

## Page/Tab Structure (Default Template)

Monica's default template organizes modules into these pages:

| Page (Tab) | Modules |
|------------|---------|
| **Overview** | Contact Info, Addresses, Important Dates, Relationships, How We Met, Work Info |
| **Life** | Life Events (timeline), Notes |
| **Activities** | Activities, Conversations |
| **Reminders** | Reminders |
| **Gifts** | Gifts |
| **Tasks** | Tasks |
| **Files** | Documents, Photos |

---

## API Patterns

### Contact Object (full)

```json
{
  "id": 8,
  "object": "contact",
  "first_name": "Jim",
  "last_name": "Halpert",
  "nickname": "Jimothy",
  "gender": "male",
  "is_partial": false,
  "is_dead": false,
  "deceased_date": null,
  "last_called": null,
  "last_activity_together": "2019-02-01",
  "stay_in_touch_frequency": 30,
  "stay_in_touch_trigger_date": "2019-03-01",
  "information": {
    "relationships": {
      "love": {...},
      "family": {...},
      "friend": {...},
      "work": {...}
    },
    "dates": [
      {
        "name": "birthdate",
        "is_birthdate_approximate": "exact",
        "birthdate": "1978-10-01T00:00:00Z"
      }
    ],
    "career": {
      "job": "Sales Representative",
      "company": "Dunder Mifflin"
    },
    "avatar": {
      "url": "https://...",
      "source": "upload",
      "default_avatar_color": "#FF5722"
    },
    "food_preferences": null,
    "how_you_met": {...}
  },
  "addresses": [...],
  "tags": [...],
  "statistics": {
    "number_of_calls": 5,
    "number_of_notes": 12,
    "number_of_activities": 8,
    "number_of_reminders": 3,
    "number_of_tasks": 2,
    "number_of_gifts": 4,
    "number_of_debts": 0
  },
  "account": { "id": 1 },
  "created_at": "2017-10-07T09:00:00Z",
  "updated_at": "2019-02-01T12:00:00Z"
}
```

---

## Key Differentiators from Your Current PRM

Based on the screenshots you shared:

| Your PRM | Monica | Notes |
|----------|--------|-------|
| Stage (Acquaintance, Developing, Close) | No explicit stages | Monica uses "stay in touch" cadence instead |
| Cadence (21 days, 60 days) | `stay_in_touch_frequency` | Same concept, different name |
| Tags | Labels | Identical feature |
| Events with participants | Activities with multiple contacts | Similar, Monica separates "Activities" from "Conversations" |
| Due dates on dashboard | Reminders + "stay in touch" triggers | Monica's system is reminder-centric |
| — | Life Events | You could add this—it's a major Monica feature |
| — | Gifts module | Nice-to-have for personal relationships |
| — | Debts module | Track who owes who money |
| — | Template customization | Let users choose which modules appear |

---

## Implementation Recommendations

If you want to match Monica's depth:

1. **Add Life Events**: This is Monica's signature feature. 45+ event types with partial date support.

2. **Conversation logging**: Separate from Events. Chat-style interface for logged conversations.

3. **Template system**: Let users customize which sections appear per contact or contact type.

4. **"How we met" data**: Referral tracking is surprisingly useful for a PRM.

5. **Gift tracking**: Simple but high-value for personal relationships.

6. **Approximate dates**: Support "~1985" or "about 35 years old" for dates you don't know exactly.

7. **Contact field types**: Make email/phone/social extensible so users can add their own.
