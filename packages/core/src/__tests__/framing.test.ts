import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getProjectFraming } from "../framing.js";

/**
 * framing reads files directly from the working tree, so tests use
 * a real tmp dir rather than a mock reader. Each test gets a fresh
 * dir; cleanup happens in afterEach so tests can't leak state.
 */
describe("getProjectFraming", () => {
  let tmpRoot: string;

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "askscout-framing-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  it("returns { readme: null, manifest: null } for an empty dir", async () => {
    const out = await getProjectFraming(tmpRoot);
    expect(out).toEqual({ readme: null, manifest: null });
  });

  it("reads README.md when present", async () => {
    await fs.writeFile(path.join(tmpRoot, "README.md"), "# My Project\n\nDoes a thing.");
    const out = await getProjectFraming(tmpRoot);
    expect(out.readme).toContain("# My Project");
    expect(out.readme).toContain("Does a thing");
  });

  it("falls back to lowercase readme.md when README.md is absent", async () => {
    // README_CANDIDATES are tried in order; verifying the second
    // candidate fires correctly.
    await fs.writeFile(path.join(tmpRoot, "readme.md"), "Lowercase readme works too.");
    const out = await getProjectFraming(tmpRoot);
    expect(out.readme).toBe("Lowercase readme works too.");
  });

  it("truncates very long READMEs at a sentence boundary", async () => {
    // Build a README > 3000 chars (MAX_README_CHARS) with clear
    // sentence-ending punctuation so the boundary detector can do
    // its job. 60 sentences of ~70 chars each ≈ 4200 chars.
    const longReadme = Array.from(
      { length: 60 },
      (_, i) => `Sentence number ${i + 1} explaining what this project does in some way.`,
    ).join(" ");
    await fs.writeFile(path.join(tmpRoot, "README.md"), longReadme);
    const out = await getProjectFraming(tmpRoot);
    expect(out.readme).toBeTruthy();
    expect(out.readme!.length).toBeLessThanOrEqual(3100); // ~3000 + truncation marker
    expect(out.readme).toContain("... (truncated)");
  });

  it("reads package.json and strips it down to relevant fields", async () => {
    const fullPkg = {
      name: "my-app",
      description: "A nice app.",
      version: "1.2.3",
      scripts: { dev: "next dev" },
      dependencies: { next: "^15.0.0" },
      // These should be stripped:
      author: "Someone",
      repository: { url: "https://example.com" },
      keywords: ["foo", "bar"],
      bugs: { url: "https://example.com/issues" },
    };
    await fs.writeFile(path.join(tmpRoot, "package.json"), JSON.stringify(fullPkg, null, 2));
    const out = await getProjectFraming(tmpRoot);
    expect(out.manifest?.path).toBe("package.json");
    expect(out.manifest?.content).toContain('"name": "my-app"');
    expect(out.manifest?.content).toContain('"description": "A nice app."');
    expect(out.manifest?.content).toContain('"next": "^15.0.0"');
    // Stripped fields should not appear:
    expect(out.manifest?.content).not.toContain("Someone");
    expect(out.manifest?.content).not.toContain("keywords");
    expect(out.manifest?.content).not.toContain("repository");
  });

  it("returns the raw package.json text if it isn't valid JSON", async () => {
    await fs.writeFile(path.join(tmpRoot, "package.json"), "{ name: nope }");
    const out = await getProjectFraming(tmpRoot);
    expect(out.manifest?.path).toBe("package.json");
    // Malformed JSON gets passed through as-is (filterPackageJson's
    // try/catch fallback) so the LLM can still attempt to read it.
    expect(out.manifest?.content).toContain("{ name: nope }");
  });

  it("falls back to pyproject.toml when no package.json is present", async () => {
    const pyproject = `[project]
name = "my_app"
version = "0.1.0"
`;
    await fs.writeFile(path.join(tmpRoot, "pyproject.toml"), pyproject);
    const out = await getProjectFraming(tmpRoot);
    expect(out.manifest?.path).toBe("pyproject.toml");
    expect(out.manifest?.content).toContain('name = "my_app"');
  });

  it("picks package.json over pyproject.toml when both exist (priority order)", async () => {
    await fs.writeFile(path.join(tmpRoot, "package.json"), JSON.stringify({ name: "node-app" }));
    await fs.writeFile(path.join(tmpRoot, "pyproject.toml"), "[project]\nname = 'py-app'");
    const out = await getProjectFraming(tmpRoot);
    expect(out.manifest?.path).toBe("package.json");
  });

  it("truncates a manifest that exceeds the per-file cap", async () => {
    // package.json with a huge scripts block to blow past
    // MAX_MANIFEST_CHARS (2000).
    const scripts: Record<string, string> = {};
    for (let i = 0; i < 200; i++) {
      scripts[`script-${i}`] = "echo " + "x".repeat(50);
    }
    await fs.writeFile(path.join(tmpRoot, "package.json"), JSON.stringify({ scripts }));
    const out = await getProjectFraming(tmpRoot);
    expect(out.manifest?.content).toContain("... (truncated)");
    expect(out.manifest!.content.length).toBeLessThanOrEqual(2200); // 2000 + marker slack
  });
});
