---
name: line-supabase-security
description: Cardly-specific security rules for LINE identity, Supabase, and session handling. Apply automatically whenever writing or reviewing code that touches authentication, LINE login, session tokens, Supabase access, RLS, or credit-card/user data.
user-invocable: false
---

# LINE + Supabase Security (Cardly)

Background security knowledge to apply whenever code touches auth, LINE
identity, sessions, Supabase, or user/card data. These are Cardly-specific and
go beyond generic code review.

## 1. LINE identity — never trust a raw userId

- Any endpoint that receives a `userId` / `line_id` MUST verify a LINE **ID
  token** server-side (via LINE's API) before trusting the caller. Do not
  upsert or authorize based on a `userId` taken straight from the request body.
- The client sends identity with `liff.getIDToken()`; the server verifies it.
- ⚠️ Known gap: `app/api/auth/line/route.ts` currently reads `userId` from the
  body and upserts directly — flag this whenever touching that path.

## 2. Sessions

- Session `token` must be cryptographically random and unique.
- Always set and check `expires_at`; reject expired sessions on every use.
- Look up sessions by token, scope every query to the session's own `user_id`.

## 3. Supabase

- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never import it into client code
  or expose it via a `NEXT_PUBLIC_` variable.
- Row Level Security (RLS) must be enabled on every table (the schema already
  marks tables as RLS-managed — keep new tables consistent).
- Use the service role only in server-side code, and only when RLS genuinely
  needs bypassing.

## 4. Authorization

- A user may read/write only their own `users_card`, `sessions`, and profile.
  Always check ownership (`user_id` matches the authenticated session) before
  returning or mutating rows.

## 5. Input & logging

- Validate every request body/param with a Zod schema before it reaches the DB.
- Never log sensitive data: ID tokens, session tokens, PII, or card details.

## When reviewing

Report issues by severity (Critical / High / Medium), cite `file:line`, and
give a concrete fix. Prevent these at write-time rather than only catching them
in review.
