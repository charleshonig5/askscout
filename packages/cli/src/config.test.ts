import { describe, it, expect } from "vitest";
import { detectProvider } from "./config";

/**
 * Provider detection from the API-key prefix is the first piece of
 * user input the CLI validates during setup, so getting these
 * boundaries right matters. The function rejects on:
 *   - too-short keys (< 20 chars)
 *   - keys containing non-[a-zA-Z0-9_-] characters
 *   - keys that don't start with sk-ant- or sk-
 * Anything else returns "anthropic" (sk-ant- prefix) or "openai".
 */
describe("detectProvider", () => {
  // Use realistic-shaped fixtures: 51-char Anthropic key shape,
  // 51-char OpenAI key shape. Both well above the MIN_KEY_LENGTH=20
  // floor so they pass length validation.
  const ANT_KEY = "sk-ant-api03-" + "x".repeat(40);
  const OPENAI_KEY = "sk-proj-" + "x".repeat(45);

  it("returns 'anthropic' for sk-ant- prefixed keys", () => {
    expect(detectProvider(ANT_KEY)).toBe("anthropic");
  });

  it("returns 'openai' for sk- prefixed keys without the ant- segment", () => {
    expect(detectProvider(OPENAI_KEY)).toBe("openai");
  });

  it("rejects keys shorter than 20 characters", () => {
    expect(() => detectProvider("sk-short")).toThrow(/too short/i);
  });

  it("rejects keys with disallowed characters", () => {
    // Same length floor as a valid key, but with a space — should
    // fail the regex check before the prefix check fires.
    const bad = "sk-ant-api 03 " + "x".repeat(30);
    expect(() => detectProvider(bad)).toThrow(/invalid characters/i);
  });

  it("rejects keys without a recognized prefix", () => {
    // Long enough + valid charset, but neither sk-ant- nor sk-
    expect(() => detectProvider("xx-" + "y".repeat(40))).toThrow(/Invalid API key format/i);
  });

  it("accepts underscores and hyphens in the key body", () => {
    // Real-world keys can include these — make sure the regex isn't
    // accidentally tighter than necessary.
    const k = "sk-ant-" + "abc_def-ghi" + "z".repeat(20);
    expect(detectProvider(k)).toBe("anthropic");
  });
});
