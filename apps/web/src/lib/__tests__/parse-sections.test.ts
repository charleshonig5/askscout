import { describe, it, expect } from "vitest";
import { parseSections } from "../parse-sections";

describe("parseSections", () => {
  it("parses all four sections from a full unified response", () => {
    const text = `---DIGEST---
Vibe Check content
---STANDUP---
Standup content
---PLAN---
Plan content
---AI_CONTEXT---
AI context content`;

    const result = parseSections(text);
    expect(result.digest).toBe("Vibe Check content");
    expect(result.standup).toBe("Standup content");
    expect(result.plan).toBe("Plan content");
    expect(result.aiContext).toBe("AI context content");
  });

  it("handles text without any markers (plain digest text)", () => {
    const text = "Just a plain digest with no markers";
    const result = parseSections(text);
    expect(result.digest).toBe("Just a plain digest with no markers");
    expect(result.standup).toBe("");
    expect(result.plan).toBe("");
    expect(result.aiContext).toBe("");
  });

  it("handles missing plan section (backward compatibility)", () => {
    const text = `---DIGEST---
Digest content
---STANDUP---
Standup content
---AI_CONTEXT---
AI context`;

    const result = parseSections(text);
    expect(result.digest).toBe("Digest content");
    expect(result.standup).toContain("Standup content");
    expect(result.plan).toBe("");
    expect(result.aiContext).toBe("AI context");
  });

  it("aiContext includes everything after AI_CONTEXT marker (summary stripping is onComplete's job)", () => {
    // parseSections doesn't know about ---SUMMARY---. The stream route's
    // onComplete strips the summary before saving. This test documents that
    // parseSections correctly takes everything after ---AI_CONTEXT---.
    const text = `---DIGEST---
Digest here
---STANDUP---
Standup here
---PLAN---
Plan here
---AI_CONTEXT---
Context here`;

    const result = parseSections(text);
    expect(result.digest).toBe("Digest here");
    expect(result.aiContext).toBe("Context here");
  });

  it("trims whitespace from each section", () => {
    const text = `---DIGEST---

  Content with spaces

---STANDUP---
  Standup
---PLAN---
---AI_CONTEXT---
  Context  `;

    const result = parseSections(text);
    expect(result.digest).toBe("Content with spaces");
    expect(result.standup).toBe("Standup");
    expect(result.plan).toBe("");
    expect(result.aiContext).toBe("Context");
  });
});
