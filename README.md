# All Friends

A personal relationship manager (PRM) that helps you nurture meaningful relationships with intention. Track interactions, set cadence-based reminders, log events, and organize your relationships at different investment levels.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19 and TypeScript
- **Database:** PostgreSQL (Supabase) with Prisma ORM
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Styling:** Tailwind CSS 4 + shadcn/ui + Radix UI primitives
- **Notifications:** Sonner toasts
- **Validation:** Zod
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (for PostgreSQL + Auth)

### Setup

1. Clone the repo and install dependencies:

   ```bash
   git clone <repo-url>
   cd All_Friends
   npm install
   ```

2. Create a `.env.local` file in the project root:

   ```env
   # Supabase PostgreSQL
   DATABASE_URL="postgresql://..."       # Pooled connection string
   DIRECT_URL="postgresql://..."         # Direct connection (for migrations)

   # Supabase Auth
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="ey..."

   # OAuth callback base URL
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   ```

3. Run database migrations:

   ```bash
   npx prisma migrate dev
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Supabase Auth Setup

To enable Google OAuth, configure the Google provider in your Supabase dashboard under **Authentication > Providers**. Set the redirect URL to `{NEXT_PUBLIC_SITE_URL}/auth/callback`.

## Scripts

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Start development server                 |
| `npm run build`    | Generate Prisma client + build for prod  |
| `npm run start`    | Start production server                  |
| `npm run lint`     | Run ESLint                               |

## Project Structure

```
app/
  (public)/           Landing page (unauthenticated)
  (auth)/             Login & signup pages
  (app)/              Protected routes (require auth)
    dashboard/        Stats, overdue contacts, insights
    contacts/         Contact list + [id] detail pages
    events/           Event logging and history
    calendar/         Calendar view
  api/                RESTful API routes
    contacts/         CRUD, bulk operations, sub-resources
    events/           Event CRUD
    tags/             Tag CRUD
    dashboard/        Dashboard aggregation
  auth/callback/      OAuth callback handler

components/
  ui/                 shadcn/ui base components
  contacts/           Contact management components
  events/             Event logging components
  calendar/           Calendar view components
  dashboard/          Dashboard widgets
  tags/               Tag management
  command-palette.tsx Cmd+K quick search
  nav.tsx             App navigation bar

lib/
  auth.ts             Server actions (signIn, signUp, signOut, etc.)
  cadence.ts          Contact status & cadence calculations
  validations.ts      Zod schemas
  db.ts               Prisma client singleton
  supabase/           Supabase client (browser, server, middleware)

types/                Shared TypeScript enums & interfaces
prisma/               Schema & migrations
```

## Key Concepts

- **Cadence:** Each contact can have a target frequency (e.g., every 14 days). The app calculates whether you're due, due soon, or overdue based on your last logged interaction.
- **Funnel stages:** Contacts progress through stages: Prospect, Acquaintance, Developing, Established, Close, or Dormant.
- **Events:** Log interactions (hangouts, calls, messages, etc.) linked to one or more contacts.
- **Snooze & OOO:** Temporarily pause reminders for a contact, or mark them as away for a date range.

## Deployment

Deployed on [Vercel](https://vercel.com). The build step runs `prisma generate` before `next build`. Set all environment variables in Vercel's project settings.
