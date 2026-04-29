# askscout

> The daily digest for vibe coders. Scout reads through your repo and tells you what you built, what changed, and where you left off.

[![npm version](https://img.shields.io/npm/v/askscout.svg)](https://www.npmjs.com/package/askscout)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/node/v/askscout.svg)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](./tsconfig.base.json)

askscout turns your git history into a digest you can actually read — what shipped, what's still shifting, where you left off, and what you're spending your time on. Two surfaces, one engine:

- **CLI** — `askscout` on npm. Runs locally, reads your repo, prints to your terminal. Bring your own API key (Anthropic or OpenAI).
- **Web** — [askscout.dev](https://askscout.dev). GitHub OAuth, hosted API key, persistent history.

---

## Quick start (CLI)

```bash
npm install -g askscout
cd path/to/your/repo
askscout --setup    # one-time: configure your API key
askscout            # daily digest
```

Other modes:

```bash
askscout --standup   # copy-paste standup for Slack
askscout --resume    # AI context to paste into your coding tools
askscout --week      # review the past 7 days
askscout --dry-run   # show what would be sent without calling the API
```

The CLI runs **100% locally** — your code never leaves your machine, except the diffs that go to your chosen LLM provider.

## Quick start (Web)

Visit [askscout.dev](https://askscout.dev), sign in with GitHub, pick a repo. Your digest history persists across sessions; insights surface streaks, per-repo activity, and an engagement personality.

---

## Repo structure

```
askscout/
├─ packages/
│  ├─ core/      @askscout/core — shared library (git reading, LLM summarization, formatting, state)
│  └─ cli/       askscout — CLI tool published to npm
└─ apps/
   └─ web/      Next.js web app deployed to Vercel
```

This is a [pnpm workspace](https://pnpm.io/workspaces). All cross-package imports use the `workspace:*` protocol.

## Local development

Requires **Node.js >= 22** and [pnpm](https://pnpm.io/installation) (≥ 8).

```bash
git clone https://github.com/charleshonig5/askscout.git
cd askscout
pnpm install
pnpm build       # build all packages (core → cli + web)
pnpm dev         # watch mode for all packages
pnpm test        # run tests via vitest
pnpm typecheck   # TypeScript check across the workspace
pnpm lint        # ESLint
pnpm format      # Prettier write
```

To run the CLI from source after building:

```bash
node packages/cli/dist/index.cjs --dry-run
```

To run the web app locally:

```bash
cp apps/web/.env.example apps/web/.env.local
# fill in the env vars (GitHub OAuth, Supabase, LLM provider key)
pnpm --filter @askscout/web dev
```

## Tech stack

- **Language:** TypeScript (strict mode across all packages)
- **CLI:** [yargs](https://yargs.js.org/), [tsup](https://tsup.egoist.dev/) for bundling
- **Web:** [Next.js 15](https://nextjs.org/) (App Router), [NextAuth](https://next-auth.js.org/) for GitHub OAuth, [Supabase](https://supabase.com/) for storage
- **AI:** Claude (Anthropic) or GPT-4o-mini (OpenAI) — auto-detected from the API key
- **Tooling:** [pnpm](https://pnpm.io/) workspaces, [vitest](https://vitest.dev/), [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Changesets](https://github.com/changesets/changesets)

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow, conventions, and how to run things locally.

## Security

If you discover a security vulnerability, please follow the responsible disclosure process in [SECURITY.md](./SECURITY.md). Do not open a public GitHub issue.

## License

[MIT](./LICENSE) © 2026 Charles Honig
