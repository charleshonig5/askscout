"use client";

import { useState, useCallback, useRef } from "react";

interface DigestStreamState {
  text: string;
  isStreaming: boolean;
  isDone: boolean;
  error: string | null;
  start: (owner: string, repo: string) => void;
}

export function useDigestStream(): DigestStreamState {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback((owner: string, repo: string) => {
    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Reset state
    setText("");
    setIsStreaming(true);
    setIsDone(false);
    setError(null);

    void (async () => {
      try {
        const res = await fetch("/api/digest/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner, repo }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `Request failed (${res.status})`);
        }

        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              const eventType = line.slice(7);
              // Find the next data line
              const dataLineIdx = lines.indexOf(line) + 1;
              const dataLine = lines[dataLineIdx];

              if (dataLine?.startsWith("data: ")) {
                const data = dataLine.slice(6);
                try {
                  const parsed = JSON.parse(data) as Record<string, unknown>;

                  if (eventType === "text" && typeof parsed.text === "string") {
                    const chunk = parsed.text;
                    setText((prev) => prev + chunk);
                  } else if (eventType === "done") {
                    setIsDone(true);
                    setIsStreaming(false);
                  } else if (eventType === "error" && typeof parsed.error === "string") {
                    throw new Error(parsed.error);
                  }
                } catch (e) {
                  if (e instanceof Error && e.message !== data) throw e;
                }
              }
            }
          }
        }

        setIsDone(true);
        setIsStreaming(false);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setIsStreaming(false);
      }
    })();
  }, []);

  return { text, isStreaming, isDone, error, start };
}
