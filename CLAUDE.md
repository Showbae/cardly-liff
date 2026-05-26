# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # Dev server at http://localhost:3000
npm run build    # Production build → /build
npm test         # Run tests (watch mode)
npm test -- --watchAll=false  # Run tests once (CI mode)
npm test -- --testPathPattern=App  # Run a single test file
```

## Environment Variables

Create a `.env.local` file with:
```
REACT_APP_SUPABASE_URL=<your-supabase-project-url>
REACT_APP_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

## Architecture

This is a **LINE LIFF** (LINE Front-end Framework) app built with React + TypeScript + Supabase. It runs inside the LINE app as a mini web app.

**Authentication flow:**
1. LIFF SDK initializes and provides the LINE user profile
2. `signInWithLine()` in `src/lib/auth.ts` looks up the user in Supabase by `line_id`
3. If not found, it upserts a new row into the `users` table (`line_id`, `display_name`, `picture_url`)
4. Returns the Supabase user record which the app uses for state

**Key files:**
- `src/App.tsx` — Entry component; currently uses a **mock LINE profile** (hardcoded) instead of calling `liff.getProfile()`. Swap this for real LIFF initialization before deploying.
- `src/lib/supabase.ts` — Creates and exports the Supabase client using `REACT_APP_SUPABASE_*` env vars.
- `src/lib/auth.ts` — `signInWithLine(profile: LineProfile)` function; owns all Supabase user logic.

**Supabase `users` table schema** (inferred from code):
| column | type | notes |
|---|---|---|
| `id` | uuid | primary key |
| `line_id` | text | unique, used as conflict target in upsert |
| `display_name` | text | |
| `picture_url` | text | |
| `created_date` | timestamp | |

## Notes

- `supabase.ts` currently logs the URL and anon key to the console — remove before production.
- `App.tsx` imports `liff` but the real `liff.init()` / `liff.getProfile()` calls are not yet wired up; the mock profile bypasses LIFF entirely for local development.
