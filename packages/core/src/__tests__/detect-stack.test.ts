import { describe, it, expect } from "vitest";
import {
  detectStack,
  formatDetectedStackBlock,
  type FilesReader,
  type DetectedStack,
} from "../detect-stack.js";

/**
 * Build a FilesReader from a plain {path: contents} map. Any path
 * not in the map resolves to null (file absent). Mirrors the real
 * FilesReader contract: never throws.
 */
function mockReader(files: Record<string, string>): FilesReader {
  return {
    async readText(p: string): Promise<string | null> {
      return p in files ? (files[p] ?? null) : null;
    },
  };
}

describe("detectStack", () => {
  it("returns {} for an empty repo (no package.json, no deploy config)", async () => {
    const stack = await detectStack(mockReader({}));
    expect(stack).toEqual({});
  });

  it("detects deploy target even without a package.json (e.g. static sites)", async () => {
    const stack = await detectStack(
      mockReader({ "vercel.json": JSON.stringify({ buildCommand: "echo" }) }),
    );
    expect(stack.deploy).toBeDefined();
    // Don't pin the exact label string here — the deploy detector
    // owns that vocabulary. Just confirm Vercel-ish.
    expect(stack.deploy?.toLowerCase()).toContain("vercel");
  });

  it("detects Next.js with version", async () => {
    const pkg = {
      dependencies: { next: "^15.0.0", react: "^19.0.0" },
    };
    const stack = await detectStack(
      mockReader({ "package.json": JSON.stringify(pkg) }),
    );
    expect(stack.framework).toMatch(/^Next\.js/);
    expect(stack.framework).toContain("15");
  });

  it("detects TypeScript when tsconfig.json is present", async () => {
    const pkg = { dependencies: { typescript: "^5.0.0" } };
    const stack = await detectStack(
      mockReader({
        "package.json": JSON.stringify(pkg),
        "tsconfig.json": "{}",
      }),
    );
    expect(stack.language).toMatch(/^TypeScript/);
  });

  it("falls back to JavaScript when package.json exists but no tsconfig", async () => {
    const pkg = { dependencies: { react: "^19.0.0" } };
    const stack = await detectStack(mockReader({ "package.json": JSON.stringify(pkg) }));
    expect(stack.language).toBe("JavaScript");
  });

  it("detects Tailwind for styling", async () => {
    const pkg = { dependencies: { tailwindcss: "^4.0.0" } };
    const stack = await detectStack(mockReader({ "package.json": JSON.stringify(pkg) }));
    expect(stack.styling).toMatch(/Tailwind/);
  });

  it("detects Vitest + Playwright together (combined string)", async () => {
    const pkg = {
      devDependencies: { vitest: "^3.0.0", "@playwright/test": "^1.0.0" },
    };
    const stack = await detectStack(mockReader({ "package.json": JSON.stringify(pkg) }));
    expect(stack.testing).toBe("Vitest + Playwright");
  });

  it("detects Supabase as the database when supabase-js is present", async () => {
    const pkg = { dependencies: { "@supabase/supabase-js": "^2.0.0" } };
    const stack = await detectStack(mockReader({ "package.json": JSON.stringify(pkg) }));
    expect(stack.database).toBe("Supabase");
  });

  it("detects NextAuth when next-auth is present", async () => {
    const pkg = { dependencies: { "next-auth": "5.0.0-beta.30" } };
    const stack = await detectStack(mockReader({ "package.json": JSON.stringify(pkg) }));
    expect(stack.auth).toBe("NextAuth");
  });

  it("infers pnpm as package manager from pnpm-lock.yaml", async () => {
    const pkg = { dependencies: { react: "^19.0.0" } };
    const stack = await detectStack(
      mockReader({ "package.json": JSON.stringify(pkg), "pnpm-lock.yaml": "lockfileVersion: '9.0'" }),
    );
    expect(stack.packageManager).toBe("pnpm");
  });

  it("prefers package.json's explicit packageManager field over lockfile inference", async () => {
    const pkg = { packageManager: "pnpm@10.33.0", dependencies: { react: "^19.0.0" } };
    const stack = await detectStack(
      mockReader({ "package.json": JSON.stringify(pkg), "yarn.lock": "" }),
    );
    expect(stack.packageManager).toBe("pnpm@10.33.0");
  });

  it("never throws on malformed JSON — returns {} or the partial valid pieces", async () => {
    // package.json is garbage; readJson returns null so the picker
    // sees no usable package — only deploy can still fire.
    const stack = await detectStack(
      mockReader({ "package.json": "{ this is not json", "vercel.json": "{}" }),
    );
    expect(stack.framework).toBeUndefined();
    // Deploy can still detect from vercel.json existence.
    expect(stack.deploy?.toLowerCase()).toContain("vercel");
  });
});

describe("formatDetectedStackBlock", () => {
  it("returns an empty string for an empty stack so callers can prepend unconditionally", () => {
    expect(formatDetectedStackBlock({})).toBe("");
  });

  it("renders each populated field as a labeled bullet", () => {
    const stack: DetectedStack = {
      framework: "Next.js 15",
      language: "TypeScript 5.0",
      styling: "Tailwind 4",
    };
    const block = formatDetectedStackBlock(stack);
    expect(block).toContain("Framework: Next.js 15");
    expect(block).toContain("Language: TypeScript 5.0");
    expect(block).toContain("Styling: Tailwind 4");
  });

  it("preserves the documented label order (framework first, packageManager last)", () => {
    const stack: DetectedStack = {
      packageManager: "pnpm",
      framework: "Next.js",
      language: "TypeScript",
    };
    const block = formatDetectedStackBlock(stack);
    const frameworkIdx = block.indexOf("Framework:");
    const languageIdx = block.indexOf("Language:");
    const pmIdx = block.indexOf("Package manager:");
    expect(frameworkIdx).toBeLessThan(languageIdx);
    expect(languageIdx).toBeLessThan(pmIdx);
  });

  it("includes the 'strong hints' prompt-contract sentence so the LLM doesn't override on every diff", () => {
    const block = formatDetectedStackBlock({ framework: "Next.js" });
    expect(block).toContain("strong hints");
  });
});
