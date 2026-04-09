"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface DigestStats {
  commits: number;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
}

// Variable pacing constants — designed for a premium, natural feel
const BASE_CHAR_DELAY_MS = 14; // ~70 chars/sec baseline
const SENTENCE_PAUSE_MS = 260;
const CLAUSE_PAUSE_MS = 80;
const LINE_BREAK_MS = 110;
const PARAGRAPH_PAUSE_MS = 380;
const SECTION_PAUSE_MS = 450;
const MIN_DELAY_MS = 2;

// Emojis that start a new digest section — trigger a longer pause before them
const SECTION_EMOJI_PATTERN = /[\u{1F4AC}\u{1F680}\u{1F527}\u{1F501}\u{1F4CD}\u{1F415}]/u;

interface DigestStreamState {
  text: string;
  stats: DigestStats | null;
  isStreaming: boolean;
  isDone: boolean;
  error: string | null;
  start: (owner: string, repo: string, mode?: string) => void;
  reset: () => void;
}

/**
 * Calculate delay to the next character reveal, based on the char that was
 * just revealed, upcoming content, buffer lead, and stream status.
 */
function calculateDelay(
  revealedChar: string,
  upcoming: string,
  bufferLead: number,
  streamDone: boolean,
): number {
  let delay = BASE_CHAR_DELAY_MS;
  const next = upcoming[0] ?? "";

  // Punctuation pauses — only at real sentence/clause boundaries
  if (revealedChar === "." || revealedChar === "!" || revealedChar === "?") {
    if (next === " " || next === "\n" || next === "") {
      delay = SENTENCE_PAUSE_MS;
    }
  } else if (revealedChar === "," || revealedChar === ";" || revealedChar === ":") {
    delay = CLAUSE_PAUSE_MS;
  } else if (revealedChar === "\n") {
    delay = next === "\n" ? PARAGRAPH_PAUSE_MS : LINE_BREAK_MS;
  }

  // Section transition pause — if upcoming content starts with a section emoji,
  // let the reader breathe before the new header appears
  if (upcoming && SECTION_EMOJI_PATTERN.test(upcoming.slice(0, 3))) {
    delay = Math.max(delay, SECTION_PAUSE_MS);
  }

  // Small random jitter (±10%) to avoid mechanical cadence
  delay *= 0.9 + Math.random() * 0.2;

  // Adaptive speed — if the LLM is streaming faster than we're revealing,
  // gently speed up so we don't fall behind
  if (bufferLead > 400) {
    delay *= 0.35;
  } else if (bufferLead > 200) {
    delay *= 0.55;
  } else if (bufferLead > 100) {
    delay *= 0.75;
  }

  // Stream done — smoothly accelerate to finish, don't just dump
  if (streamDone) {
    // The larger the remaining buffer, the more we accelerate
    const remaining = bufferLead;
    if (remaining > 30) {
      // Exponential ramp: from 0.5x at 30 remaining to 0.1x at 300+ remaining
      const factor = Math.max(0.1, 0.5 - (remaining / 300) * 0.4);
      delay *= factor;
    }
  }

  return Math.max(MIN_DELAY_MS, delay);
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

    if (revealed >= buf.length) {
      // Buffer drained
      if (streamDoneRef.current) {
        // Finalize — ensure text matches the full buffer
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
    // Advance by 2 if we're revealing a high surrogate so we never split an emoji.
    const firstCode = buf.charCodeAt(revealed);
    const isHighSurrogate = firstCode >= 0xd800 && firstCode <= 0xdbff;
    const advance = isHighSurrogate ? 2 : 1;
    const nextRevealed = revealed + advance;

    // The "character" we just revealed (full emoji or single ASCII char)
    const revealedChar = buf.slice(revealed, nextRevealed);
    // Upcoming context for delay calculation
    const upcoming = buf.slice(nextRevealed, nextRevealed + 6);
    const bufferLead = buf.length - revealed;

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
