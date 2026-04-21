# AskScout Fix Plan

Prepared: April 13, 2026

## Scope

This document only covers the issues found in the audit. It is intentionally focused on fixing the current gaps without changing core product behavior, deployment flow, or UX.

## Platform Goals This Plan Preserves

- Keep GitHub sign-in simple.
- Keep GitHub -> Vercel auto-deploy intact.
- Keep Supabase as the persistence layer.
- Keep the current digest, standup, plan, and AI context experience working.
- Improve trust, safety, and production reliability without adding unnecessary product scope.

## Non-Negotiable Rules

- No user-facing feature regressions.
- No changes to digest output format unless required for a bug fix.
- No new GitHub scopes.
- No secrets in the client.
- Every fix ships with validation steps.

## Priority Order

1. Remove the GitHub token from the client session.
2. Fix user identity and route protection.
3. Restore deploy safety by fixing lint and enforcing quality gates.
4. Replace the in-memory rate limiter with a production-safe approach.
5. Add tests around the risky paths.
6. Clean up env/docs drift.
7. Reduce code drift between shared and web summarization paths.

---

## 1. Keep GitHub Tokens Server-Only

### Problem

The GitHub access token is attached to the session object in `apps/web/src/auth.config.ts`, while the app uses `SessionProvider` in `apps/web/src/app/layout.tsx` and `useSession()` in client components. That makes the provider token browser-accessible.

### Fix

- Stop attaching `accessToken` to the client session payload.
- Keep the token only in the server-side JWT/session path used by `auth()` inside route handlers and server components.
- Verify that client components only receive non-sensitive user profile fields.

### Files To Touch

- `apps/web/src/auth.config.ts`
- `apps/web/src/auth.ts`
- `apps/web/src/types/next-auth.d.ts`
- `apps/web/src/app/layout.tsx`
- any client component assuming `session.accessToken` exists

### No-Breakage Strategy

- Do not change API route signatures.
- Keep repo loading and digest generation using server-side `auth()`.
- Verify sign-in, repo fetch, digest generation, sign-out, and avatar display before merge.

### Acceptance Criteria

- `useSession()` on the client never includes the GitHub provider token.
- Server routes still have access to the token they need.

---

## 2. Fix Identity And Route Protection

### Problem

- Protected route logic only blocks `/dashboard`, not `/settings`.
- Several routes fall back to `session.user?.id ?? session.user?.email ?? "unknown"`, which risks cross-user collisions.

### Fix

- Update auth protection so both `/dashboard` and `/settings` are consistently protected.
- Create a stable internal user id in the auth token/session pipeline.
- Remove `"unknown"` as an allowed persistence identity for user-owned data.
- Fail safely if identity data is missing instead of silently writing shared records.

### Files To Touch

- `apps/web/src/auth.config.ts`
- `apps/web/src/middleware.ts`
- `apps/web/src/app/api/digest/stream/route.ts`
- `apps/web/src/app/api/settings/route.ts`
- `apps/web/src/app/api/account/route.ts`
- `apps/web/src/app/api/history/route.ts`
- `apps/web/src/app/api/digest/today/route.ts`
- `apps/web/src/lib/supabase.ts`

### No-Breakage Strategy

- Preserve current GitHub sign-in UX.
- Keep all stored data keyed to the same user after migration logic is introduced.
- If any legacy records exist under weak ids, add a controlled migration or explicit fallback handling before removal.

### Acceptance Criteria

- Unauthenticated users cannot reach `/dashboard` or `/settings`.
- No writes occur under `"unknown"`.
- A single user always maps to a single stable storage identity.

---

## 3. Restore Safe Deploy Gates

### Problem

- `apps/web/next.config.ts` ignores lint errors during builds.
- `pnpm lint` currently fails.
- `pnpm test` passes only because there are no test files.

### Fix

- Fix the existing ESLint failures, starting with `apps/web/src/components/DigestView.tsx`.
- Add the missing React Hooks lint support or remove invalid rule usage.
- Remove `ignoreDuringBuilds` after lint is green.
- Keep CI as the gate that must pass before production deploys.

### Files To Touch

- `apps/web/next.config.ts`
- `eslint.config.mjs`
- `apps/web/src/components/DigestView.tsx`
- any additional files needed to clear the current lint failures

### No-Breakage Strategy

- Treat this as a behavior-preserving cleanup.
- Do not refactor unrelated UI while fixing lint.
- Re-run build, typecheck, lint, and smoke tests before merge.

### Acceptance Criteria

- `pnpm build` passes.
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- Production builds no longer skip lint.

---

## 4. Replace The In-Memory Rate Limiter

### Problem

The current limiter uses a local `Map` in `apps/web/src/lib/rate-limit.ts`. That is not reliable across Vercel instances, cold starts, or concurrent execution.

### Fix

- Replace the in-memory limiter with shared storage suitable for Vercel deployment.
- Key limits by stable internal user id, not by the last characters of the GitHub token.
- Keep the current user-visible limits unless product wants to change them.
- Add structured logging around limit hits and upstream failures.

### Files To Touch

- `apps/web/src/lib/rate-limit.ts`
- `apps/web/src/app/api/digest/stream/route.ts`
- `apps/web/src/app/api/repos/route.ts`
- related env/config docs if a shared backing service is introduced

### No-Breakage Strategy

- Preserve current limit values initially.
- Roll out with logging first if possible, then enforce once verified.
- Keep response format and headers compatible with the current client behavior.

### Acceptance Criteria

- Limits work consistently across multiple requests and deployments.
- Limits do not depend on provider token fragments.

---

## 5. Add Tests For The Risky Paths

### Problem

The project currently has no test files, so the most fragile auth and persistence behavior is unprotected.

### Fix

- Add targeted tests for the exact risky areas:
  - session shaping keeps secrets off the client
  - protected routes reject unauthenticated access
  - stable user identity is required for writes
  - digest route handles no-commit, upstream failure, and success paths safely
  - section parsing still works for stored digest content
- Prefer small, fast tests over a giant framework rollout.

### Files To Add

- tests near the auth config and API routes
- parser tests for `apps/web/src/lib/parse-sections.ts`
- component or utility tests only where they protect real behavior

### No-Breakage Strategy

- Write tests around current expected behavior before larger refactors.
- Keep the first pass narrow and high-value.

### Acceptance Criteria

- The highest-risk paths have automated coverage.
- `pnpm test` passing means something real.

---

## 6. Fix Environment And Documentation Drift

### Problem

The app uses Supabase, but `.env.example` and repo docs still reference Firebase in places. That creates setup mistakes and bad deploy assumptions.

### Fix

- Update `apps/web/.env.example` to reflect the current Supabase-based architecture.
- Remove stale Firebase references from repo documentation.
- Document the required local, preview, and production environment variables.
- Add a short secret rotation checklist for GitHub OAuth, Supabase, and model provider keys.

### Files To Touch

- `apps/web/.env.example`
- `CLAUDE.md`
- any root docs that describe setup or deployment

### No-Breakage Strategy

- Docs-only change, but verify against actual Vercel config before merge.

### Acceptance Criteria

- A developer can set up the app from docs without guessing.
- The docs match the running architecture.

---

## 7. Reduce Drift Between Core And Web AI Paths

### Problem

There is duplicated summarization logic between `packages/core` and the web digest streaming route. That is not the biggest security issue today, but it will keep causing inconsistent behavior and harder maintenance.

### Fix

- Decide which logic belongs in shared core and which belongs only in the web app.
- Move common prompt, model selection, and parsing logic behind one maintained abstraction where practical.
- Keep streaming-specific transport code in the web app if needed, but reduce duplicate business logic.

### Files To Review

- `packages/core/src/summarize.ts`
- `apps/web/src/app/api/digest/stream/route.ts`
- `packages/core/src/types.ts`

### No-Breakage Strategy

- Do this after the auth, identity, lint, and rate-limit fixes.
- Use parser and output tests so the digest format does not drift.

### Acceptance Criteria

- Shared behavior is defined in one place where possible.
- Future changes to prompts and output structure require fewer duplicate edits.

---

## Recommended Execution Sequence

### Wave 1

- Fix token exposure
- fix stable identity
- fix `/settings` protection

### Wave 2

- Fix lint failures
- remove lint bypass in build
- add the first auth and route tests

### Wave 3

- Replace rate limiting
- add digest-route and parser tests

### Wave 4

- Clean env/docs drift
- reduce core/web duplication

This order addresses the highest-risk gaps first while keeping the surface area of each change small.

## Merge Checklist For Each Wave

- Local sign-in still works
- repo list still loads
- digest generation still works
- settings still save
- history still loads
- `pnpm build` passes
- `pnpm typecheck` passes
- `pnpm lint` passes
- `pnpm test` passes

## Implementation Note

If we find product constraints that require a different trust model, update this document before implementation. Otherwise this should be treated as the default execution brief.
