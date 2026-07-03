# Cardly LIFF

Cardly is a LINE-integrated web app that helps Thai users pick the best credit card to swipe at any merchant — "Google Maps for credit cards." Built as a LIFF (LINE Front-end Framework) app with a Next.js backend and Supabase/PostgreSQL database.

> For product vision, customer segments, and the feature backlog, see [`docs/product-strategy.md`](./docs/product-strategy.md).
> For codebase conventions, see [`CLAUDE.md`](./CLAUDE.md).

## Tech Stack

- **Frontend**: Next.js (App Router, TypeScript), Tailwind CSS
- **LINE Integration**: LIFF SDK (`@line/liff`)
- **Backend**: Next.js API Routes (serverless)
- **ORM**: Prisma, with `@prisma/adapter-pg` against Supabase Postgres
- **Database**: Supabase (PostgreSQL)
- **Validation**: Zod
- **Hosting**: Vercel

## Project Structure

```
app/
├── (liff)/            # LIFF frontend routes (wallet, promo, me)
└── api/                # Serverless API routes (auth/line, cards, banks)
components/
lib/                    # Prisma client, Supabase clients, LIFF helpers
prisma/
├── schema.prisma
docs/
├── product-strategy.md  # Product vision, segments, backlog, roadmap
└── design/               # Hi-fi design handoff docs
```

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (for `DATABASE_URL` / `DIRECT_URL`)
- A LINE LIFF app (for `NEXT_PUBLIC_LIFF_ID` and channel credentials)

### Setup

```bash
npm install
```

Create a `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (Prisma)
DATABASE_URL=          # Supabase pooler URL (port 6543)
DIRECT_URL=             # Supabase direct URL (port 5432), used for migrations

# LINE / LIFF
NEXT_PUBLIC_LIFF_ID=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

Then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

To test the LIFF app inside the LINE client, use the ngrok-tunneled dev server instead:

```bash
npm run dev:tunnel
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run dev:tunnel` | Dev server + ngrok tunnel (for testing inside LINE) |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type check |

## Database (Prisma)

```bash
npx prisma generate            # regenerate the Prisma client (also runs on postinstall)
npx prisma migrate dev --name <name>   # create/apply a migration in development
npx prisma migrate deploy      # apply migrations in production
npx prisma studio              # open the Prisma Studio GUI
```

## Deployment

Hosted on Vercel:
- `main` branch → Production
- `develop` branch → Preview

Environment variables are set in the Vercel dashboard, not committed to the repo. Run `npx prisma migrate deploy` as part of the deploy pipeline before the app serves traffic on a new schema.
