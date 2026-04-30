# Architecture

> **Audience:** new contributors, reviewers, and AI coding agents who need a system-level view of askscout. Source-of-truth for design decisions; supersedes any informal explanations in code comments when the two disagree.

askscout has two user-facing surfaces — a CLI published to npm and a web app deployed at askscout.dev — that share a common engine for reading git history, calling an LLM, and rendering a digest. The shared engine is the `askscout-core` package.

This document explains how the pieces fit together. For workflow / onboarding info (commands, conventions, contribution flow), see [AGENTS.md](../AGENTS.md) and [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## 1. Repository layout

```
askscout/
├─ packages/
│  ├─ core/      askscout-core — shared library (TypeScript, ESM + CJS)
│  └─ cli/       askscout — CLI binary published to npm
└─ apps/
   └─ web/      Next.js 15 app deployed to Vercel
```

**Build order:** `core` builds first via [tsup](https://tsup.egoist.dev/) into `dist/`, emitting both ESM and CJS plus `.d.ts` declarations. `cli` consumes core's dist via the `workspace:*` protocol and bundles into a single `dist/index.cjs` shipped as the `askscout` binary. `web` consumes core via the same workspace protocol and is bundled by Next.js. `pnpm build` runs all three in dependency order.

**Why a monorepo?** Two surfaces need to produce the same digest data, render the same text, and share types. Without a shared package the two would drift quickly (and they have, before — the web/CLI parity work in commit history is evidence of the cost).

---

## 2. Conceptual data flow

The same logical pipeline runs on both surfaces:

```
git history → diffs → LLM summarization → structured digest → rendered output
```

The pipeline is implemented separately on each surface because the inputs and outputs differ (local git vs GitHub API; terminal text vs HTML), but the middle steps are deliberately shared.

### CLI path

```
.git on disk
    │
    ▼
getCommits()       packages/core/src/git.ts — runs `git log --pretty=...`
getDiffs()         via execFile() with size limits + truncation
    │
    ▼
summarize()        packages/core/src/summarize.ts
    │              builds system + user prompts; dispatches to the
    │              configured LLM provider; parses JSON response
    ▼
Digest             structured object — typed in packages/core/src/types.ts
    │
    ▼
formatDigest()         packages/core/src/format.ts — render to terminal
formatCodebaseHealth()
formatCodingTimeline()
formatPaceCheck()
    │
    ▼
console.log → user
```

After rendering, scan.ts also writes the run to `.askscout/state.json` (see §4).

### Web path

```
GitHub OAuth token (NextAuth session)
    │
    ▼
fetchCommits()     apps/web/src/lib/github.ts — GitHub REST API
fetchDiffs()       (no local git; the user's repo lives on GitHub)
    │
    ▼
buildUnifiedSystemPrompt()    packages/core/src/summarize.ts (SHARED)
    +
custom user prompt            apps/web/src/app/api/digest/stream/route.ts
                              (web-specific: project context from Supabase,
                               churn data, sanitized patches)
    │
    ▼
LLM streaming API
    │
    ▼
Server-sent events to the browser
    │
    ▼
DigestView component   apps/web/src/components/DigestView.tsx
                       (parses streaming markers, renders sections live)
```

After streaming, the web persists the digest into Supabase (`digests` table) and updates the rolling `project_summaries` row.

### What's intentionally shared, what's not

| Concern                                 | Shared in core?                            | Why                                                                                                                                    |
| --------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **System prompts** (tone, format rules) | ✅ Yes — `buildUnifiedSystemPrompt()` etc. | Identical brand voice on both surfaces                                                                                                 |
| **User prompts** (input data + framing) | ❌ No — each surface builds its own        | Inputs differ structurally (local diffs vs GitHub API responses + Supabase context)                                                    |
| **Type definitions**                    | ✅ Yes — `packages/core/src/types.ts`      | Both surfaces operate on the same `Digest`, `GitCommit`, `HealthIndicator` shapes                                                      |
| **Output formatting**                   | Partial                                    | CLI uses core's `format*()` functions; web has its own React components in `DigestView.tsx`. Both target the same content semantically |
| **State persistence**                   | Per-surface                                | CLI writes `.askscout/state.json`; web writes Supabase tables                                                                          |
| **Git reading**                         | Core has the local-git path                | Web doesn't use it (no local repo); web has its own GitHub-API fetcher in `apps/web/src/lib/github.ts`                                 |

---

## 3. Core library (`askscout-core`)

The library exposes a single ESM/CJS entry point at `packages/core/src/index.ts` that re-exports everything from these modules:

| File           | Responsibility                                                                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git.ts`       | Local-git access. `getCommits`, `getDiffs`, `getRepoName`. Uses `execFile` against the `git` binary, NUL-delimited record format, max-buffer + truncation safeguards. CLI-only in practice — the web doesn't call these                                                                                 |
| `summarize.ts` | System and user prompts (`buildSystemPrompt`, `buildUnifiedSystemPrompt`, `buildAIContextSystemPrompt`, `buildStandupSystemPrompt`, `buildUserPrompt`); `summarize()` orchestrator that dispatches to the configured LLM provider and parses the JSON response into a `Digest`; `computeStats()` helper |
| `format.ts`    | Terminal output renderers — `formatDigest`, `formatCodebaseHealth`, `formatCodingTimeline`, `formatPaceCheck`, `formatResume`, `formatStandup`. TTY/`NO_COLOR` aware                                                                                                                                    |
| `state.ts`     | `.askscout/state.json` reader/writer with v1 → v2 migration, `appendDigestRun` helper, `STATE_HISTORY_CAP` constant                                                                                                                                                                                     |
| `types.ts`     | All shared types — `Digest`, `DigestStats`, `DigestItem`, `UnstableItem`, `HealthIndicator`, `GitCommit`, `GitDiff`, `ProjectState`, `DigestRunSummary`, `AiConfig`, etc.                                                                                                                               |
| `index.ts`     | Barrel — public surface area                                                                                                                                                                                                                                                                            |

**Stability:** the library is pre-1.0. The barrel is the public API; anything not re-exported is internal and may move without notice.

### Why prompts live in core (and split how they do)

The brand voice and structural format of a digest must be identical between CLI and web. If they're not, users get a different "feel" depending on where they read their digest, and copy-pasting between surfaces produces inconsistent output. Putting **system prompts** (the rules) in core enforces this.

User prompts diverge because the inputs are structurally different: the CLI has parsed `GitCommit[]` + `GitDiff[]` from local `git log`, while the web has GitHub REST API responses plus Supabase-stored project context. Forcing both into one shape would either lose information (web has more) or pad the CLI with empty fields. The compromise is documented in `summarize.ts`'s file-level comment.

---

## 4. State and persistence

### CLI: `.askscout/state.json` (per project)

Schema version 2:

```ts
interface ProjectState {
  version: number;
  lastRunAt: string; // ISO timestamp
  runCount: number;
  summary: string; // AI-maintained rolling project summary
  digestHistory: DigestRunSummary[]; // rolling window (cap = 10), used by Pace Check
}

interface DigestRunSummary {
  runAt: string;
  commits: number;
}
```

`readState()` tolerates v1 files (no `digestHistory` field) by defaulting it to `[]`. `writeState()` always emits v2. Corrupt entries inside `digestHistory` are dropped per-entry rather than failing the whole read.

Permissions: the directory is `0700`, the file is `0600` (set by `setup.ts` when writing the API key, applies to anything else under `.askscout/` too if written through state.ts). Stays local to the user's machine.

### Web: Supabase tables

| Table               | Contains                                                                   | Scoped by         |
| ------------------- | -------------------------------------------------------------------------- | ----------------- |
| `user_settings`     | Default repo, per-section toggle preferences                               | `user_id`         |
| `digests`           | Saved digest content + stats blob (JSONB) per run                          | `user_id`, `repo` |
| `daily_checkins`    | Quiet-day check-in records (date + repo) — keep streaks alive on rest days | `user_id`, `repo` |
| `project_summaries` | AI-maintained rolling summary per repo                                     | `user_id`, `repo` |

All Supabase queries are scoped by `user_id` (sourced from the NextAuth session). Cross-user reads aren't possible by routing — every `select`/`insert`/`delete` includes a `.eq("user_id", userId)` filter.

---

## 5. AI provider integration

`AiConfig` (in `types.ts`) tags each call with a provider:

```ts
type AiProvider = "anthropic" | "openai";

interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model?: string; // optional override
}
```

`summarize()` dispatches to one of two provider-specific call functions (`callAnthropic()` or `callOpenAI()`) based on the `provider` field. The CLI auto-detects the provider from the API key prefix during `--setup` (the type literals shown above match each provider's key format). The web app uses a hosted API key from server-side environment variables and bypasses the user-side BYOK flow.

Both providers are asked to return the same JSON shape, defined implicitly by the parsing logic at the bottom of `summarize()`. If the LLM returns malformed JSON, `summarize()` throws with a truncated raw-response excerpt for debugging.

---

## 6. CLI structure

```
packages/cli/src/
├─ index.ts          yargs entrypoint, parses --setup / --resume / --standup / --week / --json / --dry-run
├─ commands/
│  └─ scan.ts        the main run — git read → summarize → format → render → state write
├─ config.ts         loads/saves ~/.askscout/config.json (API key) with 0600 permissions
├─ setup.ts          interactive setup flow for new users (key entry + provider detect)
└─ spinner.ts        minimal terminal spinner; gates animation on stderr.isTTY
```

The CLI is a thin wrapper. All real logic — git access, LLM calls, formatting, state — lives in core. The CLI's job is to glue command-line flags to the right core functions and stream output to stdout/stderr.

---

## 7. Web structure

```
apps/web/src/
├─ app/
│  ├─ api/
│  │  ├─ digest/stream/route.ts    streaming digest generation (SSE)
│  │  ├─ digest/today/route.ts     cache lookup for today's digest
│  │  ├─ history/route.ts          past digests for a repo
│  │  ├─ insights/                 aggregate stats for the Insights page
│  │  ├─ checkin/route.ts          quiet-day check-in recorder
│  │  ├─ settings/route.ts         user preferences
│  │  ├─ repos/route.ts            user's GitHub repo list
│  │  ├─ account/route.ts          delete-account / clear-history
│  │  └─ auth/[...nextauth]/       NextAuth callbacks
│  ├─ dashboard/page.tsx           main digest viewing surface
│  ├─ insights/page.tsx            stats / streaks / personality
│  └─ settings/page.tsx            user preferences UI
├─ components/
│  ├─ DigestView.tsx               canonical web rendering of a digest (incl. copy-markdown builder)
│  ├─ PreGeneration.tsx            shimmer skeletons during streaming
│  ├─ StandupModal.tsx             standup output as a copy-friendly modal
│  ├─ AIContextModal.tsx           resume prompt as a copy-friendly modal
│  ├─ PlanModal.tsx                to-do list output
│  └─ ...
└─ lib/
   ├─ github.ts                    GitHub REST API client (commits + diffs for the web path)
   ├─ supabase.ts                  Supabase client + helpers
   ├─ auth.ts                      NextAuth config + getUserId()
   ├─ rate-limit.ts                per-user digest rate limiting
   └─ ...
```

The web app's digest pipeline is functionally similar to the CLI's but operates over different data sources (GitHub API instead of local git, Supabase instead of state.json).

### Streaming

`/api/digest/stream` returns Server-Sent Events. The browser subscribes via `useDigestStream()` hook, parses incoming chunks against section markers (`---VIBE_CHECK---`, `---SHIPPED---`, etc.), and progressively replaces shimmer skeletons with real content as each section arrives. Non-streaming sections (computed stats like Coding Timeline, Pace Check) appear in one beat after the LLM stream finishes.

---

## 8. Build, test, release pipeline

| Stage                                      | What runs                                                                                                                                                       | Where                                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **Local dev**                              | `pnpm dev` runs all three packages in watch mode                                                                                                                | tsup (core, cli) + next dev (web)     |
| **CI** (every push + PR)                   | `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`                                                 | `.github/workflows/ci.yml`            |
| **Release** (push to main with changesets) | Changesets opens or updates a "Version Packages" PR. Merging that PR triggers `pnpm release` (build + `changeset publish`) which publishes both packages to npm | `.github/workflows/release.yml`       |
| **Web deploy**                             | Vercel auto-deploys `apps/web/` on every push to `main`                                                                                                         | Vercel (configured outside this repo) |

Automated dependency updates are handled by Dependabot (`.github/dependabot.yml`) — weekly grouped npm minor/patch PRs across each package directory, monthly GitHub Actions bumps.

---

## 9. Key invariants worth preserving

These are the assumptions the codebase quietly relies on. Breaking them tends to cause subtle drift, not loud errors.

1. **Web copy-markdown ↔ CLI stdout parity.** The CLI's terminal output and the web's "Copy Digest" markdown should produce equivalent text on equivalent inputs. If you change wording or formatting on one, change the other in the same PR.
2. **System prompts only in core.** Never duplicate prompt text into a per-surface file. If you need surface-specific prompt behavior, add a parameter to the core builder.
3. **User-facing copy stays out of the banned-metaphor zones.** No dog metaphors, no "horizon" metaphors, no em-dashes in prose. (Quirk of the brand voice; documented in CLAUDE.md.)
4. **CLI runs offline-first.** The CLI's only network call is to the chosen LLM provider. No telemetry, no remote state, no auth server. Adding any of those would break a core promise.
5. **State files migrate forward, never backward.** Older state files (v1) must continue to read cleanly after schema bumps. We default missing fields rather than rejecting old data.
6. **Refs aren't reactive.** When dashboard code reads a ref during render to gate UI, that gate only fires when an unrelated state change triggers a re-render. Prefer state for UI gates; refs for cross-effect coordination only. (See the streak-badge gate in `apps/web/src/app/dashboard/page.tsx` for a worked example.)

---

## 10. What's not documented yet

This file deliberately scopes to architecture. For deeper dives:

- **Prompt design rationale** — the system prompts in `summarize.ts` carry the brand voice and section-format rules. They have inline comments explaining specific choices but no separate doc.
- **Personality archetypes** (Insights page) — see `apps/web/src/app/api/insights/personality.ts`. Pure functions, well-commented.
- **Test strategy** — `packages/core` has zero tests today. Adding coverage there is the highest-priority unfinished item.

If you find yourself reading code to answer a question this doc should have answered, that's a doc bug. Open a PR or an issue.
