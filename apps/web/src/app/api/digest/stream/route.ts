import { auth } from "@/auth";
import { fetchCommits, fetchDiffs } from "@/lib/github";
import {
  buildStreamingSystemPrompt,
  formatCommitsForPrompt,
  formatDiffsForPrompt,
  computeStats,
} from "@askscout/core";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { owner: string; repo: string };
  const { owner, repo } = body;

  if (!owner || !repo) {
    return Response.json({ error: "Missing owner or repo" }, { status: 400 });
  }

  try {
    // Fetch commits from past 7 days for first run
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const commits = await fetchCommits(session.accessToken, owner, repo, since);

    if (commits.length === 0) {
      return Response.json({ error: "No commits found in the past 7 days" }, { status: 404 });
    }

    const diffs = await fetchDiffs(session.accessToken, owner, repo, commits);

    // Compute stats before streaming (deterministic, no LLM needed)
    const stats = computeStats(commits, diffs);

    // Build prompt
    const systemPrompt = buildStreamingSystemPrompt();
    const context = "No previous context. This is the first run.";

    const userPrompt = `Analyze the following git activity and produce a digest.

## Previous Project Context
${context}

## Recent Commits (${commits.length} total)
${formatCommitsForPrompt(commits)}

## Diffs
${formatDiffsForPrompt(diffs)}

Produce the digest now. Remember: no em dashes, no semicolons. Write like a human.`;

    // Determine which AI provider to use
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    let stream: ReadableStream;

    if (openaiKey) {
      stream = await streamOpenAI(systemPrompt, userPrompt, openaiKey, stats);
    } else if (anthropicKey) {
      stream = await streamAnthropic(systemPrompt, userPrompt, anthropicKey, stats);
    } else {
      return Response.json({ error: "No AI provider configured" }, { status: 500 });
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate digest";
    return Response.json({ error: message }, { status: 500 });
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
  });

  if (!response.ok || !response.body) {
    throw new Error(`OpenAI API error (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      // Send stats immediately
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
        const msg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(new TextEncoder().encode(sseEvent("error", { error: msg })));
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
  });

  if (!response.ok || !response.body) {
    throw new Error(`Anthropic API error (${response.status})`);
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
        const msg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(new TextEncoder().encode(sseEvent("error", { error: msg })));
      } finally {
        controller.close();
      }
    },
  });
}
