/**
 * Deterministic project stack detection.
 *
 * Reads a small set of well-known config files via a pluggable FilesReader
 * (local FS for the CLI, GitHub Contents API for the web app) and returns
 * a structured DetectedStack. Every probe is independent and failure-safe:
 * a missing file, malformed JSON, or unexpected content returns undefined
 * for that field. detectStack() never throws; worst case it returns {}.
 *
 * The result is injected into the LLM user prompt as a "treat as strong
 * hints" block so the model uses real facts (parsed from package.json,
 * etc.) instead of inferring them from diffs. Today's behavior is
 * preserved when the stack is empty.
 */

import fs from "node:fs/promises";
import path from "node:path";

export type DetectedStack = {
  framework?: string;
  language?: string;
  runtime?: string;
  database?: string;
  auth?: string;
  styling?: string;
  testing?: string;
  bundler?: string;
  deploy?: string;
  packageManager?: string;
};

export interface FilesReader {
  /**
   * Read a file at a repo-relative path.
   * Returns the file contents as text, or null if the file is absent
   * OR could not be read for any reason. MUST NOT throw.
   */
  readText(repoRelativePath: string): Promise<string | null>;
}

const MAX_FIELD_LEN = 200;
const truncate = (s: string): string =>
  s.length > MAX_FIELD_LEN ? s.slice(0, MAX_FIELD_LEN) : s;

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  packageManager?: string;
  engines?: { node?: string; bun?: string };
  scripts?: Record<string, string>;
};

async function readJson(reader: FilesReader, p: string): Promise<unknown | null> {
  const text = await reader.readText(p);
  if (text === null) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function asPackageJson(raw: unknown): PackageJson | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as PackageJson;
}

/**
 * Pick the most "app-like" package.json across the repo root and common
 * monorepo subpaths. The root file usually wins for standalone projects,
 * but in a monorepo where the root package.json is just workspace tooling
 * (no framework deps), we fall through to the first subpath that DOES
 * have a recognizable framework. This is what makes detection produce
 * useful output for users whose Next.js / Vue / Astro app lives under
 * apps/web/ rather than at the repo root.
 *
 * The FilesReader's own monorepo fallback is path-by-path: it returns
 * the root file when present. This function complements that by picking
 * the right ROOT to read from for the rest of the probes.
 */
const MONOREPO_APP_PATHS = ["apps/web", "apps/app", "apps/server", "packages/web"];

async function pickAppPackageJson(
  reader: FilesReader,
): Promise<{ pkg: PackageJson; prefix: string } | null> {
  const rootRaw = await readJson(reader, "package.json");
  const rootPkg = asPackageJson(rootRaw);
  if (rootPkg && detectFramework(rootPkg)) {
    return { pkg: rootPkg, prefix: "" };
  }
  for (const sub of MONOREPO_APP_PATHS) {
    const subRaw = await readJson(reader, `${sub}/package.json`);
    const subPkg = asPackageJson(subRaw);
    if (subPkg && detectFramework(subPkg)) {
      return { pkg: subPkg, prefix: `${sub}/` };
    }
  }
  // No framework anywhere — fall back to root package.json if it existed.
  if (rootPkg) return { pkg: rootPkg, prefix: "" };
  return null;
}

function depVersion(pkg: PackageJson, name: string): string | undefined {
  const v = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
  if (typeof v !== "string") return undefined;
  // Strip leading ^ ~ >= = and quote chars; keep first token.
  const cleaned = v.replace(/^[\^~>=<\s"']+/, "").trim();
  // Major or major.minor is plenty.
  const m = cleaned.match(/^(\d+(\.\d+)?)/);
  return m ? m[1] : cleaned.slice(0, 16);
}

function hasDep(pkg: PackageJson, name: string): boolean {
  return Boolean(pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]);
}

function hasAnyDep(pkg: PackageJson, names: string[]): boolean {
  return names.some((n) => hasDep(pkg, n));
}

function detectFramework(pkg: PackageJson): string | undefined {
  if (hasDep(pkg, "next")) {
    const v = depVersion(pkg, "next");
    return v ? `Next.js ${v}` : "Next.js";
  }
  if (hasDep(pkg, "@remix-run/react") || hasDep(pkg, "@remix-run/node")) return "Remix";
  if (hasDep(pkg, "nuxt")) {
    const v = depVersion(pkg, "nuxt");
    return v ? `Nuxt ${v}` : "Nuxt";
  }
  if (hasDep(pkg, "@sveltejs/kit")) return "SvelteKit";
  if (hasDep(pkg, "astro")) {
    const v = depVersion(pkg, "astro");
    return v ? `Astro ${v}` : "Astro";
  }
  if (hasDep(pkg, "svelte")) return "Svelte";
  if (hasDep(pkg, "vue")) return "Vue";
  if (hasDep(pkg, "react")) {
    const v = depVersion(pkg, "react");
    return v ? `React ${v}` : "React";
  }
  if (hasDep(pkg, "fastify")) return "Fastify";
  if (hasDep(pkg, "hono")) return "Hono";
  if (hasDep(pkg, "express")) return "Express";
  return undefined;
}

async function detectLanguage(
  reader: FilesReader,
  pkg: PackageJson,
): Promise<string | undefined> {
  const tsconfig = await reader.readText("tsconfig.json");
  if (tsconfig !== null) {
    const v = depVersion(pkg, "typescript");
    return v ? `TypeScript ${v}` : "TypeScript";
  }
  // package.json present but no tsconfig: default to JavaScript.
  return "JavaScript";
}

function detectRuntime(pkg: PackageJson, lockfiles: LockfilePresence): string | undefined {
  if (pkg.engines?.bun) return `Bun ${pkg.engines.bun}`;
  if (lockfiles.bun) return "Bun";
  if (pkg.engines?.node) return `Node ${pkg.engines.node}`;
  return undefined;
}

type LockfilePresence = {
  pnpm: boolean;
  bun: boolean;
  yarn: boolean;
  npm: boolean;
};

async function detectLockfiles(reader: FilesReader): Promise<LockfilePresence> {
  const [pnpm, bun, yarn, npm] = await Promise.all([
    reader.readText("pnpm-lock.yaml"),
    reader.readText("bun.lockb"),
    reader.readText("yarn.lock"),
    reader.readText("package-lock.json"),
  ]);
  return {
    pnpm: pnpm !== null,
    bun: bun !== null,
    yarn: yarn !== null,
    npm: npm !== null,
  };
}

function detectPackageManager(
  pkg: PackageJson,
  lockfiles: LockfilePresence,
): string | undefined {
  if (typeof pkg.packageManager === "string" && pkg.packageManager.length > 0) {
    // Format is e.g. "pnpm@9.1.0"; keep concise.
    const pm = pkg.packageManager.split("+")[0]; // strip integrity hash
    return pm;
  }
  if (lockfiles.pnpm) return "pnpm";
  if (lockfiles.bun) return "bun";
  if (lockfiles.yarn) return "yarn";
  if (lockfiles.npm) return "npm";
  return undefined;
}

async function detectDatabase(
  reader: FilesReader,
  pkg: PackageJson,
): Promise<string | undefined> {
  const schema = await reader.readText("prisma/schema.prisma");
  if (schema !== null) {
    const m = schema.match(/provider\s*=\s*"(\w+)"/);
    const v = depVersion(pkg, "prisma") ?? depVersion(pkg, "@prisma/client");
    const providerMap: Record<string, string> = {
      postgresql: "Postgres",
      postgres: "Postgres",
      mysql: "MySQL",
      sqlite: "SQLite",
      sqlserver: "SQL Server",
      mongodb: "MongoDB",
      cockroachdb: "CockroachDB",
    };
    const provider = m ? (providerMap[m[1]!.toLowerCase()] ?? m[1]) : "Prisma";
    return v ? `${provider} via Prisma ${v}` : `${provider} via Prisma`;
  }
  const drizzle = (await reader.readText("drizzle.config.ts")) ?? (await reader.readText("drizzle.config.js"));
  if (drizzle !== null) return "Drizzle ORM";
  if (hasDep(pkg, "@supabase/supabase-js")) return "Supabase";
  if (hasDep(pkg, "pg")) return "Postgres";
  if (hasDep(pkg, "mysql2")) return "MySQL";
  if (hasDep(pkg, "better-sqlite3") || hasDep(pkg, "sqlite3")) return "SQLite";
  if (hasDep(pkg, "mongodb") || hasDep(pkg, "mongoose")) return "MongoDB";
  return undefined;
}

function detectAuth(pkg: PackageJson): string | undefined {
  if (hasAnyDep(pkg, ["next-auth", "@auth/core"])) return "NextAuth";
  if (hasAnyDep(pkg, ["@clerk/nextjs", "@clerk/clerk-sdk-node", "@clerk/clerk-react"]))
    return "Clerk";
  if (hasAnyDep(pkg, ["@supabase/auth-helpers-nextjs", "@supabase/ssr"]))
    return "Supabase Auth";
  if (hasDep(pkg, "lucia")) return "Lucia";
  if (hasDep(pkg, "@workos-inc/node")) return "WorkOS";
  if (hasDep(pkg, "@auth0/nextjs-auth0") || hasDep(pkg, "@auth0/auth0-react")) return "Auth0";
  if (hasDep(pkg, "firebase")) return "Firebase Auth";
  return undefined;
}

function detectStyling(pkg: PackageJson): string | undefined {
  if (hasDep(pkg, "tailwindcss")) {
    const v = depVersion(pkg, "tailwindcss");
    return v ? `Tailwind ${v}` : "Tailwind";
  }
  if (hasDep(pkg, "@emotion/react") || hasDep(pkg, "@emotion/styled")) return "Emotion";
  if (hasDep(pkg, "styled-components")) return "styled-components";
  if (hasDep(pkg, "@chakra-ui/react")) return "Chakra UI";
  if (hasDep(pkg, "@mui/material")) return "MUI";
  return undefined;
}

function detectTesting(pkg: PackageJson): string | undefined {
  const found: string[] = [];
  if (hasDep(pkg, "vitest")) found.push("Vitest");
  if (hasDep(pkg, "jest")) found.push("Jest");
  if (hasDep(pkg, "@playwright/test") || hasDep(pkg, "playwright")) found.push("Playwright");
  if (hasDep(pkg, "cypress")) found.push("Cypress");
  return found.length > 0 ? found.join(" + ") : undefined;
}

function detectBundler(pkg: PackageJson, framework?: string): string | undefined {
  // Turbopack detection: Next.js with --turbo flag in scripts.
  const dev = pkg.scripts?.dev ?? "";
  if (framework?.startsWith("Next.js") && /--turbo\b/.test(dev)) return "Turbopack";
  if (hasDep(pkg, "vite")) return "Vite";
  // Otherwise implicit by framework; leave undefined.
  return undefined;
}

async function detectDeploy(reader: FilesReader): Promise<string | undefined> {
  const probes: Array<[string, string]> = [
    ["vercel.json", "Vercel"],
    ["netlify.toml", "Netlify"],
    ["wrangler.toml", "Cloudflare Workers"],
    ["fly.toml", "Fly.io"],
    ["railway.json", "Railway"],
    ["render.yaml", "Render"],
    ["app.yaml", "Google App Engine"],
    ["Dockerfile", "Docker"],
  ];
  // Check in parallel; first deterministic-priority match wins.
  const results = await Promise.all(probes.map(([p]) => reader.readText(p)));
  for (let i = 0; i < probes.length; i++) {
    if (results[i] !== null) return probes[i]![1];
  }
  return undefined;
}

/**
 * Detect the project stack from config files.
 *
 * Always resolves. Never throws. Returns {} for repos with no recognizable
 * signals (e.g., not a Node project, or no config files committed). The
 * caller should treat an empty result as "no facts available, fall back
 * to LLM inference."
 */
export async function detectStack(reader: FilesReader): Promise<DetectedStack> {
  try {
    const picked = await pickAppPackageJson(reader);
    if (!picked) {
      // No package.json anywhere — only deploy detection is meaningful.
      const deploy = await detectDeploy(reader).catch(() => undefined);
      const out: DetectedStack = {};
      if (deploy) out.deploy = truncate(deploy);
      return out;
    }
    const { pkg } = picked;

    const [language, lockfiles, database, deploy] = await Promise.all([
      detectLanguage(reader, pkg).catch(() => undefined),
      detectLockfiles(reader).catch(() => ({ pnpm: false, bun: false, yarn: false, npm: false })),
      detectDatabase(reader, pkg).catch(() => undefined),
      detectDeploy(reader).catch(() => undefined),
    ]);

    const framework = detectFramework(pkg);
    const runtime = detectRuntime(pkg, lockfiles);
    const auth = detectAuth(pkg);
    const styling = detectStyling(pkg);
    const testing = detectTesting(pkg);
    const bundler = detectBundler(pkg, framework);
    const packageManager = detectPackageManager(pkg, lockfiles);

    const out: DetectedStack = {};
    if (framework) out.framework = truncate(framework);
    if (language) out.language = truncate(language);
    if (runtime) out.runtime = truncate(runtime);
    if (database) out.database = truncate(database);
    if (auth) out.auth = truncate(auth);
    if (styling) out.styling = truncate(styling);
    if (testing) out.testing = truncate(testing);
    if (bundler) out.bundler = truncate(bundler);
    if (deploy) out.deploy = truncate(deploy);
    if (packageManager) out.packageManager = truncate(packageManager);
    return out;
  } catch {
    return {};
  }
}

/**
 * Format a DetectedStack as a prompt block for injection into the LLM
 * user message. Returns "" when nothing was detected, so callers can
 * unconditionally prepend the result without conditionals at the call site.
 *
 * The "treat as strong hints" wording (rather than "do not contradict")
 * gives the model permission to override with diff evidence on weird
 * repos, while still anchoring the common case to parsed facts.
 */
export function formatDetectedStackBlock(stack: DetectedStack): string {
  const lines: string[] = [];
  const labels: Array<[keyof DetectedStack, string]> = [
    ["framework", "Framework"],
    ["language", "Language"],
    ["runtime", "Runtime"],
    ["database", "Database"],
    ["auth", "Auth"],
    ["styling", "Styling"],
    ["testing", "Testing"],
    ["bundler", "Bundler"],
    ["deploy", "Deploy target"],
    ["packageManager", "Package manager"],
  ];
  for (const [key, label] of labels) {
    const v = stack[key];
    if (typeof v === "string" && v.length > 0) lines.push(`- ${label}: ${v}`);
  }
  if (lines.length === 0) return "";
  return `## Detected Project Stack (parsed from config files)
Treat these as strong hints. Use them verbatim in any "Tech Stack" output unless the diffs clearly contradict them.

${lines.join("\n")}
`;
}

/**
 * Local filesystem reader for the CLI. Walks small monorepo layouts:
 * if a probe path is missing at the repo root, also tries common app
 * locations (apps/web, apps/app, packages/web). The first hit wins per
 * path, so a root-level package.json takes priority — important for
 * standalone repos where everything is at the root.
 *
 * Stays defensive: every read is wrapped in try/catch; absence and
 * permission errors both return null.
 */
export function createLocalFilesReader(repoPath: string): FilesReader {
  const monorepoFallbacks = ["apps/web", "apps/app", "apps/server", "packages/web"];
  return {
    async readText(rel: string): Promise<string | null> {
      const tryRead = async (full: string): Promise<string | null> => {
        try {
          return await fs.readFile(full, "utf-8");
        } catch {
          return null;
        }
      };
      const root = await tryRead(path.join(repoPath, rel));
      if (root !== null) return root;
      for (const sub of monorepoFallbacks) {
        const hit = await tryRead(path.join(repoPath, sub, rel));
        if (hit !== null) return hit;
      }
      return null;
    },
  };
}
