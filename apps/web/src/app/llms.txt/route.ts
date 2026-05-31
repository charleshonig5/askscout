import { ARTICLES } from "@/lib/articles-data";

/* /llms.txt — a site-summary file for large-language-model crawlers.
 *
 * Spec: https://llmstxt.org (proposed by Jeremy Howard / Answer.AI,
 * Sept 2024). Adopted by Anthropic, Stripe, Cloudflare, Vercel,
 * Hugging Face, FastAPI, and others. Format is plain Markdown with
 * a strict structure that LLMs can parse deterministically:
 *
 *   # Project name
 *   > One-paragraph blockquote summary
 *   Optional free-form prose about the project.
 *   ## Section
 *   - [Link text](URL): description
 *
 * Generated dynamically so the article list stays in sync with
 * ARTICLES (the single source of truth used by the sitemap, feed,
 * and articles index). No build step needed; Next renders this
 * route on demand and caches at the edge.
 *
 * Served at `/llms.txt` because llmstxt.org recommends that exact
 * root-relative path so AI crawlers can discover it consistently.
 */

const SITE = "https://askscout.dev";

export const dynamic = "force-static";

export function GET() {
  const articles = ARTICLES
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((a) => `- [${a.title}](${SITE}/articles/${a.slug}): ${a.description}`)
    .join("\n");

  const body = `# askScout

> askScout reads your git activity and writes a plain-English daily digest of what you actually shipped. Built for developers and vibe coders using Claude Code, Cursor, and Codex.

askScout is an open-source daily digest tool for developers. It runs as a web app at askscout.dev or as a CLI installed via \`npm install -g askscout\`. The CLI runs locally and uses your own Anthropic or OpenAI API key — nothing leaves your machine except the LLM call you authorize. askScout only reads commits and diffs; it never writes to your repos.

## Docs

- [Documentation](${SITE}/docs): How to use the web app and the CLI, full command reference, pricing, and installation steps.
- [Privacy Policy](${SITE}/privacy): What data askScout collects, where it's stored, who it's shared with, and how to delete it.

## Articles

${articles}

## Optional

- [GitHub repository](https://github.com/charleshonig5/askscout): Source code, MIT licensed.
- [RSS / Atom feed](${SITE}/dispatch): Subscribe to new articles.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
