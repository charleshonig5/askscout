"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { calculateDelay, advanceBySurrogate } from "./typewriter-pace";

export interface DigestStats {
  commits: number;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
}

// Marks the end of the user-visible digest content. Everything after
// "---STANDUP---" is internal (Standup notes, To-Do plan, AI context, project
// summary) and lives in modals or invisible storage — the drip stops here so
// those internal sections don't accidentally type in. Key Takeaways content
// (between 🔑 and this marker) types in normally as the last visible section.
const CLOSING_MARKER = "---STANDUP---";

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
  const bufferRef = useRef("");
  const revealedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamDoneRef = useRef(false);

  const stopDrip = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dripTick = useCallback(() => {
    const buf = bufferRef.current;
    const revealed = revealedRef.current;

    // Determine the visible end of the stream. If the One Takeaway marker
    // is in the buffer, stop visible reveal there — everything after renders
    // separately after Statistics.
    const closingIdx = buf.indexOf(CLOSING_MARKER);
    const visibleEnd = closingIdx !== -1 ? closingIdx : buf.length;

    if (revealed >= visibleEnd) {
      // We've revealed everything the user should see during streaming
      if (streamDoneRef.current || closingIdx !== -1) {
        // Expose the full buffer so the closing section can parse correctly
        setText(buf);
        setIsDone(true);
        setIsStreaming(false);
        timerRef.current = null;
        return;
      }
      // Stream still active but no content to reveal — wait a bit
      timerRef.current = setTimeout(dripTick, 32);
      return;
    }

    // Handle surrogate pairs: emojis are 2 code units in UTF-16 strings.
    const advance = advanceBySurrogate(buf, revealed);
    const nextRevealed = revealed + advance;

    // The "character" we just revealed (full emoji or single ASCII char)
    const revealedChar = buf.slice(revealed, nextRevealed);
    // Upcoming context for delay calculation (limited to the visible portion)
    const upcoming = buf.slice(nextRevealed, Math.min(nextRevealed + 6, visibleEnd));
    const bufferLead = visibleEnd - revealed;

    revealedRef.current = nextRevealed;
    setText(buf.slice(0, nextRevealed));

    const delay = calculateDelay(revealedChar, upcoming, bufferLead, streamDoneRef.current);
    timerRef.current = setTimeout(dripTick, delay);
  }, []);

  const startDrip = useCallback(() => {
    if (timerRef.current) return;
    // Small opening beat before the first char appears, makes the start feel intentional
    timerRef.current = setTimeout(dripTick, 150);
  }, [dripTick]);

  // Cleanup on unmount
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
