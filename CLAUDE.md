# CLAUDE.md

Project instructions for AI-assisted development on All Friends.

## What This Is

All Friends is a personal relationship manager (PRM). Users track contacts, log interactions, set cadence-based reminders, and organize relationships by funnel stage. Think of it as a CRM but for your personal life.

## Commands

- `npm run dev` — start the dev server (Next.js 16, port 3000)
- `npm run build` — `prisma generate && next build`
- `npm run lint` — ESLint
- `npx prisma migrate dev` — run database migrations
- `npx prisma studio` — browse the database

## Architecture

- **Next.js 16 App Router** with React 19 and TypeScript (strict mode)
- **PostgreSQL** on Supabase, accessed via **Prisma** ORM (`lib/db.ts`)
- **Supabase Auth** for authentication (email/password + Google OAuth)
- **Tailwind CSS 4** + **shadcn/ui** components (in `components/ui/`)
- **Zod** for input validation (`lib/validations.ts`)

### Route Groups

- `app/(public)/` — landing page, no auth required
- `app/(auth)/` — login and signup pages
- `app/(app)/` — all protected routes (dashboard, contacts, events, calendar)
- `app/api/` — RESTful API routes (contacts, events, tags, dashboard)
- `app/auth/callback/` — OAuth callback handler

### Auth Flow

- Server actions in `lib/auth.ts`: `signUp`, `signIn`, `signInWithGoogle`, `signOut`, `getUser`, `requireUser`
- Supabase clients in `lib/supabase/` (separate browser and server clients)
- `middleware.ts` protects routes — redirects unauthenticated users to `/login`, authenticated users away from auth pages
- API routes handle their own auth (not covered by middleware)

### Key Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | Auth server actions |
| `lib/cadence.ts` | Contact status calculation (due, overdue, ok) |
| `lib/validations.ts` | Zod schemas for all models |
| `lib/db.ts` | Prisma client singleton |
| `types/index.ts` | Shared enums: `FunnelStage`, `EventType`, field types |
| `prisma/schema.prisma` | Database schema (all models) |
| `middleware.ts` | Route protection + session refresh |
| `components/command-palette.tsx` | Cmd+K search |

### Database Models

Core models in `prisma/schema.prisma`:

- **User** — linked to Supabase via `supabaseId`
- **Contact** — name, cadenceDays, funnelStage, snoozedUntil, awayUntil
- **Event** — date, eventType (HANGOUT/CALL/MESSAGE/EVENT/OTHER), linked to contacts via EventContact join table
- **Tag** — user-scoped, unique by `[userId, name]`
- **ContactField** — structured contact info (email, phone, social, custom)
- **ImportantDate** — birthdays, anniversaries (day/month/year, year optional)
- **ContactRelationship** — bidirectional links between contacts (spouse, sibling, etc.)
- **ContactOOOPeriod** — out-of-office date ranges
- **ActionItem** — todos attached to events

All user-owned models cascade delete from User. All contact-owned models cascade from Contact.

## Conventions

- **Import alias:** `@/*` maps to the project root (e.g., `@/lib/auth`, `@/components/ui/button`)
- **Server components by default.** Only add `"use client"` when the component needs interactivity.
- **shadcn/ui** for all base UI components — add new ones with `npx shadcn@latest add <component>`
- **API routes** are RESTful, in `app/api/`. Each returns JSON with appropriate status codes.
- **Validation:** use Zod schemas from `lib/validations.ts` for all user input
- **Toasts:** use Sonner (`sonner`) for user-facing notifications
- **Icons:** use Lucide React (`lucide-react`)
- **Dates:** use `date-fns` for formatting and manipulation

## Style & Theme

- **Brand colors:** coral (#D14545 primary) and teal (#2CA59D primary), defined as CSS custom properties in `app/globals.css`
- **Font:** DM Sans (primary), Geist Mono (monospace)
- **Border radius:** 0.75rem default
- **Dark mode** is supported via CSS variables and the `.dark` class (next-themes)

## Environment Variables

Required in `.env.local`:

```
DATABASE_URL          # Supabase PostgreSQL pooled connection
DIRECT_URL            # Supabase PostgreSQL direct connection (migrations)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL  # Base URL for OAuth callbacks (http://localhost:3000 in dev)
```
