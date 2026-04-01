"use client";

import { useState, useEffect, useCallback } from "react";

interface StreamingState {
  displayText: string;
  isStreaming: boolean;
  isDone: boolean;
  restart: () => void;
}

const CHARS_PER_TICK = 3;
const TICK_MS = 20;

/** Simulates streaming text output like an LLM response */
export function useStreamingText(fullText: string): StreamingState {
  const [charIndex, setCharIndex] = useState(0);
  const [active, setActive] = useState(true);

  const restart = useCallback(() => {
    setCharIndex(0);
    setActive(true);
  }, []);

  useEffect(() => {
    if (!active || charIndex >= fullText.length) {
      if (charIndex >= fullText.length) setActive(false);
      return;
    }

    const timer = setTimeout(() => {
      setCharIndex((prev) => Math.min(prev + CHARS_PER_TICK, fullText.length));
    }, TICK_MS);

    return () => clearTimeout(timer);
  }, [charIndex, fullText, active]);

  return {
    displayText: fullText.slice(0, charIndex),
    isStreaming: active && charIndex < fullText.length,
    isDone: charIndex >= fullText.length,
    restart,
  };
}
