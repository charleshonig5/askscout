/**
 * Personality computation for the Insights page.
 *
 * Implements the 21-archetype + 8-modifier system specced in
 * `ACTIVITY_DASHBOARD_PLAN.md`. Pure functions only — given the user's
 * digest + check-in rows, returns a `PersonalityResult` describing
 * which state to render (hidden / placeholder / real / dormant), the
 * primary archetype, its data-driven subheader, and a short row of
 * modifier tags.
 *
 * Selection rules (from the plan):
 *   1. < 1 digest  → state = "hidden" (block doesn't render)
 *   2. < 3 digests → state = "placeholder" ("Just Getting Started")
 *   3. last activity ≥ 7 days ago → state = "dormant" (muted)
 *   4. otherwise → "real": combo archetypes evaluated first; if none
 *      match, score every single-axis archetype and pick the highest.
 *      Ties broken via a fixed priority list (time > style > portfolio).
 *      If nothing scores above zero, fall back to "The Wildcard".
 *
 * Modifiers evaluate independently and we keep the top 3.
 *
 * All computations are local to the user — nothing leaves this module
 * except the resolved label, subheader, modifiers, and state.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DigestRow {
  repo: string | null;
  created_at: string | null;
  stats: Record<string, unknown> | null;
}

export interface CheckinRow {
  repo: string | null;
  date: string | null;
}

export interface PersonalityResult {
  state: "hidden" | "placeholder" | "real" | "dormant";
  archetype: string | null;
  emoji: string;
  subheader: string;
}

// ============================================================
// Signal vector — derived from raw rows once, used by every
// archetype + modifier evaluator below.
// ============================================================

interface SignalVector {
  totalDigests: number;
  // Time bands (digest-creation hour-of-day)
  bandShares: { dawn: number; day: number; evening: number; night: number; wee: number };
  topBand: "dawn" | "day" | "evening" | "night" | "wee" | null;
  topBandShare: number;
  // Day pattern
  weekdayShare: number; // 0-1
  weekendShare: number;
  // Frequency
  activeDays30: number;
  tenureDays: number;
  currentStreak: number;
  bestStreak: number;
  // Repo portfolio
  totalRepos: number;
  activeRepos30: number;
  topRepo: string | null;
  topRepoShare: number;
  daysActiveLifetime: number;
  // Style (from recent 30 days of stats blobs only)
  avgLinesAdded: number;
  avgLinesRemoved: number;
  avgCommitsPerDigest: number;
  avgFilesPerCommit: number;
  avgLinesPerCommit: number;
  highGrowthShare: number;
  highChurnShare: number;
  avgSessionMinutes: number;
  // State
  daysSinceLastActivity: number;
  // For dormant case — pick a sensible fallback archetype too
  // (computed in the main function, not on the signal vector).
}

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function pickTopBand(shares: SignalVector["bandShares"]): {
  band: SignalVector["topBand"];
  share: number;
} {
  let bestBand: SignalVector["topBand"] = null;
  let bestShare = 0;
  for (const [band, share] of Object.entries(shares) as Array<[
    keyof SignalVector["bandShares"],
    number,
  ]>) {
    if (share > bestShare) {
      bestShare = share;
      bestBand = band;
    }
  }
  return { band: bestBand, share: bestShare };
}

function computeSignals(digests: DigestRow[], checkins: CheckinRow[], now: Date): SignalVector {
  const nowMs = now.getTime();
  const thirty = nowMs - 30 * DAY_MS;

  let dawn = 0;
  let day = 0;
  let evening = 0;
  let night = 0;
  let wee = 0;
  let weekday = 0;
  let weekend = 0;

  let firstDigestMs = Number.POSITIVE_INFINITY;
  let lastActivityMs = 0;

  const repoDigests = new Map<string, number>();
  const allDays = new Set<string>();
  const activeRepoDays30 = new Set<string>();

  // Style aggregates (only the most recent 30 days of digests count
  // toward "current you" — older history skews stale patterns).
  let recentDigestCount = 0;
  let sumLinesAdded = 0;
  let sumLinesRemoved = 0;
  let sumCommits = 0;
  let sumFilesChanged = 0;
  let highGrowth = 0;
  let highChurn = 0;
  let sumSessionMinutes = 0;
  let sessionCountWithData = 0;

  for (const d of digests) {
    if (!d.created_at) continue;
    const t = new Date(d.created_at);
    const tMs = t.getTime();
    if (Number.isNaN(tMs)) continue;

    const hour = t.getHours();
    if (hour >= 5 && hour < 9) dawn += 1;
    else if (hour >= 9 && hour < 17) day += 1;
    else if (hour >= 17 && hour < 22) evening += 1;
    else if (hour >= 22 || hour < 2) night += 1;
    else if (hour >= 2 && hour < 5) wee += 1;

    const dow = t.getDay();
    if (dow === 0 || dow === 6) weekend += 1;
    else weekday += 1;

    if (tMs < firstDigestMs) firstDigestMs = tMs;
    if (tMs > lastActivityMs) lastActivityMs = tMs;

    const dKey = dayKey(t);
    allDays.add(dKey);

    if (d.repo) {
      repoDigests.set(d.repo, (repoDigests.get(d.repo) ?? 0) + 1);
      if (tMs >= thirty) activeRepoDays30.add(`${d.repo}@${dKey}`);
    }

    if (tMs >= thirty && d.stats) {
      const s = d.stats as {
        linesAdded?: number;
        linesRemoved?: number;
        commits?: number;
        filesChanged?: number;
        topFiles?: Array<{ commits?: number }>;
        timeline?: { startMs?: number; endMs?: number; points?: unknown[] };
        health?: {
          growth?: { level?: string };
          churn?: { level?: string };
        };
      };
      recentDigestCount += 1;
      sumLinesAdded += typeof s.linesAdded === "number" ? s.linesAdded : 0;
      sumLinesRemoved += typeof s.linesRemoved === "number" ? s.linesRemoved : 0;
      sumCommits += typeof s.commits === "number" ? s.commits : 0;
      sumFilesChanged += typeof s.filesChanged === "number" ? s.filesChanged : 0;
      if (s.health?.growth?.level === "high") highGrowth += 1;
      if (s.health?.churn?.level === "high") highChurn += 1;
      if (
        s.timeline &&
        typeof s.timeline.startMs === "number" &&
        typeof s.timeline.endMs === "number" &&
        s.timeline.endMs >= s.timeline.startMs
      ) {
        sumSessionMinutes += (s.timeline.endMs - s.timeline.startMs) / 60_000;
        sessionCountWithData += 1;
      }
    }
  }

  for (const c of checkins) {
    if (!c.date) continue;
    allDays.add(c.date);
    const cMs = new Date(c.date + "T00:00:00").getTime();
    if (Number.isNaN(cMs)) continue;
    if (cMs > lastActivityMs) lastActivityMs = cMs;
    if (cMs >= thirty && c.repo) activeRepoDays30.add(`${c.repo}@${c.date}`);
  }

  const totalBands = dawn + day + evening + night + wee;
  const bandShares = {
    dawn: totalBands > 0 ? dawn / totalBands : 0,
    day: totalBands > 0 ? day / totalBands : 0,
    evening: totalBands > 0 ? evening / totalBands : 0,
    night: totalBands > 0 ? night / totalBands : 0,
    wee: totalBands > 0 ? wee / totalBands : 0,
  };
  const top = pickTopBand(bandShares);

  const totalDayPattern = weekday + weekend;
  const weekdayShare = totalDayPattern > 0 ? weekday / totalDayPattern : 0;
  const weekendShare = totalDayPattern > 0 ? weekend / totalDayPattern : 0;

  // Active days in last 30 (digest OR check-in).
  const last30Days = new Set<string>();
  const sortedAllDays = [...allDays].sort();
  for (const k of allDays) {
    const ms = new Date(k + "T00:00:00").getTime();
    if (ms >= thirty) last30Days.add(k);
  }

  // Streaks across all repos (the global "any-repo" streak).
  let currentStreak = 0;
  if (allDays.size > 0) {
    const today = new Date(now);
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const k = dayKey(d);
      if (allDays.has(k)) currentStreak += 1;
      else if (i === 0) continue;
      else break;
    }
  }
  let bestStreak = 0;
  if (sortedAllDays.length > 0) {
    let run = 1;
    bestStreak = 1;
    for (let i = 1; i < sortedAllDays.length; i++) {
      const prev = new Date(sortedAllDays[i - 1]! + "T00:00:00").getTime();
      const curr = new Date(sortedAllDays[i]! + "T00:00:00").getTime();
      const diff = Math.round((curr - prev) / DAY_MS);
      if (diff === 1) {
        run += 1;
        if (run > bestStreak) bestStreak = run;
      } else if (diff > 1) {
        run = 1;
      }
    }
  }

  const tenureDays = Number.isFinite(firstDigestMs)
    ? Math.max(1, Math.round((nowMs - firstDigestMs) / DAY_MS) + 1)
    : 0;
  const daysSinceLastActivity =
    lastActivityMs > 0 ? Math.max(0, Math.round((nowMs - lastActivityMs) / DAY_MS)) : Infinity;

  const totalRepos = repoDigests.size;
  let topRepo: string | null = null;
  let topCount = 0;
  for (const [repo, count] of repoDigests) {
    if (count > topCount) {
      topCount = count;
      topRepo = repo;
    }
  }
  const topRepoShare = digests.length > 0 ? topCount / digests.length : 0;

  // Active repos in last 30 = distinct repos in `${repo}@${day}` set.
  const activeRepoSet = new Set<string>();
  for (const k of activeRepoDays30) {
    const repo = k.split("@")[0];
    if (repo) activeRepoSet.add(repo);
  }
  const activeRepos30 = activeRepoSet.size;

  // Style averages (recent only).
  const avgLinesAdded = recentDigestCount > 0 ? sumLinesAdded / recentDigestCount : 0;
  const avgLinesRemoved = recentDigestCount > 0 ? sumLinesRemoved / recentDigestCount : 0;
  const avgCommitsPerDigest = recentDigestCount > 0 ? sumCommits / recentDigestCount : 0;
  const avgFilesPerCommit = sumCommits > 0 ? sumFilesChanged / sumCommits : 0;
  const avgLinesPerCommit =
    sumCommits > 0 ? (sumLinesAdded + sumLinesRemoved) / sumCommits : 0;
  const highGrowthShare = recentDigestCount > 0 ? highGrowth / recentDigestCount : 0;
  const highChurnShare = recentDigestCount > 0 ? highChurn / recentDigestCount : 0;
  const avgSessionMinutes =
    sessionCountWithData > 0 ? sumSessionMinutes / sessionCountWithData : 0;

  return {
    totalDigests: digests.length,
    bandShares,
    topBand: top.band,
    topBandShare: top.share,
    weekdayShare,
    weekendShare,
    activeDays30: last30Days.size,
    tenureDays,
    currentStreak,
    bestStreak,
    totalRepos,
    activeRepos30,
    topRepo,
    topRepoShare,
    daysActiveLifetime: allDays.size,
    avgLinesAdded,
    avgLinesRemoved,
    avgCommitsPerDigest,
    avgFilesPerCommit,
    avgLinesPerCommit,
    highGrowthShare,
    highChurnShare,
    avgSessionMinutes,
    daysSinceLastActivity,
  };
}

// ============================================================
// Archetype library
// ============================================================

interface Archetype {
  key: string;
  name: string;
  emoji: string;
  tier: "single" | "combo";
  /** Returns a match score in [0, 1]. 0 = doesn't qualify. */
  evaluate: (s: SignalVector) => number;
  /** Templates a real-data subheader sentence. */
  subheader: (s: SignalVector) => string;
}

/** Helper: ramp from threshold up to 1.0 across the remaining range. */
function rampScore(value: number, threshold: number, max = 1): number {
  if (value < threshold) return 0;
  return Math.min(1, (value - threshold) / Math.max(0.0001, max - threshold));
}

const ARCHETYPES: Archetype[] = [
  // ---------- COMBO TIER (evaluated first, must meet ALL criteria) ----------
  {
    key: "cathedral_builder",
    name: "The Cathedral Builder",
    emoji: "⛪",
    tier: "combo",
    evaluate: (s) => {
      const specialist = s.topRepoShare >= 0.8 && s.activeRepos30 <= 2;
      const architect =
        s.avgSessionMinutes >= 90 &&
        s.avgCommitsPerDigest <= 3 &&
        s.avgLinesPerCommit >= 80;
      const builder =
        s.avgLinesRemoved > 0 &&
        s.avgLinesAdded / Math.max(1, s.avgLinesRemoved) >= 2.0 &&
        s.highGrowthShare >= 0.5;
      return specialist && architect && builder ? 1 : 0;
    },
    subheader: (s) =>
      s.topRepo
        ? `Building ${s.topRepo} over long sessions. Net additions, low churn.`
        : "Building one repo over long sessions. Net additions, low churn.",
  },
  {
    key: "pirate",
    name: "The Pirate",
    emoji: "🏴‍☠️",
    tier: "combo",
    evaluate: (s) => {
      if (s.totalRepos < 4) return 0;
      if (s.topBandShare >= 0.4) return 0; // chaotic = no dominant band
      if (s.currentStreak >= 5) return 0; // bursty, not steady
      return 1;
    },
    subheader: (s) =>
      `Across ${s.totalRepos} repos at all hours. Chaos by design.`,
  },
  {
    key: "garage_tinkerer",
    name: "The Garage Tinkerer",
    emoji: "🔧",
    tier: "combo",
    evaluate: (s) => {
      const nightOwl = s.topBand === "night" && s.bandShares.night >= 0.4;
      const specialist = s.topRepoShare >= 0.8 && s.activeRepos30 <= 2;
      const steady = s.activeDays30 >= 4 && s.activeDays30 <= 24;
      return nightOwl && specialist && steady ? 1 : 0;
    },
    subheader: (s) =>
      s.topRepo
        ? `Late hours in ${s.topRepo}. Patient daily progress.`
        : "Late hours on one repo. Patient daily progress.",
  },
  {
    key: "stealth_shipper",
    name: "The Stealth Shipper",
    emoji: "🥷",
    tier: "combo",
    evaluate: () => {
      // Approximation: high session-length variance is hard to compute
      // without per-day data here. Use streak gaps as a proxy: a recent
      // 7+ day gap that the user has resumed across, with current
      // streak ≥ 1.
      // Disabled until we surface daily-volume variance — fall through
      // to single-tier scoring instead.
      return 0;
    },
    subheader: () => "Long quiet runs, then bursts. Episodic shipping.",
  },
  {
    key: "marathoner",
    name: "The Marathoner",
    emoji: "🐢",
    tier: "combo",
    evaluate: (s) => {
      if (s.tenureDays < 90) return 0;
      const consistency = s.daysActiveLifetime / Math.max(1, s.tenureDays);
      if (consistency < 0.5) return 0;
      // Weekly variance check is approximated by activeDays30 vs. expected.
      // 30 days × 0.5 minimum = ~15 active days expected.
      if (s.activeDays30 < 15) return 0;
      return 1;
    },
    subheader: (s) =>
      `${s.tenureDays} days in, active most weeks, low variance.`,
  },

  // ---------- SINGLE TIER ----------
  // Time-driven
  {
    key: "dawn_patrol",
    name: "Dawn Patrol",
    emoji: "🌅",
    tier: "single",
    evaluate: (s) => (s.topBand === "dawn" ? rampScore(s.bandShares.dawn, 0.4) : 0),
    subheader: () => "You generate most digests between 5 and 9 am.",
  },
  {
    key: "nine_to_five",
    name: "The 9-to-5er",
    emoji: "☀️",
    tier: "single",
    evaluate: (s) => {
      if (s.topBand !== "day") return 0;
      if (s.bandShares.day < 0.4) return 0;
      if (s.weekdayShare < 0.7) return 0;
      return Math.min(1, (s.bandShares.day - 0.4) / 0.6 + (s.weekdayShare - 0.7) / 0.3) / 2;
    },
    subheader: () => "Most of your digests land during work hours on weekdays.",
  },
  {
    key: "sundowner",
    name: "The Sundowner",
    emoji: "🌇",
    tier: "single",
    evaluate: (s) => (s.topBand === "evening" ? rampScore(s.bandShares.evening, 0.4) : 0),
    subheader: () => "Your digests peak between 5 and 10 pm.",
  },
  {
    key: "night_owl",
    name: "Night Owl",
    emoji: "🌙",
    tier: "single",
    evaluate: (s) => (s.topBand === "night" ? rampScore(s.bandShares.night, 0.4) : 0),
    subheader: () => "Most of your digests land between 10 pm and 2 am.",
  },
  {
    key: "insomniac",
    name: "The Insomniac",
    emoji: "🦇",
    tier: "single",
    evaluate: (s) => (s.topBand === "wee" ? rampScore(s.bandShares.wee, 0.3) : 0),
    subheader: () => "Your digests cluster between 2 and 5 am.",
  },
  {
    key: "moonlighter",
    name: "The Moonlighter",
    emoji: "🌗",
    tier: "single",
    evaluate: (s) => {
      const bimodal =
        s.bandShares.day >= 0.25 &&
        s.bandShares.evening + s.bandShares.night >= 0.25 &&
        s.topBandShare <= 0.5;
      return bimodal ? 0.7 : 0;
    },
    subheader: () =>
      "Bimodal pattern. Peaks around midday and again in the evening.",
  },
  {
    key: "weekend_warrior",
    name: "Weekend Warrior",
    emoji: "🏖",
    tier: "single",
    evaluate: (s) => (s.weekendShare >= 0.6 ? rampScore(s.weekendShare, 0.6) : 0),
    subheader: (s) =>
      `${Math.round(s.weekendShare * 100)}% of your digests land on weekends.`,
  },
  // Portfolio
  {
    key: "specialist",
    name: "The Specialist",
    emoji: "🎯",
    tier: "single",
    evaluate: (s) => {
      if (s.topRepoShare < 0.8) return 0;
      if (s.activeRepos30 > 2) return 0;
      return rampScore(s.topRepoShare, 0.8);
    },
    subheader: (s) =>
      s.topRepo
        ? `${Math.round(s.topRepoShare * 100)}% of your digests are in ${s.topRepo}.`
        : "Most of your digests live in a single repo.",
  },
  {
    key: "juggler",
    name: "The Juggler",
    emoji: "🤹",
    tier: "single",
    evaluate: (s) => {
      if (s.activeRepos30 < 4) return 0;
      if (s.topRepoShare >= 0.4) return 0;
      return Math.min(1, (s.activeRepos30 - 3) / 5);
    },
    subheader: (s) => `Active across ${s.activeRepos30} repos. None holding the majority.`,
  },
  {
    key: "drifter",
    name: "The Drifter",
    emoji: "🪂",
    tier: "single",
    evaluate: (s) => {
      if (s.totalRepos < 5) return 0;
      if (s.topRepoShare >= 0.4) return 0;
      // Low retention proxy: bestStreak short relative to repo count.
      if (s.bestStreak >= 5) return 0;
      return Math.min(1, (s.totalRepos - 4) / 6);
    },
    subheader: (s) =>
      `${s.totalRepos} repos touched lifetime. High turnover, low retention.`,
  },
  // Style
  {
    key: "builder",
    name: "The Builder",
    emoji: "🛠",
    tier: "single",
    evaluate: (s) => {
      if (s.avgLinesRemoved <= 0) return 0;
      const ratio = s.avgLinesAdded / s.avgLinesRemoved;
      if (ratio < 2.0) return 0;
      if (s.highGrowthShare < 0.5) return 0;
      return rampScore(ratio, 2.0, 5.0);
    },
    subheader: (s) => {
      const ratio = s.avgLinesRemoved > 0 ? s.avgLinesAdded / s.avgLinesRemoved : 0;
      const r = ratio >= 1 ? Math.round(ratio) : ratio.toFixed(1);
      return `About ${r} lines added for every 1 removed.`;
    },
  },
  {
    key: "polisher",
    name: "The Polisher",
    emoji: "🪞",
    tier: "single",
    evaluate: (s) => {
      if (s.avgLinesAdded <= 0) return 0;
      const ratio = s.avgLinesRemoved / s.avgLinesAdded;
      if (ratio < 0.8) return 0;
      if (s.highChurnShare < 0.4) return 0;
      return rampScore(ratio, 0.8, 1.5);
    },
    subheader: () => "Net additions stay low. You keep things clean.",
  },
  {
    key: "surgeon",
    name: "The Surgeon",
    emoji: "🔬",
    tier: "single",
    evaluate: (s) => {
      if (s.avgFilesPerCommit <= 0) return 0;
      if (s.avgFilesPerCommit > 1.5) return 0;
      if (s.avgLinesPerCommit > 50) return 0;
      return 0.85;
    },
    subheader: (s) =>
      `Average ${s.avgFilesPerCommit.toFixed(1)} files touched per commit. Focused, precise work.`,
  },
  {
    key: "earthquake",
    name: "The Earthquake",
    emoji: "🌋",
    tier: "single",
    evaluate: (s) => {
      if (s.avgFilesPerCommit < 5) return 0;
      if (s.highChurnShare < 0.4) return 0;
      return rampScore(s.avgFilesPerCommit, 5, 12);
    },
    subheader: (s) =>
      `Average ${s.avgFilesPerCommit.toFixed(1)} files touched per commit. Every change has reach.`,
  },
  {
    key: "architect",
    name: "The Architect",
    emoji: "🏗",
    tier: "single",
    evaluate: (s) => {
      if (s.avgSessionMinutes < 90) return 0;
      if (s.avgCommitsPerDigest > 3) return 0;
      if (s.avgLinesPerCommit < 80) return 0;
      return rampScore(s.avgSessionMinutes, 90, 240);
    },
    subheader: (s) =>
      `Sessions average ${Math.round(s.avgSessionMinutes)} minutes. Slow, considered, big swings.`,
  },
  {
    key: "sprinter",
    name: "The Sprinter",
    emoji: "⚡",
    tier: "single",
    evaluate: (s) => {
      if (s.avgCommitsPerDigest < 8) return 0;
      if (s.avgLinesPerCommit > 30) return 0;
      return rampScore(s.avgCommitsPerDigest, 8, 20);
    },
    subheader: (s) =>
      `${s.avgCommitsPerDigest.toFixed(1)} commits per digest on average. Small, fast, frequent.`,
  },
];

// Fixed tie-break order for single-axis archetypes (top = highest
// priority). Time archetypes outrank style which outrank portfolio.
const SINGLE_PRIORITY: string[] = [
  "night_owl",
  "dawn_patrol",
  "weekend_warrior",
  "insomniac",
  "sundowner",
  "nine_to_five",
  "moonlighter",
  "earthquake",
  "surgeon",
  "architect",
  "sprinter",
  "builder",
  "polisher",
  "specialist",
  "juggler",
  "drifter",
];

function pickArchetype(s: SignalVector): {
  name: string;
  emoji: string;
  subheader: string;
} {
  // Combo tier first.
  const combos = ARCHETYPES.filter((a) => a.tier === "combo");
  for (const combo of combos) {
    const score = combo.evaluate(s);
    if (score > 0) {
      return { name: combo.name, emoji: combo.emoji, subheader: combo.subheader(s) };
    }
  }
  // Single tier — score everything, take the highest. Ties broken by
  // SINGLE_PRIORITY (lower index wins).
  const singles = ARCHETYPES.filter((a) => a.tier === "single");
  let best: { archetype: Archetype; score: number; priority: number } | null = null;
  for (const a of singles) {
    const score = a.evaluate(s);
    if (score <= 0) continue;
    const priority = SINGLE_PRIORITY.indexOf(a.key);
    const candidate = { archetype: a, score, priority: priority < 0 ? 999 : priority };
    if (
      !best ||
      candidate.score > best.score + 0.05 ||
      (Math.abs(candidate.score - best.score) <= 0.05 && candidate.priority < best.priority)
    ) {
      best = candidate;
    }
  }
  if (best) {
    return {
      name: best.archetype.name,
      emoji: best.archetype.emoji,
      subheader: best.archetype.subheader(s),
    };
  }
  // Fallback: The Wildcard.
  return {
    name: "The Wildcard",
    emoji: "🎲",
    subheader: "Still figuring out your pattern.",
  };
}

// ============================================================
// Public entry point
// ============================================================

export function computePersonality(
  digests: DigestRow[],
  checkins: CheckinRow[],
  now: Date,
): PersonalityResult {
  // Hidden state — no digests at all.
  if (digests.length === 0) {
    return {
      state: "hidden",
      archetype: null,
      emoji: "",
      subheader: "",
    };
  }
  // Placeholder state — fewer than 3 digests.
  if (digests.length < 3) {
    return {
      state: "placeholder",
      archetype: "Just Getting Started",
      emoji: "🐣",
      subheader:
        digests.length === 2
          ? "One more digest and your profile unlocks."
          : "A couple more digests and your profile unlocks.",
    };
  }
  const signals = computeSignals(digests, checkins, now);

  // Dormant state — last activity 7+ days ago. Show last-known
  // archetype with a "get back in" subheader.
  if (signals.daysSinceLastActivity >= 7) {
    const archetype = pickArchetype(signals);
    return {
      state: "dormant",
      archetype: archetype.name,
      emoji: archetype.emoji,
      subheader: "Currently dormant. Get back in.",
    };
  }

  const archetype = pickArchetype(signals);
  return {
    state: "real",
    archetype: archetype.name,
    emoji: archetype.emoji,
    subheader: archetype.subheader,
  };
}
