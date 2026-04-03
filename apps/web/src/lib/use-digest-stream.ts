"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface DigestStats {
  commits: number;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
}

// Drip rate: characters revealed per tick
const CHARS_PER_TICK = 3;
const TICK_INTERVAL_MS = 16; // ~60fps

interface DigestStreamState {
  text: string;
  stats: DigestStats | null;
  isStreaming: boolean;
  isDone: boolean;
  error: string | null;
  start: (owner: string, repo: string, mode?: string) => void;
  reset: () => void;
}

export function useDigestStream(): DigestStreamState {
  const [text, setText] = useState("");
  const [stats, setStats] = useState<DigestStats | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fullTextRef = useRef("");

  // Text buffering: accumulate chunks, reveal gradually
  const bufferRef = useRef("");
  const revealedRef = useRef(0);
  const dripRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamDoneRef = useRef(false);

  const stopDrip = useCallback(() => {
    if (dripRef.current) {
      clearInterval(dripRef.current);
      dripRef.current = null;
    }
  }, []);

  const startDrip = useCallback(() => {
    if (dripRef.current) return;
    dripRef.current = setInterval(() => {
      const buf = bufferRef.current;
      const revealed = revealedRef.current;

      if (revealed >= buf.length) {
        // Buffer drained — if stream is done, finalize
        if (streamDoneRef.current) {
          stopDrip();
          setText(bufferRef.current);
          setIsDone(true);
          setIsStreaming(false);
        }
        return;
      }

      // Reveal next batch of characters
      const next = Math.min(revealed + CHARS_PER_TICK, buf.length);
      revealedRef.current = next;
      setText(buf.slice(0, next));
    }, TICK_INTERVAL_MS);
  }, [stopDrip]);

  // Clean up interval on unmount
  useEffect(() => stopDrip, [stopDrip]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    stopDrip();
    setText("");
    setStats(null);
    fullTextRef.current = "";
    bufferRef.current = "";
    revealedRef.current = 0;
    streamDoneRef.current = false;
    setIsStreaming(false);
    setIsDone(false);
    setError(null);
  }, [stopDrip]);

  const start = useCallback(
    (owner: string, repo: string, mode?: string) => {
      abortRef.current?.abort();
      stopDrip();
      const controller = new AbortController();
      abortRef.current = controller;

      setText("");
      setStats(null);
      setIsStreaming(true);
      setIsDone(false);
      setError(null);
      fullTextRef.current = "";
      bufferRef.current = "";
      revealedRef.current = 0;
      streamDoneRef.current = false;

      void (async () => {
        try {
          const res = await fetch("/api/digest/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ owner, repo, mode }),
            signal: controller.signal,
          });

          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(data.error ?? `Request failed (${res.status})`);
          }

          if (!res.body) throw new Error("No response body");

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let sseBuffer = "";
          let currentEvent = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            sseBuffer += decoder.decode(value, { stream: true });

            // Process complete lines
            while (sseBuffer.includes("\n")) {
              const newlineIdx = sseBuffer.indexOf("\n");
              const line = sseBuffer.slice(0, newlineIdx).trim();
              sseBuffer = sseBuffer.slice(newlineIdx + 1);

              if (line.startsWith("event: ")) {
                currentEvent = line.slice(7);
              } else if (line.startsWith("data: ") && currentEvent) {
                const rawData = line.slice(6);
                try {
                  const parsed = JSON.parse(rawData) as Record<string, unknown>;

                  if (currentEvent === "stats") {
                    setStats(parsed as unknown as DigestStats);
                  } else if (currentEvent === "text" && typeof parsed.text === "string") {
                    const chunk = parsed.text;
                    fullTextRef.current += chunk;
                    bufferRef.current += chunk;
                    startDrip();
                  } else if (currentEvent === "done") {
                    // Mark stream as done — drip will finalize when buffer drains
                    streamDoneRef.current = true;
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

          // If we exit the loop without a done event
          streamDoneRef.current = true;
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          stopDrip();
          setError(err instanceof Error ? err.message : "Something went wrong");
          setIsStreaming(false);
        }
      })();
    },
    [startDrip, stopDrip],
  );

  return { text, stats, isStreaming, isDone, error, start, reset };
}
