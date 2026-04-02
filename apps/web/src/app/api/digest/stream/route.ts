import { auth } from "@/auth";
import { fetchCommits, fetchDiffs } from "@/lib/github";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  buildStreamingSystemPrompt,
  formatCommitsForPrompt,
  formatDiffsForPrompt,
  computeStats,
} from "@askscout/core";

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
  let body: { owner?: string; repo?: string };
  try {
    body = (await req.json()) as { owner?: string; repo?: string };
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
    // 4. Fetch commits from past 7 days
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const commits = await fetchCommits(session.accessToken, owner, repo, since);

    if (commits.length === 0) {
      return Response.json({ error: "No commits found in the past 7 days" }, { status: 404 });
    }

    const diffs = await fetchDiffs(session.accessToken, owner, repo, commits);

    // 5. Compute stats (deterministic, no LLM needed)
    const stats = computeStats(commits, diffs);

    // 6. Build prompt
    const systemPrompt = buildStreamingSystemPrompt();
    const userPrompt = `Analyze the following git activity and produce a digest.

## Previous Project Context
No previous context. This is the first run.

## Recent Commits (${commits.length} total)
${formatCommitsForPrompt(commits)}

## Diffs
${formatDiffsForPrompt(diffs)}

Produce the digest now. Remember: no em dashes, no semicolons. Write like a human.`;

    // 7. Stream from AI provider
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    let stream: ReadableStream;

    if (openaiKey) {
      stream = await streamOpenAI(systemPrompt, userPrompt, openaiKey, stats);
    } else if (anthropicKey) {
      stream = await streamAnthropic(systemPrompt, userPrompt, anthropicKey, stats);
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
  stats: ReturnType<typeof computeStats>,
): Promise<ReadableStream> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      stream: true,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
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
                controller.enqueue(new TextEncoder().encode(sseEvent("text", { text })));
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

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
  stats: ReturnType<typeof computeStats>,
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
                controller.enqueue(
                  new TextEncoder().encode(sseEvent("text", { text: parsed.delta.text })),
                );
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

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
