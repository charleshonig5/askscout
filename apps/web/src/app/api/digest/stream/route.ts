/**
 * Digest generation streaming endpoint.
 *
 * Uses buildUnifiedSystemPrompt() from @askscout/core for the system prompt
 * (shared tone, format, and rules). The user prompt is built here because
 * it uses web-specific data: Supabase project context, GitHub API commit
 * format, sanitized patches, and churn data.
 *
 * See packages/core/src/summarize.ts for the architecture note on how the
 * CLI and web AI paths relate.
 */
import { auth, getUserId } from "@/auth";
import { fetchCommits, fetchDiffs } from "@/lib/github";
import { checkDigestRateLimit } from "@/lib/rate-limit";
import {
  saveDigest,
  getLastRunTime,
  getDigestHistory,
  getProjectSummary,
  saveProjectSummary,
} from "@/lib/supabase";
import { buildUnifiedSystemPrompt } from "@askscout/core";

export const maxDuration = 60;

// Valid GitHub username/repo pattern
const GITHUB_NAME_PATTERN = /^[a-zA-Z0-9._-]{1,100}$/;

export async function POST(req: Request) {
  // 1. Auth check
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Rate limiting — Supabase-backed (persists across instances)
  const rateLimitId = session.user?.id ?? session.user?.email ?? "anon";
  const { hourly, daily } = await checkDigestRateLimit(rateLimitId);

  if (!hourly.allowed) {
    return Response.json(
      { error: "Rate limit exceeded. You can generate up to 10 digests per hour." },
      { status: 429 },
    );
  }

  if (!daily.allowed) {
    return Response.json(
      { error: "Daily limit reached. You can generate up to 30 digests per day." },
      { status: 429 },
    );
  }

  // 3. Parse and validate input
  let body: { owner?: string; repo?: string; mode?: string };
  try {
    body = (await req.json()) as { owner?: string; repo?: string; mode?: string };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { owner, repo } = body;

  if (!owner || !repo) {
    return Response.json({ error: "Missing owner or repo" }, { status: 400 });
  }

  if (!GITHUB_NAME_PATTERN.test(owner) || !GITHUB_NAME_PATTERN.test(repo)) {
    return Response.json({ error: "Invalid owner or repo name" }, { status: 400 });
  }

  try {
    // 4. Determine time range: returning user vs first run
    const userId = getUserId(session);
    if (!userId) {
      return Response.json({ error: "Unable to identify user" }, { status: 401 });
    }
    const repoFullName = `${owner}/${repo}`;
    const [lastRun, projectContext] = await Promise.all([
      getLastRunTime(userId, repoFullName),
      getProjectSummary(userId, repoFullName),
    ]);

    let commits: Awaited<ReturnType<typeof fetchCommits>> = [];

    if (lastRun) {
      // Returning user: since last run, capped at 30 days
      const daysSinceLastRun = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceLastRun <= 30) {
        // Recent returning user — only show new commits since last run
        commits = await fetchCommits(session.accessToken, owner, repo, lastRun);
        if (commits.length === 0) {
          return Response.json({ error: "No new commits since your last digest" }, { status: 404 });
        }
      } else {
        // Stale user (30+ days) — treat like first run
        const FALLBACK_DAYS = [7, 30, 90] as const;
        for (const days of FALLBACK_DAYS) {
          commits = await fetchCommits(
            session.accessToken,
            owner,
            repo,
            new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          );
          if (commits.length > 0) break;
        }
      }
    } else {
      // First run: fallback chain 24h → 7d → 30d → 90d
      const FALLBACK_DAYS = [1, 7, 30, 90] as const;
      for (const days of FALLBACK_DAYS) {
        commits = await fetchCommits(
          session.accessToken,
          owner,
          repo,
          new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        );
        if (commits.length > 0) break;
      }
    }

    if (commits.length === 0) {
      return Response.json({ error: "No commits found in the past 90 days" }, { status: 404 });
    }

    const {
      diffs,
      filesAdded,
      filesRemoved: filesDeleted,
    } = await fetchDiffs(session.accessToken, owner, repo, commits);

    // 5. Compute stats from commits (more reliable than diffs which can fail)
    const allFiles = new Set(commits.flatMap((c) => c.filesChanged));
    const linesAdded = commits.reduce((sum, c) => sum + c.additions, 0);
    const linesRemoved = commits.reduce((sum, c) => sum + c.deletions, 0);
    const filesChanged = allFiles.size > 0 ? allFiles.size : diffs.length;

    // Detect coding sessions: cluster commits within 30 min of each other
    const SESSION_GAP_MS = 30 * 60 * 1000;
    const sortedTimestamps = commits.map((c) => c.timestamp.getTime()).sort((a, b) => a - b);

    const sessions: string[] = [];
    const activeDaySet = new Set<string>();
    let sessionStart = sortedTimestamps[0]!;

    for (let i = 0; i < sortedTimestamps.length; i++) {
      const ts = sortedTimestamps[i]!;
      const d = new Date(ts);
      activeDaySet.add(d.toLocaleDateString("en-US", { weekday: "short" }));

      const next = sortedTimestamps[i + 1];
      if (!next || next - ts > SESSION_GAP_MS) {
        // End of session — record the start time as the session marker
        sessions.push(new Date(sessionStart).toISOString());
        if (next) sessionStart = next;
      }
    }

    const singleDay =
      new Date(sortedTimestamps[0]!).toDateString() ===
      new Date(sortedTimestamps[sortedTimestamps.length - 1]!).toDateString();

    const stats = {
      commits: commits.length,
      filesChanged,
      linesAdded,
      linesRemoved,
      filesAdded,
      filesDeleted,
      sessions,
      activeDays: singleDay ? [] : [...activeDaySet],
    };

    // 6. Compute codebase health (deterministic, data-driven)
    const growthRatio = linesRemoved > 0 ? linesAdded / linesRemoved : linesAdded > 0 ? 99 : 1;
    const filesPerCommit =
      commits.length > 0
        ? commits.reduce((sum, c) => sum + c.filesChanged.length, 0) / commits.length
        : 0;

    // Churn: count files that appear in 3+ commits
    const fileFrequency = new Map<string, number>();
    for (const c of commits) {
      for (const f of c.filesChanged) {
        fileFrequency.set(f, (fileFrequency.get(f) ?? 0) + 1);
      }
    }
    const churnFiles = [...fileFrequency.entries()].filter(([, count]) => count >= 3).length;

    const health = {
      growth: {
        ratio: Math.round(growthRatio * 10) / 10,
        added: linesAdded,
        removed: linesRemoved,
        level:
          growthRatio <= 3
            ? "Lean"
            : growthRatio <= 8
              ? "Steady"
              : growthRatio <= 20
                ? "Growing"
                : growthRatio <= 40
                  ? "Heavy"
                  : "Ballooning",
      },
      focus: {
        filesPerCommit: Math.round(filesPerCommit * 10) / 10,
        level:
          filesPerCommit <= 3
            ? "Tight"
            : filesPerCommit <= 6
              ? "Sharp"
              : filesPerCommit <= 12
                ? "Moderate"
                : filesPerCommit <= 20
                  ? "Wide"
                  : "Scattered",
      },
      churn: {
        files: churnFiles,
        level:
          churnFiles === 0
            ? "Clean"
            : churnFiles <= 3
              ? "Minimal"
              : churnFiles <= 7
                ? "Moderate"
                : churnFiles <= 12
                  ? "Noisy"
                  : "High",
      },
    };

    // 6b. Compute most active files (top 3 by commit frequency, with line stats)
    const fileStats = new Map<string, { added: number; removed: number }>();
    for (const d of diffs) {
      const existing = fileStats.get(d.file) ?? { added: 0, removed: 0 };
      existing.added += d.additions;
      existing.removed += d.deletions;
      fileStats.set(d.file, existing);
    }

    const topFiles = [...fileFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([file, count]) => {
        const s = fileStats.get(file);
        return { file, commits: count, added: s?.added ?? 0, removed: s?.removed ?? 0 };
      });

    // 6c. Compute activity chart (commit count per time bucket)
    const timeSpanMs =
      commits[commits.length - 1]!.timestamp.getTime() - commits[0]!.timestamp.getTime();
    const timeSpanDays = timeSpanMs / (1000 * 60 * 60 * 24);

    let activityBuckets: { label: string; count: number }[];

    if (timeSpanDays <= 1.5) {
      // Hourly buckets for ≤1.5 days
      const hours = new Array(24).fill(0) as number[];
      for (const c of commits) {
        const h = c.timestamp.getHours();
        hours[h] = (hours[h] ?? 0) + 1;
      }
      activityBuckets = hours.map((count, h) => ({
        label: h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`,
        count,
      }));
    } else if (timeSpanDays <= 10) {
      // Daily buckets for ≤10 days
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayMap = new Map<string, number>();
      for (const c of commits) {
        const key = c.timestamp.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
      }
      // Build buckets for each day in the range
      const startDate = new Date(commits[0]!.timestamp);
      startDate.setHours(0, 0, 0, 0);
      activityBuckets = [];
      for (
        let d = new Date(startDate);
        d <= commits[commits.length - 1]!.timestamp;
        d.setDate(d.getDate() + 1)
      ) {
        const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        activityBuckets.push({
          label: dayNames[d.getDay()]!,
          count: dayMap.get(key) ?? 0,
        });
      }
    } else {
      // Weekly buckets for longer periods
      const weekMap = new Map<number, number>();
      const startTime = commits[0]!.timestamp.getTime();
      for (const c of commits) {
        const weekNum = Math.floor((c.timestamp.getTime() - startTime) / (7 * 24 * 60 * 60 * 1000));
        weekMap.set(weekNum, (weekMap.get(weekNum) ?? 0) + 1);
      }
      const totalWeeks = Math.ceil(timeSpanDays / 7);
      activityBuckets = [];
      for (let w = 0; w < totalWeeks; w++) {
        activityBuckets.push({
          label: `W${w + 1}`,
          count: weekMap.get(w) ?? 0,
        });
      }
    }

    // 6d. Net impact
    const netImpact = linesAdded - linesRemoved;

    // 6e. Compute pace from digest history (needs 3+ past digests)
    let pace: {
      multiplier: number;
      label: string;
      todayCommits: number;
      avgCommits: number;
    } | null = null;
    const history = await getDigestHistory(userId, repoFullName);
    // Exclude today's entry if it exists, use only past digests
    const pastDigests = history.filter((h) => {
      const d = new Date(h.created_at);
      return d.toDateString() !== new Date().toDateString();
    });

    // Only show pace for roughly single-day digests (under 36 hours)
    const commitSpanHours =
      (sortedTimestamps[sortedTimestamps.length - 1]! - sortedTimestamps[0]!) / (1000 * 60 * 60);

    if (pastDigests.length >= 3 && commitSpanHours <= 36) {
      const avgCommits =
        pastDigests.reduce((sum, h) => {
          const s = h.stats as Record<string, number> | null;
          return sum + (s?.commits ?? 0);
        }, 0) / pastDigests.length;

      if (avgCommits > 0) {
        const multiplier = Math.round((stats.commits / avgCommits) * 10) / 10;
        const roundedAvg = Math.round(avgCommits);
        let label: string;
        if (multiplier >= 4) label = "Whatever's in that water, keep drinking it.";
        else if (multiplier >= 3)
          label = "You tripled your usual output. Scout is genuinely impressed.";
        else if (multiplier >= 2)
          label = "Twice your usual pace. That's not a fluke, that's focus.";
        else if (multiplier >= 1.3) label = "A little faster than usual. Good rhythm today.";
        else if (multiplier >= 0.8) label = "Right in your groove. Steady as always.";
        else if (multiplier >= 0.5) label = "Lighter day. Not every day needs to be a marathon.";
        else label = "Quiet one. Not much shipped today.";
        pace = { multiplier, label, todayCommits: stats.commits, avgCommits: roundedAvg };
      }
    }

    // 6f. When You Coded — timeline of commits across the day.
    // Mirrors Pace Check guards: only single-day digests (<= 36 hours).
    // Handles single-commit case gracefully (startMs === endMs).
    let timeline: {
      startMs: number;
      endMs: number;
      points: Array<{ timeMs: number; lines: number; added: number; removed: number }>;
    } | null = null;
    if (commits.length > 0 && commitSpanHours <= 36) {
      const points = commits
        .map((c) => ({
          timeMs: c.timestamp.getTime(),
          // `lines` = total change, used for bar-height scaling. `added` and
          // `removed` are kept separately for the tooltip so users see the
          // same +X / -Y split that TopFiles and StatsCards use everywhere else.
          lines: c.additions + c.deletions,
          added: c.additions,
          removed: c.deletions,
        }))
        .sort((a, b) => a.timeMs - b.timeMs);
      timeline = {
        startMs: points[0]!.timeMs,
        endMs: points[points.length - 1]!.timeMs,
        points,
      };
    }

    // Include all computed data in stats event
    Object.assign(stats, {
      health,
      topFiles,
      activity: activityBuckets,
      netImpact,
      pace,
      timeline,
    });

    // 7. Build unified prompt (generates digest + standup + AI context in one call)
    const systemPrompt = buildUnifiedSystemPrompt();

    // Commit list: chronological order with timestamps so the LLM
    // understands what happened first vs last, and can detect reverts.
    const chronological = [...commits].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    const commitList = chronological
      .slice(-25)
      .map((c, i) => {
        const time = c.timestamp.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
        return `${i + 1}. [${time}] ${c.hash.slice(0, 7)} ${c.message}`;
      })
      .join("\n");

    // File changes with actual diff patches so the LLM can see WHAT changed.
    // Sanitize patches: strip non-printable chars, cap per-file size, limit total.
    const MAX_PATCH_PER_FILE = 800;
    const MAX_TOTAL_PATCH = 8000;
    let totalPatchChars = 0;

    const fileSummary = diffs
      .slice(0, 15)
      .map((d) => {
        let entry = `### ${d.file} (+${d.additions}/-${d.deletions})`;
        if (d.patch && totalPatchChars < MAX_TOTAL_PATCH) {
          // Sanitize: strip non-printable chars except newlines/tabs
          // eslint-disable-next-line no-control-regex
          let clean = d.patch.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
          // Cap per-file
          if (clean.length > MAX_PATCH_PER_FILE) {
            clean = clean.slice(0, MAX_PATCH_PER_FILE) + "\n... (truncated)";
          }
          // Cap total
          if (totalPatchChars + clean.length > MAX_TOTAL_PATCH) {
            clean = clean.slice(0, MAX_TOTAL_PATCH - totalPatchChars) + "\n... (truncated)";
          }
          totalPatchChars += clean.length;
          entry += `\n${clean}`;
        }
        return entry;
      })
      .join("\n\n");

    // Build churn data for the LLM
    const churnList = [...fileFrequency.entries()]
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([file, count]) => `- ${file} (${count} commits)`)
      .join("\n");

    const previousContext = projectContext?.summary
      ? projectContext.summary
      : "No previous context. This is the first run for this project.";

    const userPrompt = `Analyze the following git activity.

## Previous Project Context
${previousContext}

## Stats
${stats.commits} commits, ${stats.filesChanged} files changed, ${stats.linesAdded} lines added, ${stats.linesRemoved} lines removed.

## Commits (in chronological order, earliest first)
${commitList}

IMPORTANT: The commits above are in TIME ORDER. The LAST commits are what the user was working on most recently, so use those for Left Off. If something was built then reverted (or fixed then broken again), only the FINAL state matters for Shipped/Changed. If a revert appears after a feature commit, that feature was NOT shipped.

## What Changed (file diffs)
Use these diffs to understand WHAT was actually built, changed, or fixed. Don't just rely on commit messages. The code tells the real story.

${fileSummary}
${churnList ? `\n## Churn (files edited 3+ times — these are your Still Shifting candidates)\n${churnList}` : ""}

Produce the digest now. Be concise. No em dashes, no semicolons.`;

    // 7. Stream from AI provider, save digest on completion
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // Two-phase save:
    // 1. onDigestReady: fires as soon as ---SUMMARY--- marker is seen in the
    //    buffer. At this point we have all user-facing sections (digest,
    //    standup, plan, ai_context). Save the digest immediately so we don't
    //    lose it if the client aborts the stream (e.g., switches repos before
    //    the summary section finishes streaming).
    // 2. onStreamEnd: fires only when the stream completes naturally. Saves
    //    the updated project summary for next run.
    let digestSaved = false;
    const onDigestReady = (fullText: string) => {
      if (digestSaved) return;
      digestSaved = true;
      const summaryIdx = fullText.indexOf("---SUMMARY---");
      const digestText = summaryIdx !== -1 ? fullText.slice(0, summaryIdx).trim() : fullText;
      void saveDigest(userId, repoFullName, "digest", digestText, stats);
    };

    const onStreamEnd = (fullText: string) => {
      // Final save of the digest in case ---SUMMARY--- never appeared
      onDigestReady(fullText);
      // Save the project summary if the LLM produced it
      const summaryIdx = fullText.indexOf("---SUMMARY---");
      if (summaryIdx !== -1) {
        const updatedSummary = fullText.slice(summaryIdx + "---SUMMARY---".length).trim();
        if (updatedSummary) {
          void saveProjectSummary(userId, repoFullName, updatedSummary);
        }
      }
    };

    let stream: ReadableStream;

    if (openaiKey) {
      stream = await streamOpenAI(
        systemPrompt,
        userPrompt,
        openaiKey,
        stats,
        onDigestReady,
        onStreamEnd,
      );
    } else if (anthropicKey) {
      stream = await streamAnthropic(
        systemPrompt,
        userPrompt,
        anthropicKey,
        stats,
        onDigestReady,
        onStreamEnd,
      );
    } else {
      return Response.json({ error: "Service unavailable" }, { status: 503 });
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store",
        Connection: "keep-alive",
        "X-RateLimit-Remaining": String(Math.min(hourly.remaining, daily.remaining)),
      },
    });
  } catch (err) {
    // Sanitize error: never leak GitHub API details or internal paths
    console.error("Digest generation error:", err);
    return Response.json(
      { error: "Failed to generate digest. Please try again." },
      { status: 500 },
    );
  }
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function streamOpenAI(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  stats: Record<string, unknown>,
  onDigestReady?: (fullText: string) => void,
  onStreamEnd?: (fullText: string) => void,
): Promise<ReadableStream> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5.4-nano",
      stream: true,
      max_completion_tokens: 2048,
      temperature: 0.2,
      frequency_penalty: 0.8,
      presence_penalty: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    console.error(`OpenAI API error (${response.status}):`, errBody.slice(0, 500));
    throw new Error("AI service error");
  }

  if (!response.body) {
    throw new Error("No response body from AI service");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      // Track whether the client is still listening. When they disconnect
      // (e.g., switch repos), enqueue throws and we set this to false.
      // We KEEP reading from the LLM regardless so the digest still saves.
      let clientConnected = true;
      const safeEnqueue = (data: Uint8Array) => {
        if (!clientConnected) return;
        try {
          controller.enqueue(data);
        } catch {
          clientConnected = false;
        }
      };
      const safeClose = () => {
        if (!clientConnected) return;
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      safeEnqueue(new TextEncoder().encode(sseEvent("stats", stats)));

      let buffer = "";
      let fullText = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data) as {
                choices: { delta: { content?: string } }[];
              };
              const text = parsed.choices[0]?.delta?.content;
              if (text) {
                fullText += text;
                safeEnqueue(new TextEncoder().encode(sseEvent("text", { text })));
                // Save the digest as soon as we see the SUMMARY marker — we have
                // everything user-facing at this point.
                if (fullText.includes("---SUMMARY---")) {
                  onDigestReady?.(fullText);
                }
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

        // Stream completed naturally — save full result
        onStreamEnd?.(fullText);
        safeEnqueue(new TextEncoder().encode(sseEvent("done", {})));
      } catch (err) {
        console.error("OpenAI stream error:", err);
        // LLM error or upstream issue — try to save whatever we have
        if (fullText.length > 0) {
          onStreamEnd?.(fullText);
        }
        safeEnqueue(new TextEncoder().encode(sseEvent("error", { error: "Stream interrupted" })));
      } finally {
        safeClose();
      }
    },
  });
}

async function streamAnthropic(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  stats: Record<string, unknown>,
  onDigestReady?: (fullText: string) => void,
  onStreamEnd?: (fullText: string) => void,
): Promise<ReadableStream> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20250414",
      stream: true,
      max_tokens: 2048,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok || !response.body) {
    throw new Error("AI service error");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      // Track whether the client is still listening. When they disconnect
      // (e.g., switch repos), enqueue throws and we set this to false.
      // We KEEP reading from the LLM regardless so the digest still saves.
      let clientConnected = true;
      const safeEnqueue = (data: Uint8Array) => {
        if (!clientConnected) return;
        try {
          controller.enqueue(data);
        } catch {
          clientConnected = false;
        }
      };
      const safeClose = () => {
        if (!clientConnected) return;
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      safeEnqueue(new TextEncoder().encode(sseEvent("stats", stats)));

      let buffer = "";
      let fullText = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            try {
              const parsed = JSON.parse(line.slice(6)) as {
                type: string;
                delta?: { type: string; text?: string };
              };
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                fullText += parsed.delta.text;
                safeEnqueue(
                  new TextEncoder().encode(sseEvent("text", { text: parsed.delta.text })),
                );
                // Save the digest as soon as we see the SUMMARY marker — we have
                // everything user-facing at this point.
                if (fullText.includes("---SUMMARY---")) {
                  onDigestReady?.(fullText);
                }
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

        // Stream completed naturally — save full result
        onStreamEnd?.(fullText);
        safeEnqueue(new TextEncoder().encode(sseEvent("done", {})));
      } catch (err) {
        console.error("Anthropic stream error:", err);
        // LLM error or upstream issue — try to save whatever we have
        if (fullText.length > 0) {
          onStreamEnd?.(fullText);
        }
        safeEnqueue(new TextEncoder().encode(sseEvent("error", { error: "Stream interrupted" })));
      } finally {
        safeClose();
      }
    },
  });
}
