"use client";

/** Play a soft pop/bubble sound using Web Audio API */
export function playCompletionPop() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    // Soft pop: short sine wave that rises then fades
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
    oscillator.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.15);

    // Quick fade in, then fade out
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);

    // Clean up
    oscillator.onended = () => ctx.close();
  } catch {
    // Audio not available — silently skip
  }
}
