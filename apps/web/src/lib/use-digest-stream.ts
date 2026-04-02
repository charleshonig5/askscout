"use client";

import { useState, useCallback, useRef } from "react";

interface DigestStreamState {
  text: string;
  isStreaming: boolean;
  isDone: boolean;
  error: string | null;
  start: (owner: string, repo: string) => void;
  reset: () => void;
}

export function useDigestStream(): DigestStreamState {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setText("");
    setIsStreaming(false);
    setIsDone(false);
    setError(null);
  }, []);

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
        let currentEvent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          while (buffer.includes("\n")) {
            const newlineIdx = buffer.indexOf("\n");
            const line = buffer.slice(0, newlineIdx).trim();
            buffer = buffer.slice(newlineIdx + 1);

            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7);
            } else if (line.startsWith("data: ") && currentEvent) {
              const rawData = line.slice(6);
              try {
                const parsed = JSON.parse(rawData) as Record<string, unknown>;

                if (currentEvent === "text" && typeof parsed.text === "string") {
                  const chunk = parsed.text;
                  setText((prev) => prev + chunk);
                } else if (currentEvent === "done") {
                  setIsDone(true);
                  setIsStreaming(false);
                } else if (currentEvent === "error" && typeof parsed.error === "string") {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                if (e instanceof Error && e.message !== rawData) throw e;
              }
              currentEvent = "";
            }
          }
        }

        // If we exit the loop without a done event, mark as done
        setIsDone(true);
        setIsStreaming(false);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setIsStreaming(false);
      }
    })();
  }, []);

  return { text, isStreaming, isDone, error, start, reset };
}
