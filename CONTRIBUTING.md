# Contributing to askscout

Thanks for your interest in askscout. This document covers what you need to know to make a successful contribution.

## Code of conduct

Be respectful. Assume good intent. Disagree with ideas, not people.

## Getting set up

Requires **Node.js >= 22** and [pnpm](https://pnpm.io/installation) (≥ 8).

```bash
git clone https://github.com/charleshonig5/askscout.git
cd askscout
pnpm install
pnpm build
```

Verify everything works:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

If any of those fail on a fresh clone, that's a bug — please open an issue.

## Repo layout

```
packages/core   shared library (askscout-core)
packages/cli    CLI published to npm as askscout
apps/web        Next.js web app (askscout.dev)
```

Cross-package dependencies use `workspace:*`. Build order is core → cli/web.

## Making changes

### Branch and commit

- Branch off `main` with a descriptive name: `fix/streak-stale-on-repo-switch`, `feat/insights-pace-caption`
- Keep commits focused. One logical change per commit
- Commit messages are short imperative subjects, optional body for the _why_. Examples:
  - `Insights: add loading-state skeletons`
  - `CLI: align with web digest output`
  - `Dashboard: hide stale streak badge during repo switch`

### Pull requests

- Open a PR against `main`. Fill out the PR template
- CI must pass: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm format:check`
- Add tests when you change behavior. Add tests when you fix a bug, even if it's a one-liner — that's how regressions stay fixed
- Update docs for any user-facing change (README, package READMEs, JSDoc on exported APIs)
- Add a [Changeset](https://github.com/changesets/changesets) entry if you're touching `packages/core` or `packages/cli`:
  ```bash
  pnpm changeset
  ```
  Pick `patch` for fixes, `minor` for additive features, `major` for breaking changes

### Style

- TypeScript strict mode is enforced — no `any` unless explicitly justified
- Prefer the existing patterns in the codebase. If you need a new pattern, document why
- Run `pnpm format` before pushing
- Follow ESLint warnings — they're tuned, not noise

## Testing

The project uses [vitest](https://vitest.dev/). Run the full suite with `pnpm test`. Run a single package's tests with `pnpm --filter askscout-core test`.

Web app tests live in `apps/web/src/lib/__tests__/`. Add tests for new logic in the same convention.

## Reporting bugs

Open a [bug report](https://github.com/charleshonig5/askscout/issues/new?template=bug_report.md). Include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Environment (OS, Node version, askscout version)

## Requesting features

Open a [feature request](https://github.com/charleshonig5/askscout/issues/new?template=feature_request.md). Describe the use case before the proposed solution — sometimes there's a simpler path.

## Security

Do not file public issues for security vulnerabilities. See [SECURITY.md](./SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
