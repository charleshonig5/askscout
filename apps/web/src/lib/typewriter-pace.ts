"use client";

// Shared variable-pacing logic for streaming text reveal.
// Used by the digest stream drip and the Closing Thoughts typewriter so
// both feel like the same hand writing.

export const BASE_CHAR_DELAY_MS = 14; // ~70 chars/sec baseline
export const SENTENCE_PAUSE_MS = 260;
export const CLAUSE_PAUSE_MS = 80;
export const LINE_BREAK_MS = 110;
export const PARAGRAPH_PAUSE_MS = 380;
export const SECTION_PAUSE_MS = 450;
export const MIN_DELAY_MS = 2;

// Emojis that start a new digest section
export const SECTION_EMOJI_PATTERN = /[\u{1F4AC}\u{1F680}\u{1F527}\u{1F501}\u{1F4CD}\u{1F415}]/u;

/**
 * Calculate delay to the next character reveal based on punctuation,
 * section transitions, buffer lead, and stream status.
 *
 * - revealedChar: the character (or full emoji) just revealed
 * - upcoming: the next few code units after the reveal position
 * - bufferLead: how many code units exist beyond the current reveal position
 *   (for static text, pass 0 to disable adaptive speedup)
 * - streamDone: whether the LLM stream is finished (enables end-flush ramp)
 */
export function calculateDelay(
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

  // Adaptive speed — if the LLM is streaming faster than we're revealing
  if (bufferLead > 400) {
    delay *= 0.35;
  } else if (bufferLead > 200) {
    delay *= 0.55;
  } else if (bufferLead > 100) {
    delay *= 0.75;
  }

  // Stream done — smoothly accelerate to finish, don't just dump
  if (streamDone && bufferLead > 30) {
    const factor = Math.max(0.1, 0.5 - (bufferLead / 300) * 0.4);
    delay *= factor;
  }

  return Math.max(MIN_DELAY_MS, delay);
}

/**
 * Advance through text one grapheme at a time, handling UTF-16 surrogate pairs
 * so we never split an emoji in half during reveal.
 */
export function advanceBySurrogate(text: string, position: number): number {
  const code = text.charCodeAt(position);
  const isHighSurrogate = code >= 0xd800 && code <= 0xdbff;
  return isHighSurrogate ? 2 : 1;
}
