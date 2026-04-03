export interface ParsedSections {
  digest: string;
  standup: string;
  aiContext: string;
}

/**
 * Parse the three sections from a unified digest response.
 * Works with full unified text (with markers) or plain digest text (no markers).
 */
export function parseSections(fullText: string): ParsedSections {
  const digest =
    fullText.split("---DIGEST---")[1]?.split("---STANDUP---")[0]?.trim() ??
    fullText.split("---STANDUP---")[0]?.trim() ??
    fullText;
  const standup =
    fullText.split("---STANDUP---")[1]?.split("---AI_CONTEXT---")[0]?.trim() ?? "";
  const aiContext = fullText.split("---AI_CONTEXT---")[1]?.trim() ?? "";

  return { digest, standup, aiContext };
}
