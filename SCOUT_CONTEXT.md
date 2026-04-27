# Scout — Project Context for New Sessions

Comprehensive briefing for any new Claude Code session continuing work on Scout. Read this before doing anything else. Captures product vision, architecture, brand system, recent decisions, and where we left off. Pairs with `CLAUDE.md` (which is the short version).

---

## 1. Product

**Scout** (`askscout.dev` web · `askscout` npm package) is **the daily digest for vibe coders**. It sniffs through your git repo and tells you what you built, what changed, and where you left off — read top to bottom like a daily report from a personal assistant who stayed up reading your commits.

### Target user

Solo devs and small teams using AI coding tools (Cursor, Claude Code, Windsurf) who want a clear daily summary of their progress without writing standups themselves.

### Voice and tone

- Warm, narrative, slightly editorial
- **Telescope mascot** — "scout" as in surveying from afar
- Signature lines:
  - **"Scanning the horizon for commits…"** (streaming opener, italic serif)
  - **"Nothing on the Horizon"** (quiet-day title)
- Personality without being saccharine. Direct and honest.

### Three output modes

1. **digest** (default) — daily report
2. **resume prompt** (`--resume`) — pasteable AI context for continuing work
3. **standup** (`--standup`) — yesterday/today/blockers format

### PRD

Located at `~/Desktop/PRD.md`. Always defer to it for product decisions, voice/tone, output format, and feature scope.

---

## 2. Architecture

pnpm monorepo at `/Users/charleshonig/Desktop/askscout/`.

```
packages/
  core/          @askscout/core — shared library
                 git reading, LLM summarization, output formatting,
                 project state management
  cli/           askscout npm package — thin CLI wrapper around core
apps/
  web/           Next.js app, deployed to Vercel at askscout.dev
                 GitHub OAuth, Supabase storage, hosted API key
```

### Tech stack

- **pnpm** workspaces (monorepo manager)
- **TypeScript strict** everywhere — no `any` unless justified
- **Next.js 15 App Router** + **React 19** (web app)
- **next-auth v5 beta** (GitHub OAuth, JWT sessions)
- **Supabase** (PostgreSQL) for persistence
- **Server-Sent Events** for streaming digest generation
- **Claude Haiku 4.5** or **GPT-5.4-nano** (cheapest models that work)
- **vitest** for tests · **eslint** + **prettier** for code quality
- **lucide-react** for ALL utility icons (exclusively — no other icon libs)
- **Microsoft Fluent 3D emoji** for emoji rendering (via jsdelivr CDN)
- **Vanilla CSS** with custom-property token system. **NO Tailwind.** A Tailwind v4 migration was tried today and reverted.

### Storage model

- Web: Supabase (digests, user profiles, settings, check-ins)
- CLI: `.askscout/state.json` per project, rewritten each run
- 30-day digest retention (free tier)

### Build / dev / test commands

```bash
pnpm install
pnpm build       # builds core first, then cli + web
pnpm dev         # all packages in dev/watch mode
pnpm test
pnpm typecheck
pnpm lint        # eslint
pnpm format      # prettier
```

Always run `pnpm typecheck`, `pnpm format`, `pnpm lint` before committing. Build pipeline must stay green.

---

## 3. Brand system

### Colors — dark mode is the source of truth, light mode mirrors

**8-color brand palette:**

| Name            | Hex                                                          |
| --------------- | ------------------------------------------------------------ |
| Primary Black   | `#070707`                                                    |
| Secondary Black | `#121212`                                                    |
| Dark Grey       | `#252525`                                                    |
| Light Grey      | `#616161`                                                    |
| White           | `#FFFFFF`                                                    |
| Green           | `#57D32E` (`#4AC321` in light mode — darker for readability) |
| Yellow          | `#F7C80B` (`#E2BB20` in light mode)                          |
| Red             | `#DD1D1D` (`#C32020` in light mode)                          |

**Token system** (in `apps/web/src/app/globals.css`):

| Token                                            | Dark Mode | Light Mode |
| ------------------------------------------------ | --------- | ---------- |
| `--color-bg-primary` (card surface)              | `#070707` | `#FFFFFF`  |
| `--color-bg-secondary` (body / sidebar / chrome) | `#121212` | `#FAFAFA`  |
| `--color-bg-tertiary` (subtle UI)                | `#252525` | `#EFEFEF`  |
| `--color-bg-elevated` (popovers)                 | `#141414` | `#FFFFFF`  |
| `--color-text-primary`                           | `#EDEDED` | `#070707`  |
| `--color-text-secondary`                         | `#A0A0A0` | `#616161`  |
| `--color-text-tertiary`                          | `#616161` | `#A0A0A0`  |
| `--color-border`                                 | `#222222` | `#E6E6E6`  |
| `--color-border-hover`                           | `#333333` | `#D0D0D0`  |
| `--color-accent`                                 | `#FFFFFF` | `#070707`  |
| `--color-accent-hover`                           | `#EDEDED` | `#252525`  |
| `--color-accent-text`                            | `#070707` | `#FFFFFF`  |
| `--color-success` (strong)                       | `#57D32E` | `#4AC321`  |
| `--color-warning` (moderate)                     | `#F7C80B` | `#E2BB20`  |
| `--color-danger` (rough)                         | `#DD1D1D` | `#C32020`  |

Status colors drive: Codebase Health badges (success=strong, warning=moderate, danger=rough), live badge dot, +/- line counts, danger button.

**No colored accent.** Scout uses white-on-black (dark) / black-on-white (light) for emphasis. No purple, no blue, no brand accent — discipline through monochrome + signal colors.

Theme switching: `[data-theme="dark"]` attribute on `<html>`, wired via `apps/web/src/components/ThemeToggle.tsx` and bootstrapped in `layout.tsx`.

### Typography — exclusively two faces

- **Pridi** (display serif) — used ONLY for digest page titles ("Today's Digest", "April 12th's Digest") and the **AskScout** logo wordmark
- **Work Sans** (body sans) — everything else, including code, data, file paths, timestamps

Loaded via `next/font/google` in `apps/web/src/app/layout.tsx`:

- `--font-pridi` (weights 400/500/600/700)
- `--font-work-sans` (weights 300/400/500/600, normal + italic)

Aliased in globals.css:

- `--font-sans` → Work Sans
- `--font-display` → Pridi
- No `--font-mono` token exists. Scout renders no monospace anywhere; use `var(--font-sans)` if you need a font-family.

Editorial opener line ("Scanning the horizon…") uses `--font-sans` italic — **not** Pridi. Pridi reserved strictly for titles + logo.

### Iconography

- **All utility icons:** `lucide-react`
- **All emojis:** Microsoft Fluent 3D via the `<Emoji>` component (`apps/web/src/components/Emoji.tsx`), pulled from jsdelivr CDN. Named keys: `vibe`, `shipped`, `changed`, `unstable`, `leftOff`, `takeaway`, `statistics`, `mostActiveFiles`, `whenYouCoded`, `paceCheck`, `codebaseHealth`, `streak`, `quietDay`.

### Spacing

`--space-xs/sm/md/lg/xl/2xl` = `4 / 8 / 16 / 24 / 32 / 48 px`.

The card itself uses **34px uniform interior padding** (header, narrative column, stats column). All dividers run edge-to-edge of the card.

### Radii

`--radius-sm` 6px · `--radius-md` 8px · `--radius-lg` 12px · `--radius-full` 9999px.

---

## 4. Key product moments

### Streaming flow (success path)

1. User clicks Generate (or auto-generates for today)
2. SSE connection opens to `/api/digest/stream`
3. **Opener phase** (~4.1s total): `DigestOpener` types out _"Scanning the horizon for commits…"_ in italic Work Sans with a blinking caret. Timing: 450ms start delay + ~1320ms typing + 2000ms dwell + 350ms fade.
4. **Skeleton phase**: opener fades, `SectionSkeleton` placeholders fill the layout (narrative + sidebar) with two layered animations:
   - Linear shimmer (gradient sweep across each line, 1.8s)
   - Slow ease-in-out width breathing (scaleX 1 → 1.015 → 1, 4.5s, staggered per line)
5. **Streaming phase**: real text drips in via typewriter pacing, replacing skeletons section by section
6. **Done phase**: cascade reveals stats sidebar (Statistics → Most Active Files → Coding Timeline → Pace Check → Codebase Health), bottom action buttons appear

### Streaming flow (no-commits / quiet-day path)

1. Stream starts, opener begins typing
2. API returns "no commits" error
3. Hook (`use-digest-stream.ts`) keeps `isStreaming = true` for THIS error specifically, so the opener doesn't yank
4. Dashboard schedules transition for ~4.1s after stream start (matches success-path opener total)
5. Quiet-day view replaces the streaming view: **"Nothing on the Horizon"** title + coffee Fluent emoji + "Rest counts too — Scout will be here when you're back" + check-in (preserves streak)

### Section markers (LLM output format)

The LLM outputs a structured response with emoji-prefixed section headers:

| Emoji | Section        | Visible?            |
| ----- | -------------- | ------------------- |
| 💬    | Vibe Check     | yes (narrative col) |
| 🚀    | Shipped        | yes (narrative col) |
| 🔧    | Changed        | yes (narrative col) |
| 🔄    | Still Shifting | yes (narrative col) |
| 📍    | Left Off       | yes (narrative col) |
| 🔑    | Key Takeaways  | yes (narrative col) |

After 🔑 the LLM emits `---STANDUP---`, `---PLAN---`, `---AI_CONTEXT---`, `---SUMMARY---` — these are private sections accessed via modals or invisible storage. The drip animation stops at `---STANDUP---`.

Plus computed stat sections (no LLM, rendered in stats sidebar): 📊 Statistics · 📁 Most Active Files · 🕐 Coding Timeline · ⚡ Pace Check · 🩺 Codebase Health.

### Page titles (date-aware)

- Today → **"Today's Digest"**
- Yesterday → **"Yesterday's Digest"**
- Older → **"April 12th's Digest"** (full month + ordinal suffix; 11/12/13 always "th")
- Quiet day (no commits) → **"Nothing on the Horizon"**

### Coding Timeline (the histogram)

- Renders as **16 fixed-width bars** (14px each) on a horizontal track
- One bin per time slot, distributed across the active commit time range
- Bins respect midnight boundaries — no bin spans two calendar days
- Bar height encodes total lines changed in that bin (height varies, width is fixed)
- Tooltip shows "N commits · +X / -Y" + time range; falls back to total lines for old digests
- **Only renders when `commitSpanHours <= 36`** (filtered at API level in `apps/web/src/app/api/digest/stream/route.ts`)
- Multi-day handling: bins allocated proportional to each day-segment's share, min 2 bins per segment

### Layout

- **Two-column above 1080px**: narrative (left, `minmax(0, 1fr)`) + stats sidebar (right, locked at 460px), separated by a vertical divider that runs from header bottom to card bottom
- **Sidebar** (left nav) is fixed-width on desktop, full-width with overlay on mobile (≤768px)
- **Card** (`.app-main`) sits on body chrome with 24px margin all around (top/right/bottom + sidebar-width on left), 1px border, rounded corners (12px)
- Card uses `--color-bg-primary` (darkest), body+sidebar use `--color-bg-secondary` (lighter chrome) → card visually elevated
- Card scrolls naturally with the page (NOT locked to viewport — that approach was tried then reverted)

---

## 5. Major components in `apps/web/src/components/`

| Component            | Purpose                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Sidebar.tsx`        | Left nav: logo, settings, theme toggle, repo picker, history list, profile + sign out. **CURRENT FOCUS — about to be redesigned pixel-perfect from Figma using MCP.** |
| `DigestView.tsx`     | Main content. Renders streaming + final digest. Owns the two-column layout, opener phase machine, sidebar gate logic. ~1400 lines.                                    |
| `DigestOpener.tsx`   | Editorial typing line ("Scanning the horizon for commits…"). Self-contained lifecycle: wait → type → dwell → onComplete.                                              |
| `PreGeneration.tsx`  | `SectionSkeleton` component + `SECTION_SKELETONS` / `SIDEBAR_SKELETONS` data arrays.                                                                                  |
| `RepoSelector.tsx`   | Custom combobox replacing native `<select>`. Keyboard nav, search, smart sort.                                                                                        |
| `ThemeToggle.tsx`    | Light/dark flip via `data-theme` attribute on `<html>`.                                                                                                               |
| `Emoji.tsx`          | Microsoft Fluent 3D emoji wrapper (renders via `<img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/...">`).                                          |
| `Header.tsx`         | Mobile-only top bar (hamburger + logo).                                                                                                                               |
| `AIContextModal.tsx` | "Resume Prompt" output modal.                                                                                                                                         |
| `StandupModal.tsx`   | Standup output modal.                                                                                                                                                 |
| `PlanModal.tsx`      | To-Do List output modal.                                                                                                                                              |
| `HistoryList.tsx`    | Sidebar history rows (legacy — currently unused; sidebar inlines its own list).                                                                                       |

### Key files in `apps/web/src/`

| Path                             | Purpose                                                                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `app/globals.css`                | ALL styling. ~3000 lines. Theme tokens (`:root` + `[data-theme="dark"]`) plus all component styles in BEM-ish class naming. |
| `app/layout.tsx`                 | Root layout. Font loading (Pridi + Work Sans via `next/font/google`), theme bootstrap script, SessionProvider.              |
| `app/dashboard/page.tsx`         | Main dashboard page (~900 lines). Orchestrates everything.                                                                  |
| `app/api/digest/stream/route.ts` | SSE endpoint that streams the digest. Filters out timeline for >36h spans.                                                  |
| `lib/use-digest-stream.ts`       | React hook wrapping the SSE consumer + typewriter drip. Keeps `isStreaming` true on no-commits errors specifically.         |
| `lib/parse-sections.ts`          | Splits LLM output into the marked sections.                                                                                 |
| `lib/typewriter-pace.ts`         | Adaptive typing speed (faster on whitespace, slower on emoji).                                                              |
| `lib/use-count-up.ts`            | Animated number counter for stat reveals.                                                                                   |

### Settings + auth

- `apps/web/src/auth.config.ts` — NextAuth GitHub OAuth setup, captures GitHub `login` (handle) into the JWT
- `apps/web/src/types/next-auth.d.ts` — extends `Session` type with `user.login`
- Settings stored in Supabase `user_settings` table; section-visibility prefs hide individual digest sections per user

---

## 6. Conventions

- All source code in `src/` directories
- TypeScript strict mode — no `any` unless explicitly justified
- Cross-package deps use `workspace:*` protocol
- BEM-style class names (`.sidebar-section`, `.digest-page-name`)
- Comments explain **why**, not **what**
- Code generally avoids unnecessary abstraction — readability over cleverness
- Pridi reserved for digest titles + logo only — never elsewhere
- Work Sans is the only sans face in use
- No hardcoded hex colors in code — always use tokens
- No tailwind utility classes — vanilla CSS only

---

## 7. Recent decisions (latest first)

### Today

- **Tailwind v4 migration was tried then fully reverted.** Vanilla CSS + tokens is the chosen approach. Pixel-perfect brand work needs CSS control. Reason for revert: my Sidebar Tailwind execution was sloppy + the user wanted full design control without indirection.
- **Figma Dev Mode MCP server installed.** New chats can read Figma directly via `mcp__plugin_figma_figma__*` tools (especially `get_design_context` and `get_screenshot`).
- **About to redo the Sidebar pixel-perfect from Figma.** Frame to be shared. Implement in vanilla CSS using existing tokens, no class soup, BEM names, match every pixel against screenshot + MCP data.
- **Skip Figma plugin code exports entirely.** They produce useless absolute-positioned div soup. Always read via MCP.

### Earlier this week

- Editorial opener ("Scanning the horizon for commits…") added with focus-pull and dwell timing
- Replaced per-commit Coding Timeline columns with fixed-bin histogram (16 bins, 14px fixed-width bars)
- Quiet-day transition holds for opener completion (~4.1s) — no interstitial
- Page titles became date-aware ("April 12th's Digest")
- Status colors aligned to brand palette
- Removed Linear-style purple accent → white/black accent only
- Light mode mirror designed as exact counterpart to dark mode
- Card frame moved to natural page scroll (not locked to viewport)
- Coding Timeline 36-hour cap noted (only shows for ≤36h spans)
- Page title for no-commits: "Quiet Day" → "Nothing on the Horizon" (echoes opener)
- Locked typography to Pridi + Work Sans only, no other faces, no monospace

---

## 8. Workflow expectations from the user

- **Direct, non-defensive answers.** Push back honestly when something is a bad idea. Own mistakes without making excuses.
- **No verbose explanations.** Brevity over thoroughness. Match the user's energy.
- **Pixel-perfect when Figma is involved.** Read the Figma source via MCP, cross-reference screenshots, match every measurement.
- **Run `pnpm typecheck`, `pnpm format`, `pnpm lint` before commits.** Build pipeline must stay green.
- **Commit + push after every meaningful change** unless told otherwise. User wants to see results live on Vercel quickly.
- **Co-author git commits with:** `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`
- **Don't use TodoWrite for trivial work.** Reserve it for genuinely multi-step tasks.

---

## 9. Where we left off

- Tailwind reverts pushed (latest commit: `4408b82` "Revert Tailwind v4 alongside existing CSS")
- All current functionality working in vanilla CSS
- Figma Dev Mode MCP newly available
- Ready to redesign Sidebar from Figma using MCP + screenshots
- User has a Figma frame for the sidebar prepared
- Will continue section-by-section through the dashboard

---

## 10. Figma workflow

When the user shares a Figma URL or selects a frame:

1. **Use the MCP tools, not Figma's code export.** Plugin output (HTML/Tailwind/React) is unusable as a starting point.
2. Call `mcp__plugin_figma_figma__get_design_context` with the nodeId and fileKey to get raw design data (dimensions, colors, spacing, fonts, structure).
3. Call `mcp__plugin_figma_figma__get_screenshot` for visual reference.
4. Cross-reference screenshot to MCP data — the screenshot is ground truth for what looks right.
5. Translate to **vanilla CSS** using existing tokens. Don't introduce arbitrary hex codes.
6. Use the existing class-naming convention (BEM-ish: `.sidebar-section`, `.digest-page-header`).
7. Match every measurement (padding, gap, font-size, line-height) to Figma exactly. If there's a token close to the value, use the token; otherwise use the literal pixel value.
8. Map any Figma color to the closest brand token (use the table in section 3).
9. Replace any Figma SVG icon paths with the equivalent **lucide-react** component.
10. Keep all existing component functionality intact — props, behavior, mobile responsive, accessibility.

### Figma-to-token color mapping cheat sheet

If Figma uses Tailwind defaults via dev mode, mentally map:

| Figma class                             | Likely intent | Use token                                                                        |
| --------------------------------------- | ------------- | -------------------------------------------------------------------------------- |
| `bg-neutral-900` / `bg-stone-900`       | Dark surface  | `var(--color-bg-secondary)` or `var(--color-bg-tertiary)` depending on hierarchy |
| `bg-zinc-950` / `bg-black`              | Darkest       | `var(--color-bg-primary)`                                                        |
| `bg-white`                              | Lightest      | `var(--color-bg-primary)` (light) or `#FFFFFF` literal                           |
| `text-zinc-600` / `text-neutral-500`    | Muted text    | `var(--color-text-tertiary)`                                                     |
| `text-zinc-400`                         | Less muted    | `var(--color-text-secondary)`                                                    |
| `text-white`                            | Body          | `var(--color-text-primary)`                                                      |
| `text-lime-500` / `text-green-500`      | Success       | `var(--color-success)`                                                           |
| `text-red-500` / `text-red-600`         | Danger        | `var(--color-danger)`                                                            |
| `text-yellow-500` / `text-amber-500`    | Warning       | `var(--color-warning)`                                                           |
| `outline-stone-900` / `border-zinc-800` | Subtle border | `var(--color-border)`                                                            |

---

## 11. Quick reference

- **Repo:** https://github.com/charleshonig5/askscout
- **Production:** https://askscout.dev (Vercel)
- **PRD:** `~/Desktop/PRD.md`
- **Local path:** `/Users/charleshonig/Desktop/askscout/`
- **Two fonts only:** Pridi (display, titles+logo), Work Sans (body)
- **Eight palette colors** (see section 3)
- **No Tailwind, no other CSS frameworks** — vanilla CSS + tokens
- **Lucide icons exclusively** for utility icons
- **Microsoft Fluent 3D for emoji** via `<Emoji>` component
- **Dark mode is canonical** — light mode mirrors

---

End of context document. The new chat should be productive immediately after reading this + skimming `CLAUDE.md` + recent git log.
