# askscout

The daily digest for vibe coders. Scout sniffs through your repo and tells you what you built, what changed, and where you left off.

## Project Structure

pnpm monorepo with three packages:

- `packages/core` — shared library (`@askscout/core`). Git reading, LLM summarization, output formatting, project state management.
- `packages/cli` — CLI tool published to npm as `askscout`. Thin wrapper around core.
- `apps/web` — Next.js web app deployed to Vercel at askscout.dev.

## Commands

```bash
pnpm install              # install all dependencies
pnpm build                # build all packages (core first, then cli + web)
pnpm dev                  # start all packages in dev/watch mode
pnpm test                 # run all tests via vitest
pnpm typecheck            # type-check all packages via tsc --build
pnpm lint                 # lint all packages via eslint
pnpm lint:fix             # lint and auto-fix
pnpm format               # format all files via prettier
pnpm format:check         # check formatting without writing
```

## Conventions

- All source code lives in `src/` directories
- TypeScript strict mode everywhere — no `any` unless explicitly justified
- Cross-package dependencies use `workspace:*` protocol
- Shared devDependencies (eslint, prettier, typescript, vitest, tsup) live at root
- Runtime dependencies live in each package's own package.json
- Exports from core use the barrel file at `src/index.ts`

## PRD

The full product requirements document is at `~/Desktop/PRD.md`. Always refer to it for product decisions, voice/tone, output format, and feature scope.

## Key Decisions

- AI models: Claude Haiku (Anthropic) or GPT-4o-mini (OpenAI) — cheapest that work
- CLI: BYOK (bring your own key), auto-detect provider from key format
- Web: GitHub OAuth, Firebase for storage, hosted API key
- Three output modes: digest (default), resume prompt (--resume), standup (--standup)
- Project state: `.askscout/state.json` per project, rewritten each run (not appended)

## Build Order

When implementing features, build in this order:

1. Types in `packages/core/src/types.ts`
2. Core logic in `packages/core/src/`
3. CLI integration in `packages/cli/`
4. Web integration in `apps/web/`
