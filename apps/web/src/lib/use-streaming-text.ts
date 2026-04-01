"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface StreamingState {
  displayText: string;
  isStreaming: boolean;
  isDone: boolean;
  restart: () => void;
}

// Simulates natural LLM streaming with variable speed
const BASE_SPEED = 18; // ms per character (base)
const SPEED_VARIANCE = 8; // random variance range
const BURST_CHANCE = 0.15; // chance of a fast burst (like token chunks)
const BURST_CHARS = 8; // chars in a burst
const PAUSE_AFTER = new Set([".", "!", "?", "\n"]); // natural pause points
const PAUSE_MS = 60; // pause duration at natural breaks

/** Simulates streaming text output with natural, variable pacing */
export function useStreamingText(fullText: string): StreamingState {
  const [charIndex, setCharIndex] = useState(0);
  const [active, setActive] = useState(true);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const nextDelayRef = useRef<number>(BASE_SPEED);

  const restart = useCallback(() => {
    setCharIndex(0);
    setActive(true);
    lastTimeRef.current = 0;
    nextDelayRef.current = BASE_SPEED;
  }, []);

  useEffect(() => {
    if (!active || charIndex >= fullText.length) {
      if (charIndex >= fullText.length) setActive(false);
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;

      const elapsed = timestamp - lastTimeRef.current;

      if (elapsed >= nextDelayRef.current) {
        lastTimeRef.current = timestamp;

        // Determine how many chars to advance
        const isBurst = Math.random() < BURST_CHANCE;
        const advance = isBurst ? BURST_CHARS : 1;
        const nextIndex = Math.min(charIndex + advance, fullText.length);

        setCharIndex(nextIndex);

        // Calculate next delay
        const lastChar = fullText[nextIndex - 1];
        if (lastChar && PAUSE_AFTER.has(lastChar)) {
          nextDelayRef.current = PAUSE_MS;
        } else {
          nextDelayRef.current = BASE_SPEED + (Math.random() - 0.5) * SPEED_VARIANCE * 2;
        }
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [charIndex, fullText, active]);

  return {
    displayText: fullText.slice(0, charIndex),
    isStreaming: active && charIndex < fullText.length,
    isDone: charIndex >= fullText.length,
    restart,
  };
}
