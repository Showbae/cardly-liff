# CLAUDE.md

This file provides guidance to Claude Code when working with this project.

---

## 📚 Product Documentation

> **อ่านไฟล์นี้ก่อนทุกครั้งที่มีคำถามเกี่ยวกับ product, feature, segment, หรือ roadmap:**
> **`docs/product-strategy.md`** — Product Vision, Customer Segments (7 กลุ่ม), Master Backlog (22 features, 337 SP), และ Roadmap แบ่งเป็น 5 Phase

---

## Project Overview

A LINE-integrated web application built with Next.js, featuring a LIFF frontend, serverless API backend on Vercel, and Supabase as the primary database.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS v3
- **UI Components**: shadcn/ui
- **State Management**: TanStack Query (server state) + Zustand (client state)
- **LINE Integration**: LIFF SDK (`@line/liff`)

### Backend
- **API**: Next.js API Routes (Serverless Functions on Vercel)
- **ORM**: Prisma
- **Auth**: Supabase Auth + LINE Login via LIFF
- **Validation**: Zod

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage

### Admin Portal
- **Framework**: Next.js (same monorepo, route group `/admin`)
- **UI**: shadcn/ui + Tailwind CSS

---

## Project Structure

```
.
├── app/
│   ├── (liff)/                  # LIFF frontend routes (LINE users)
│   │   ├── layout.tsx           # LIFF provider wrapper
│   │   └── page.tsx
│   ├── (admin)/                 # Admin portal routes
│   │   ├── layout.tsx           # Admin auth guard
│   │   └── dashboard/
│   │       └── page.tsx
│   └── api/                     # Serverless API routes
│       ├── auth/
│       │   └── [...]/route.ts
│       └── [...]/route.ts
├── components/
│   ├── ui/                      # shadcn/ui base components
│   ├── liff/                    # LIFF-specific components
│   └── admin/                   # Admin-specific components
├── lib/
│   ├── prisma.ts                # Prisma client singleton
│   ├── supabase/
│   │   ├── client.ts            # Supabase browser client
│   │   └── server.ts            # Supabase server client
│   ├── liff.ts                  # LIFF initialization helper
│   └── validations/             # Zod schemas
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── hooks/                       # Custom React hooks
├── stores/                      # Zustand stores
├── types/                       # Global TypeScript types
├── middleware.ts                 # Auth middleware
└── .env.local
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (Prisma)
DATABASE_URL=                    # Supabase pooler URL (pgBouncer)
DIRECT_URL=                      # Supabase direct URL (for migrations)

# LINE / LIFF
NEXT_PUBLIC_LIFF_ID=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

> **Note**: Never commit `.env.local` to version control. All `NEXT_PUBLIC_` variables are exposed to the browser.

---

## Database & ORM

### Prisma Setup
- Use `DATABASE_URL` with Supabase connection pooler (port `6543`) for runtime queries
- Use `DIRECT_URL` with direct connection (port `5432`) for `prisma migrate`
- Always run `npx prisma generate` after schema changes
- Migration commands:
  ```bash
  npx prisma migrate dev --name <migration-name>   # development
  npx prisma migrate deploy                         # production
  npx prisma studio                                 # GUI
  ```

### Prisma Client Singleton (`lib/prisma.ts`)
```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Schema Conventions
- Use `snake_case` for database columns (`@@map`, `@map`)
- Use `camelCase` for Prisma model fields
- Always include `createdAt` and `updatedAt` on every model
- Use UUIDs as primary keys (`@default(uuid())`)

---

## API Routes

### Route Handler Pattern (`app/api/*/route.ts`)
```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const bodySchema = z.object({
  name: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = bodySchema.parse(body)
    // ... logic
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

### Auth Middleware (`middleware.ts`)
- Protect `/admin/*` routes — check Supabase session
- Allow all `/(liff)/*` routes (auth handled client-side via LIFF)
- Protect `/api/*` routes with bearer token or session validation as needed

---

## LIFF Integration

### Initialization (`lib/liff.ts`)
```ts
import liff from '@line/liff'

export const initLiff = async () => {
  if (typeof window === 'undefined') return
  await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
}

export const getLiffProfile = async () => {
  if (!liff.isLoggedIn()) liff.login()
  return liff.getProfile()
}
```

### LIFF Rules
- Always check `liff.isInClient()` before using LINE-specific features (e.g., `liff.closeWindow()`)
- Initialize LIFF in a top-level Client Component, not inside Server Components
- Handle the case where LIFF is not ready yet (loading state)
- Use `liff.getIDToken()` to pass LINE identity to your backend for verification

---

## Styling

### Tailwind CSS
- Use Tailwind utility classes as the primary styling method
- Extend theme in `tailwind.config.ts` for project-specific tokens (colors, fonts, etc.)
- Use `cn()` helper (from `lib/utils.ts`) to merge class names conditionally

### shadcn/ui
- Install components via CLI: `npx shadcn@latest add <component>`
- Do **not** modify files inside `components/ui/` directly — extend via wrapper components
- Use shadcn/ui primitives (`Button`, `Input`, `Dialog`, etc.) for all admin portal UI

### Conventions
- Mobile-first responsive design
- Use CSS variables defined in `globals.css` for theme colors
- Dark mode support via `class` strategy in Tailwind config

---

## State Management

### TanStack Query (server/async state)
- Use for all API data fetching, caching, and mutations
- Define query keys as constants in `lib/queryKeys.ts`
- Use `useSuspenseQuery` where possible for cleaner loading states

### Zustand (client/UI state)
- Use for global UI state (modals, sidebar, user preferences)
- Keep stores small and focused
- Define stores in `stores/` directory

---

## Code Conventions

### TypeScript
- Strict mode enabled (`"strict": true` in `tsconfig.json`)
- No `any` types — use `unknown` and type guards instead
- Export types from `types/index.ts`
- Use Zod schemas as the single source of truth for validation and type inference

### Components
- Server Components by default; add `'use client'` only when needed
- Keep Client Components small and push them to the leaves of the component tree
- Co-locate component-specific types and hooks within the component file if small

### Naming
- Components: `PascalCase` (`UserCard.tsx`)
- Hooks: `camelCase` starting with `use` (`useUserProfile.ts`)
- API routes: kebab-case directories (`app/api/user-profile/route.ts`)
- Utilities: `camelCase` (`formatDate.ts`)

### Imports
- Use `@/` path alias for all internal imports
- Group imports: external packages → internal modules → types → styles

---

## Testing

- **Unit**: Vitest for utility functions and hooks
- **Integration**: Vitest + React Testing Library for components
- **E2E**: Playwright (optional, for critical user flows)
- Test files: co-located as `*.test.ts` or `*.spec.ts`

---

## Deployment

### Vercel
- `main` branch → Production
- `develop` branch → Preview deployment
- Set all environment variables in Vercel dashboard (not in repo)
- Serverless function timeout: default 10s (upgrade plan for longer)

### Database Migrations
- Run `npx prisma migrate deploy` as part of the build step or a separate CI job before deployment
- Never run `migrate dev` in production

---

## Common Commands

```bash
# Development
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Prisma
npx prisma generate
npx prisma migrate dev --name <name>
npx prisma studio

# shadcn/ui
npx shadcn@latest add <component>

# Build
npm run build
```

---

## Important Notes

1. **Serverless Limits**: Vercel Serverless Functions have a 10s timeout on Hobby plan. Avoid long-running operations in API routes; use background jobs or webhooks instead.
2. **Prisma + Serverless**: Always use the Prisma singleton pattern to avoid exhausting database connections on Vercel.
3. **LIFF + SSR**: LIFF SDK is browser-only. Never call LIFF methods in Server Components or during SSR.
4. **Supabase RLS**: Enable Row Level Security (RLS) on all Supabase tables. Use `SUPABASE_SERVICE_ROLE_KEY` only in server-side code and never expose it to the client.
5. **Supabase Auth vs LINE Auth**: Use Supabase Auth for admin portal users. For LINE users, verify the LIFF ID token server-side via LINE API and manage sessions independently or link to a Supabase user.
