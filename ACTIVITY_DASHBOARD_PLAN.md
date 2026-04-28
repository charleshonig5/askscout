# Activity Dashboard — Plan

A stats / insights page about the user's **usage of askscout** (not their
coding stats — the digest already covers those). Surfaces patterns the user
wouldn't notice on their own and creates engagement pull (streak protection,
shareable personality).

Status: **planning**. No code shipped yet. Iterate on this doc as decisions
firm up.

---

## Audience + framing

- For solo / small-team vibe coders who use askscout daily-ish.
- "You, the coder, in relation to Scout." Not "you vs. peers."
- All stats are **general** (aggregate across repos) by default — the digest
  itself is where per-repo coding stats live.

---

## Entry point

Top of the digest dashboard header, sitting **immediately next to the
settings gear icon** in the header-right icon group. Same icon-button
treatment as the existing settings/theme-toggle icons (Lucide stroke icon,
1px stroke, 20px, sized to match the rest of the row).

Always visible — even for brand-new accounts with zero data. The Insights
page itself handles the empty state (see "Empty state" below).

Click → routes to `/insights`.

**Page title**: "Insights".

---

## Page structure

**Reuses the settings page shell exactly.** Same primitives, same rhythm,
no new layout system to invent:

- **Outer page**: `--color-bg-secondary` wall, 24px top/bottom padding
  (matches `.app-main` rhythm).
- **Centered card**: 595px max-width, `--color-bg-primary` fill,
  `--color-border` stroke, 20px radius. Same as `.settings-card`.
- **Header strip**: "Back to Digest" outlined pill on the left + Pridi
  24px page title; "Close" glass button on the right. Full-bleed divider
  underneath. Identical to the settings header.
- **Content sections**: stacked vertically, 34px gap, 527px wide centered.
  Each section follows the `.settings-section-head` + panel pattern
  (emoji 20px + 16px Medium label + 12px Light desc, then a panel
  underneath where applicable). `.settings-divider` between sections.

Reuse classes and primitives as much as possible — this page is a sibling
of `/settings`, not a new design language.

### Sections, top to bottom

1. **Snapshot row** — two top-tier stats
2. **Activity calendar** — 365-day heatmap, all-repos aggregated
3. **Per-repo breakdown** — table with repo selector
4. **Engagement personality** — primary trait + three modifier tags

Each section gets its own emoji + label + desc header (Fluent 3D emoji to
match the settings-page treatment), then the relevant content as a
`.settings-panel`-styled container where it makes sense.

---

## 1. Snapshot row

Two stats only (decided after considering and rejecting "Days using Scout"
and "Repos Scoutified" as not interesting enough).

**Best streak**
- Longest consecutive run of active days, computed across all repos with
  per-repo dedup (a day counts if any repo had activity).
- Display: `47 days` + the repo it was achieved on (e.g., "on `askscout`").

**Total digests**
- Lifetime count of digests this user has generated, across all repos.
- Display: `73 digests`.

A third stat was considered (Most digests in one day / Active days) and
deferred — two is fine.

---

## 2. Activity calendar

GitHub-contributions-style 365-day heatmap, aggregated across **all repos**.

**Cell states:**
- **Empty** — no Scout activity that day
- **Light shade** — quiet-day check-in only
- **Full shade** — at least one digest generated that day

**Hover detail**: date, digest count, active repos that day.

**Year selector** appears once the user has ≥1 year of data.

---

## 3. Per-repo breakdown table

Compact table; the user can scope to a specific repo via a selector if they
want to drill into one.

**Columns:**

| Column          | Source                                                         |
| --------------- | -------------------------------------------------------------- |
| Repo            | distinct values of `digests.repo` for this user                |
| Digests         | count of digests for this user + repo                          |
| Current streak  | as currently computed in the dashboard, scoped per-repo        |
| Best streak     | longest historical run for this user + repo                    |
| Last active     | max(`digests.created_at`, `daily_checkins.date`) per user/repo |

Sortable by any column. Default sort: last active, descending.

---

## 4. Engagement personality

The shareable, sticky moment. The lift here is what makes Insights feel
worth visiting more than once.

**Structure**: one **primary archetype** (the big headline) + **2–3
modifier tags** (current state, secondary patterns). Archetypes come from
a curated library of ~20 named identities, each with a distinct data
signature. Modifiers come from a smaller fixed set of dynamic-state
labels.

### Display

```
🌙 Night Owl
Most of your digests land between 10 pm and 2 am.

On Fire · Specialist · Builder
```

- Big primary archetype with a single matching emoji.
- One plain descriptive line below explaining the data behind it.
- 2–3 modifier tags in a dot-separated row.
- Recomputed live every visit so it shifts as patterns shift.

---

### Data signals — the toolkit

Every archetype's signature is derived from these signals. All come from
existing data (`digests` rows + their `stats` JSONB blob + `daily_checkins`).

**Time / when**
- Hour-of-day distribution of `digests.created_at` → dominant bucket
- Hour spread (concentrated vs. flat distribution)
- Day-of-week distribution
- Weekday vs. weekend ratio
- Single-day-of-week dominance (e.g., 70%+ on one DOW)

**Frequency / consistency**
- Active days in last 30 (digests or check-ins)
- Active days lifetime
- Current streak length
- Best streak length
- Streak count (how many distinct streaks of 3+ days)
- Recovery time after a break (avg gap-then-resume)
- Total tenure (days since first digest)

**Repo portfolio**
- Distinct repos with any digest activity, lifetime
- Active repos (digest in last 30 days)
- Top-repo concentration (% of digests in #1 repo)
- Repo-switch frequency (avg days between repo switches)
- Number of "abandoned" repos (no activity 30+ days)

**Coding style** (averaged across digests' `stats` blob)
- avg `linesAdded` / avg `linesRemoved` ratio (build vs. refactor)
- avg `commits` per digest (light vs. heavy shipper)
- avg `filesChanged` per commit (surgical vs. broad)
- distribution of `health.growth.level` ("low" / "medium" / "high")
- distribution of `health.focus.level`
- distribution of `health.churn.level`
- avg `pace.multiplier`

**Sessions** (from `stats.timeline.points`)
- avg session length per day
- avg gap between commits within a day
- single-session vs. multi-session days

**State** (right now)
- Current streak status
- Days since last activity
- Whether they recently resumed after a gap
- Whether they're in their first 14 days

---

### Primary archetypes — what the user sees

21 named identities. Each one has a clear distinguishing signature so two
users with different patterns get visibly different labels.

The **Definition** column is internal/spec context — what this archetype
represents as an identity. The **Subheader** column is the templated line
shown directly under the archetype name on the page (with `X` and `[repo]`
filled in from real data).

| Archetype                     | Definition                                                                  | Subheader (shown to user)                                          |
| ----------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 🌅 **Dawn Patrol**            | Codes before the rest of the world wakes up.                                | You generate most digests between 5 and 9 am.                      |
| ☀️ **The 9-to-5er**           | Stays in the work-hours lane. Mostly weekdays, mostly daytime.              | Most of your digests land during work hours on weekdays.           |
| 🌇 **The Sundowner**          | Winds down the day with code. Late afternoon and evening peaks.             | Your digests peak between 5 and 10 pm.                             |
| 🌙 **Night Owl**              | Pushes most code while the city sleeps.                                     | Most of your digests land between 10 pm and 2 am.                  |
| 🦇 **The Insomniac**          | Wee-hours coder with an irregular schedule.                                 | Your digests cluster between 2 and 5 am.                           |
| 🌗 **The Moonlighter**        | Day job and side project. Codes at lunch and again at night.                | Bimodal pattern. Peaks around midday and again in the evening.     |
| 🏖 **Weekend Warrior**        | Saves the real work for Saturdays and Sundays.                              | X% of your digests land on weekends.                               |
| 🎯 **The Specialist**         | One repo holds your attention, deeply.                                      | X% of your digests are in `[repo]`.                                |
| 🤹 **The Juggler**            | Working in 4+ repos simultaneously, no clear favorite.                      | Active across X repos. None holding the majority.                  |
| 🪂 **The Drifter**            | Moves between many repos, none for very long.                               | X repos touched lifetime. High turnover, low retention.            |
| 🛠 **The Builder**            | Adds way more than you remove. Net new code is the mode.                    | About X lines added for every 1 removed.                           |
| 🪞 **The Polisher**           | Refactoring is your default. Removes nearly as much as you add.             | Net additions stay low. You keep things clean.                     |
| 🔬 **The Surgeon**            | Small precise commits, 1 to 2 files at a time. Surgical changes.            | Average X files per commit. Focused, precise work.                 |
| 🌋 **The Earthquake**         | Big multi-file commits, high churn. When you ship, the codebase moves.      | Average X files per commit. Every change has reach.                |
| 🏗 **The Architect**          | Long sessions, few commits, dense changes. Thinks before committing.        | Sessions average X minutes. Slow, considered, big swings.          |
| ⚡ **The Sprinter**           | Tight loops. Many small commits per session, quick iterations.              | X commits per digest on average. Small, fast, frequent.            |
| 🏴‍☠️ **The Pirate**            | Many repos, chaotic hours, bursts of activity. No two days look alike.      | Across X repos at all hours. Chaos by design.                      |
| ⛪ **The Cathedral Builder**  | Single repo, long focused sessions, building something significant.         | Building `[repo]` over long sessions. Net additions, low churn.    |
| 🔧 **The Garage Tinkerer**    | Late-night solo grind on one project. Slow, steady, persistent.             | Late hours in `[repo]`. Patient daily progress.                    |
| 🥷 **The Stealth Shipper**    | Quiet stretches punctuated by big single-day pushes.                        | Long quiet runs, then bursts. Episodic shipping.                   |
| 🐢 **The Marathoner**         | 90+ days in, still consistent. Tortoise wins this race.                     | X days in, active most weeks, low variance.                        |

---

### Backend categorization — the rules

This is the actual matching logic. Every threshold is on existing data;
nothing new to track.

**Bands used below:**
- Hour bands: Dawn (5–9am) · Day (9am–5pm) · Evening (5–10pm) · Night (10pm–2am) · Wee Hours (2–5am)
- "Top band %" = % of digests falling in the user's most-used hour band

| Archetype                     | Tier   | All criteria must hold                                                                                          |
| ----------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| 🌅 Dawn Patrol                | single | top band = Dawn AND Dawn % ≥ 40%                                                                                |
| ☀️ The 9-to-5er               | single | top band = Day AND Day % ≥ 40% AND weekday % ≥ 70%                                                              |
| 🌇 The Sundowner              | single | top band = Evening AND Evening % ≥ 40%                                                                          |
| 🌙 Night Owl                  | single | top band = Night AND Night % ≥ 40%                                                                              |
| 🦇 The Insomniac              | single | top band = Wee Hours AND Wee Hours % ≥ 30%                                                                      |
| 🌗 The Moonlighter            | single | Day % ≥ 25% AND (Evening % + Night %) ≥ 25% AND no single band > 50%                                            |
| 🏖 Weekend Warrior            | single | weekend % (Sat + Sun) ≥ 60%                                                                                     |
| 🎯 The Specialist             | single | top-repo share ≥ 80% AND active repos in last 30d ≤ 2                                                           |
| 🤹 The Juggler                | single | active repos in last 30d ≥ 4 AND top-repo share < 40%                                                           |
| 🪂 The Drifter                | single | total lifetime repos ≥ 5 AND top-repo share < 40% AND avg streak per repo < 3 days                              |
| 🛠 The Builder                | single | avg(linesAdded) / avg(linesRemoved) ≥ 2.0 AND ≥ 50% of digests have growth.level = "high"                       |
| 🪞 The Polisher               | single | avg(linesRemoved) / avg(linesAdded) ≥ 0.8 AND ≥ 40% of digests have churn.level = "high"                        |
| 🔬 The Surgeon                | single | avg files per commit ≤ 1.5 AND avg lines per commit ≤ 50                                                        |
| 🌋 The Earthquake             | single | avg files per commit ≥ 5 AND ≥ 40% of digests have churn.level = "high"                                         |
| 🏗 The Architect              | single | avg session length ≥ 90 min AND avg commits per digest ≤ 3 AND avg lines per commit ≥ 80                        |
| ⚡ The Sprinter               | single | avg commits per digest ≥ 8 AND avg lines per commit ≤ 30                                                        |
| 🏴‍☠️ The Pirate                | combo  | total lifetime repos ≥ 4 AND top band % < 40% (high hour spread) AND avg streak per repo < 5 days               |
| ⛪ The Cathedral Builder      | combo  | Specialist criteria met AND Architect criteria met AND Builder criteria met                                     |
| 🔧 The Garage Tinkerer        | combo  | Night Owl criteria met AND Specialist criteria met AND active 4–24 days/30 (Steady Hand or Slow Burn frequency) |
| 🥷 The Stealth Shipper        | combo  | (max daily-commit-count / median daily-commit-count) ≥ 4 AND has had ≥ 1 quiet stretch of 7+ days               |
| 🐢 The Marathoner             | combo  | tenure ≥ 90 days AND active days / total days ≥ 0.5 AND coefficient of variation in weekly digest count < 0.5   |

---

### Selection logic — when multiple archetypes match

A user can match several criteria sets at once. The algorithm picks
exactly one primary archetype using this order:

1. **Minimum data gate.** If the user has fewer than the threshold below,
   skip archetype selection entirely and use the empty/early-stage rules
   in the next section.

2. **Combo tier first.** Evaluate every combo archetype. If any match all
   their criteria, the primary is the most-specific combo (priority order
   below). Combos always beat singles because they require strictly more
   to qualify.

3. **Single tier.** If no combo matched, score each single-axis archetype
   that meets its threshold. The score is the user's match strength on
   each criterion (0–1 per criterion, summed and normalized). Highest
   score wins.

4. **Score ties.** When two archetypes tie, fall back to the fixed
   priority list below — time-of-day archetypes are most identity-forming
   for this audience and outrank the others.

5. **No archetype passes its thresholds.** Fall back to a generic
   `🎲 The Wildcard` label with the subheader "Still figuring
   out your pattern." This is the documented fallback only — not in the
   library above.

**Combo priority (most-specific first):**
1. The Cathedral Builder *(3 single-archetype criteria all met)*
2. The Pirate *(3 multi-axis criteria)*
3. The Garage Tinkerer *(3 criteria, narrower)*
4. The Stealth Shipper *(2 criteria, distinctive variance)*
5. The Marathoner *(tenure-gated)*

**Single tie-break priority:**

```
Night Owl > Dawn Patrol > Weekend Warrior > The Insomniac > The Sundowner
> The 9-to-5er > The Moonlighter > The Earthquake > The Surgeon
> The Architect > The Sprinter > The Builder > The Polisher
> The Specialist > The Juggler > The Drifter
```

Time archetypes outrank style which outrank portfolio. Tie-break only
fires when scores are within a small epsilon — most users will have a
clear winner.

---

### Empty state for the personality block

| Lifetime digests | Personality display                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **0**            | **Personality block does not render.** Insights page still loads, but this section is hidden until first digest.          |
| **1 – 2**        | "🐣 **Just Getting Started**" placeholder. Subheader: "One more digest and your profile unlocks." No modifier tags.       |
| **3 +**          | Run the full selection algorithm above. Show a real archetype with modifier tags.                                         |

3 digests is the unlock point. Lower than that, the time-of-day pattern is
effectively random and the archetype would feel arbitrary. With 3+, the
user gets a real label — early labels may be noisy, but that's part of
the appeal: the personality shifts as patterns clarify, and watching it
move from "Dawn Patrol" to "Night Owl" as habits solidify *is* the
engagement hook.

No tenure-day requirement. If a user generates 3 digests in their first
day, they get a real archetype that day.

---

### Modifier tags (the row underneath)

Smaller fixed set. These layer on dynamic state info that isn't covered by
the primary archetype.

| Modifier                | Condition                                                    |
| ----------------------- | ------------------------------------------------------------ |
| **On Fire**             | Current streak ≥ 7 days                                      |
| **Comeback Kid**        | Resumed after a 7+ day gap within the last 14 days           |
| **Streak Hunter**       | ≥ 3 distinct streaks of 5+ days, but current streak < 5      |
| **Slow Burn**           | Active 4+ days/week consistently for 30+ days, low volume    |
| **Just Getting Started**| First 14 days of using Scout                                 |
| **Veteran**             | 90+ days using Scout                                         |
| **Polyglot**            | 3+ actively-used repos in last 30 days                       |
| **Loyalist**            | Single repo active for 60+ continuous days                   |

The display picks the **2–3 most distinctive** modifiers for the user (i.e.
the ones whose conditions fire least often across the user base, or fall
back to a fixed priority order).

---

### Selection algorithm

1. Compute the user's signal vector from all the data signals.
2. **Combo archetypes evaluated first.** If all criteria met → that's the
   primary. Combo wins over any single-axis archetype because it's strictly
   more specific.
3. Otherwise, score each non-combo archetype against the signal vector
   (weighted by how distinctive each axis is). Highest score wins.
4. Modifier tags evaluated independently — collect everything that fires,
   pick the top 2–3 by distinctiveness/priority.
5. Compose the display: emoji + archetype name + descriptive line +
   modifier row.

The descriptive line under the archetype name is templated per archetype so
it always grounds the label in real data ("You generate most digests
between 10pm–1am" / "73% of your digests are in askscout" / etc.) — keeps
the label from feeling like astrology.

---

### Combinations and uniqueness

21 primary archetypes × C(8, 3) ≈ 56 modifier triples = **~1,176 unique
display combinations**. Plenty of variety.

---

### Edge cases (beyond the empty-state table above)

- **Currently inactive 7+ days** → show last-known archetype, muted
  styling, "Currently dormant — get back in" subtitle in place of the
  default descriptive line.
- **No archetype passes thresholds (rare, mid-data user)** → fall back to
  `🎲 The Wildcard` with "Still figuring out your pattern"
  subtitle. See selection logic above.

---

## Empty state

Brand-new accounts with zero digests + zero check-ins still get the full
Insights page — entry point is always visible, page always renders. Each
section degrades to a "zero" state rather than disappearing, so the user
can see what they're working toward.

| Section                | Empty-state behavior                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Snapshot row           | Best streak shows `0 days` (no repo line). Total digests shows `0`.                                                   |
| Activity calendar      | Full 365-day grid renders, every cell empty (no activity color). Hover still works ("No activity").                   |
| Per-repo breakdown     | Table renders with the columns and a single empty row reading "No repos with digests yet."                            |
| Engagement personality | Special "Just Getting Started" card — primary trait + subtitle "Generate your first digest to start your profile." No tags. |

Critically: the user **must be able to navigate to and inspect this page
even on day one**. Discovery before content. Showing zeros (vs. hiding the
feature) sets up the "fill these in" mental model that drives engagement.

---

## Data sources

All from existing tables. **No schema changes**, no new tracking, no new
permissions.

| Need                  | Source                                              |
| --------------------- | --------------------------------------------------- |
| Streaks               | `digests` (created_at) + `daily_checkins` (date)    |
| Total digests         | `digests` count by user                             |
| Time-of-day pattern   | `digests.created_at` hour                           |
| Active days (30d)     | union of digest dates + check-in dates              |
| Repo focus            | `digests.repo` distribution                         |
| Trajectory            | streak math on the same active-days set             |
| Activity calendar     | union of digest dates + check-in dates per day      |

---

## Decisions log

These have been considered and explicitly **rejected** so we don't
re-litigate them:

- "Days using Scout" / "Repos Scoutified" as snapshot stats — not
  interesting enough.
- "Your askscout journey" milestone timeline — doesn't read as useful.
- Compare to peers / leaderboards — kills the personal vibe.
- "Most-used modal" / settings recap — boring, mildly creepy.
- Coding stats (lines shipped, language distribution, pace trends, etc.)
  — those belong in the digest, not on this page.

---

## Open questions

- [ ] Entry-point Lucide icon — `BarChart3` / `Sparkles` / `Activity` /
      other? Sits next to the existing settings gear in the header-right
      icon group, same 20px / 1px-stroke treatment.
- [ ] Engagement personality refresh cadence — every visit (live), or
      cached for the session?
- [ ] Mobile layout for the per-repo breakdown table — horizontal scroll,
      collapse to cards, or hide the secondary columns?

### Resolved

- **Page route + title** — `/insights`, page title "Insights".
- **Empty state** — entry point always visible; page renders with zeros
  for brand-new accounts (see "Empty state" section).

---

## Out of scope (for now)

- Year-in-Review / Wrapped seasonal moment — defer until base dashboard ships
  and proves out.
- Public sharing links ("share my stats") — defer until requested.
- Comparison views (this month vs last) — could land as a Phase 2 add.
- Coding-stat versions of any of this — explicitly the digest's job.
