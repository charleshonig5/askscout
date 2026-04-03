import { auth } from "@/auth";
import { fetchCommits, fetchDiffs } from "@/lib/github";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { saveDigest, getLastRunTime } from "@/lib/supabase";
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

  // 2. Rate limiting (per user, by access token hash)
  const userKey = session.accessToken.slice(-10); // last 10 chars as identifier
  const hourly = checkRateLimit(`digest:hour:${userKey}`, RATE_LIMITS.digestPerHour);
  const daily = checkRateLimit(`digest:day:${userKey}`, RATE_LIMITS.digestPerDay);

  if (!hourly.allowed) {
    return Response.json(
      { error: "Rate limit exceeded. You can generate up to 10 digests per hour." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((hourly.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  if (!daily.allowed) {
    return Response.json(
      { error: "Daily limit reached. You can generate up to 30 digests per day." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((daily.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": "0",
        },
      },
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
    const userId = session.user?.id ?? session.user?.email ?? "unknown";
    const repoFullName = `${owner}/${repo}`;
    const lastRun = await getLastRunTime(userId, repoFullName);

    let commits: Awaited<ReturnType<typeof fetchCommits>> = [];

    if (lastRun) {
      // Returning user: since last run, capped at 30 days
      const daysSinceLastRun = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60 * 24);
      const since = daysSinceLastRun <= 30 ? lastRun : null;

      if (since) {
        commits = await fetchCommits(session.accessToken, owner, repo, since);
      }
    }

    // First run or stale last run: fallback chain 24h → 7d → 30d → 90d
    if (commits.length === 0) {
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

    const diffs = await fetchDiffs(session.accessToken, owner, repo, commits);

    // 5. Compute stats from commits (more reliable than diffs which can fail)
    const allFiles = new Set(commits.flatMap((c) => c.filesChanged));
    const linesAdded = commits.reduce((sum, c) => sum + c.additions, 0);
    const linesRemoved = commits.reduce((sum, c) => sum + c.deletions, 0);
    const filesChanged = allFiles.size > 0 ? allFiles.size : diffs.length;

    const stats = {
      commits: commits.length,
      filesChanged,
      linesAdded,
      linesRemoved,
      timeSpan: {
        from: commits[0]!.timestamp,
        to: commits[commits.length - 1]!.timestamp,
      },
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
        score: Math.max(0, Math.min(10, Math.round(10 - Math.min(growthRatio / 4, 10)))),
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
        score: Math.max(0, Math.min(10, Math.round(10 - Math.min(filesPerCommit / 2, 10)))),
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
        score: Math.max(0, Math.min(10, Math.round(10 - Math.min(churnFiles, 12) * 0.8))),
      },
    };

    // 6b. Compute most active files (top 5 by commit frequency)
    const topFiles = [...fileFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([file, count]) => ({ file, commits: count }));

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

    // Include all computed data in stats event
    Object.assign(stats, { health, topFiles, activity: activityBuckets, netImpact });

    // 7. Build unified prompt (generates digest + standup + AI context in one call)
    const systemPrompt = buildUnifiedSystemPrompt();

    // Compact commit list: just hash + message
    const commitList = commits
      .slice(0, 25)
      .map((c) => `- ${c.hash.slice(0, 7)} ${c.message}`)
      .join("\n");

    // Compact file summary: just filenames + line counts, no patches
    const fileSummary = diffs
      .slice(0, 30)
      .map((d) => `- ${d.file} (+${d.additions}/-${d.deletions})`)
      .join("\n");

    const userPrompt = `Analyze the following git activity.

## Stats
${stats.commits} commits, ${stats.filesChanged} files changed, ${stats.linesAdded} lines added, ${stats.linesRemoved} lines removed.

## Commits
${commitList}

## Files Changed
${fileSummary}

Produce the digest now. Be concise. No em dashes, no semicolons.`;

    // 7. Stream from AI provider, save digest on completion
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    const onComplete = (fullText: string) => {
      // Parse the three sections from the unified response
      const digestMatch =
        fullText.split("---DIGEST---")[1]?.split("---STANDUP---")[0]?.trim() ?? fullText;
      const standupMatch =
        fullText.split("---STANDUP---")[1]?.split("---AI_CONTEXT---")[0]?.trim() ?? "";
      const aiContextMatch = fullText.split("---AI_CONTEXT---")[1]?.trim() ?? "";

      // Save all three to Supabase
      void saveDigest(userId, repoFullName, "digest", digestMatch, stats);
      if (standupMatch) void saveDigest(userId, repoFullName, "standup", standupMatch, stats);
      if (aiContextMatch) void saveDigest(userId, repoFullName, "resume", aiContextMatch, stats);
    };

    let stream: ReadableStream;

    if (openaiKey) {
      stream = await streamOpenAI(systemPrompt, userPrompt, openaiKey, stats, onComplete);
    } else if (anthropicKey) {
      stream = await streamAnthropic(systemPrompt, userPrompt, anthropicKey, stats, onComplete);
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
  onComplete?: (fullText: string) => void,
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
      max_completion_tokens: 1024,
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
      controller.enqueue(new TextEncoder().encode(sseEvent("stats", stats)));

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
                controller.enqueue(new TextEncoder().encode(sseEvent("text", { text })));
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

        onComplete?.(fullText);
        controller.enqueue(new TextEncoder().encode(sseEvent("done", {})));
      } catch (err) {
        console.error("OpenAI stream error:", err);
        controller.enqueue(
          new TextEncoder().encode(sseEvent("error", { error: "Stream interrupted" })),
        );
      } finally {
        controller.close();
      }
    },
  });
}

async function streamAnthropic(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  stats: Record<string, unknown>,
  onComplete?: (fullText: string) => void,
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
      controller.enqueue(new TextEncoder().encode(sseEvent("stats", stats)));

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
                controller.enqueue(
                  new TextEncoder().encode(sseEvent("text", { text: parsed.delta.text })),
                );
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

        onComplete?.(fullText);
        controller.enqueue(new TextEncoder().encode(sseEvent("done", {})));
      } catch (err) {
        console.error("Anthropic stream error:", err);
        controller.enqueue(
          new TextEncoder().encode(sseEvent("error", { error: "Stream interrupted" })),
        );
      } finally {
        controller.close();
      }
    },
  });
}
