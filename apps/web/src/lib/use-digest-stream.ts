"use client";

import { useState, useCallback, useRef } from "react";

export interface DigestStats {
  commits: number;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
}

export interface ParsedSections {
  digest: string;
  standup: string;
  aiContext: string;
}

interface DigestStreamState {
  text: string;
  stats: DigestStats | null;
  sections: ParsedSections | null;
  isStreaming: boolean;
  isDone: boolean;
  error: string | null;
  start: (owner: string, repo: string, mode?: string) => void;
  reset: () => void;
}

export function useDigestStream(): DigestStreamState {
  const [text, setText] = useState("");
  const [stats, setStats] = useState<DigestStats | null>(null);
  const [sections, setSections] = useState<ParsedSections | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fullTextRef = useRef("");

  const parseSections = useCallback((fullText: string) => {
    const digestPart =
      fullText.split("---DIGEST---")[1]?.split("---STANDUP---")[0]?.trim() ?? fullText;
    const standupPart =
      fullText.split("---STANDUP---")[1]?.split("---AI_CONTEXT---")[0]?.trim() ?? "";
    const aiContextPart = fullText.split("---AI_CONTEXT---")[1]?.trim() ?? "";

    // Only set sections if we actually got the markers
    if (fullText.includes("---STANDUP---")) {
      setSections({ digest: digestPart, standup: standupPart, aiContext: aiContextPart });
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setText("");
    setStats(null);
    setSections(null);
    fullTextRef.current = "";
    setIsStreaming(false);
    setIsDone(false);
    setError(null);
  }, []);

  const start = useCallback((owner: string, repo: string, mode?: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setText("");
    setStats(null);
    setIsStreaming(true);
    setIsDone(false);
    setError(null);

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

                if (currentEvent === "stats") {
                  setStats(parsed as unknown as DigestStats);
                } else if (currentEvent === "text" && typeof parsed.text === "string") {
                  const chunk = parsed.text;
                  fullTextRef.current += chunk;
                  setText((prev) => prev + chunk);
                } else if (currentEvent === "done") {
                  parseSections(fullTextRef.current);
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
        parseSections(fullTextRef.current);
        setIsDone(true);
        setIsStreaming(false);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setIsStreaming(false);
      }
    })();
  }, []);

  return { text, stats, sections, isStreaming, isDone, error, start, reset };
}
