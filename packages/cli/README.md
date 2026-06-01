# askscout

> The daily digest for vibe coders. Scout reads through your repo and tells you what you built, what changed, and where you left off.

[![npm version](https://img.shields.io/npm/v/askscout.svg)](https://www.npmjs.com/package/askscout)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/charleshonig5/askscout/blob/main/LICENSE)

## Install

```bash
npm install -g askscout
```

Requires **Node.js >= 22** and **git** on your PATH.

## Quick start

```bash
cd path/to/your/repo
askscout --setup    # one-time: configure your API key
askscout            # daily digest
```

## Sample output

```
🔍 Scout scanned myorg/myrepo
   3 commits · 8 files · past 24 hours

💬 Vibe Check
You spent the afternoon untangling the search index migration
and shipped two clean cleanup commits to finish it off. The
fingerprint cache code is a little gnarly now, worth a pass
before you stack more on top of it.

   +312 lines · -147 lines · 3 commits · 8 files

🚀 Shipped  2
  • Search index migration lands. Switched the products
    table to the new pg_trgm index. Every read path got
    re-pointed in one commit, no live-write window.
  • Cleanup of legacy search helper. Removed the old
    raw-sql search() helper that the migration replaced.
    No callers left.

🔧 Changed  1
  • Fingerprint cache TTL bumped from 60s to 300s after
    the cache-stampede on staging. Tied to a small refactor
    of the cache key shape.

📍 Left Off  1
  • Cache key shape feels fragile. The fingerprint cache
    now keys off a 3-tuple. Works but a 4th dimension is
    coming soon and the current shape won't extend cleanly.

🔑 Key Takeaways
The search migration was the day. Fingerprint cache TTL change
solved the prod incident but the new key shape is the next
thing to rethink before adding the fourth dimension.

Most Active Files
1. db/search.ts (+182 / -94, 2 commits)
2. lib/cache.ts (+78 / -41, 1 commit)
3. tests/search.test.ts (+52 / -12, 1 commit)

Codebase Health
  Growth     Steady       +312 / -147
  Focus      Sharp        2.7 files touched per commit
  Churn      Minimal      1 file reworked

Coding Timeline
10:42 am to 4:15 pm · 3 commits

Pace Check (after 3+ runs)
  Today    3 commits
  Avg      4.2 commits per recent run
  Pace     0.7× (a bit lighter than your run)
```

## Modes

```bash
askscout            # default — daily digest of recent activity
askscout --standup  # copy-paste standup formatted for Slack / Teams
askscout --resume   # AI context for pasting into your coding tools
askscout --week     # review the past 7 days
askscout --json     # output as JSON (for piping into other tools)
askscout --dry-run  # show what would be sent without calling the API
askscout --version  # print the installed version
```

## What it produces

A typical digest includes:

- **Vibe Check** — one-line read on the day's work
- **Shipped / Changed / Still Shifting / Left Off** — narrative sections
- **Key Takeaways** — what to remember
- **Stats** — lines, commits, files
- **Most Active Files** — top 3 with line counts
- **Codebase Health** — Growth / Focus / Churn indicators
- **Coding Timeline** — first to last commit of the session
- **Pace Check** — today's pace vs your rolling average (after 3+ runs)

## Privacy

The CLI runs entirely on your machine. What gets sent to your chosen LLM provider:

- Commit messages, file paths, and the diff patches (lines added + removed) for the window the run covers
- The repo's README and one project manifest (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `composer.json`, or `Gemfile`) so the model has enough context to ground the digest in the actual project
- About 15 lines of source code surrounding each changed hunk, for up to the 8 most-changed files in the window, so refactors and sparse edits can be read in context

What is **never** sent:

- Source files outside the changed regions
- Environment variables, secrets, lock files
- Build artifacts or untracked files

API keys are stored in `~/.askscout/config.json` with file mode `0600` (owner read/write only). No telemetry. No analytics.

## API keys

askScout supports two LLM providers, auto-detected from your API key format:

| Prefix | Provider | Where to get a key |
|---|---|---|
| `sk-ant-…` | Anthropic (Claude) | https://console.anthropic.com/settings/keys |
| `sk-…` | OpenAI | https://platform.openai.com/api-keys |

Run `askscout --setup` to paste your key. To switch providers later:

```bash
rm ~/.askscout/config.json
askscout --setup
```

## State file

askScout writes a small per-project state file to `<your repo>/.askscout/state.json`. It tracks:

- The timestamp of your last run (so `askscout` knows what's new)
- A capped history of recent run counts (used by Pace Check)
- A rolling project summary (refreshed each run, used as LLM context)

Nothing in the state file leaves your machine. If you'd rather not track it in version control, add `.askscout/` to your `.gitignore`.

## Environment variables

The CLI is config-file-driven, not env-var-driven — your API key lives in `~/.askscout/config.json`, not in env. The only environment variable askScout reads is the universal [`NO_COLOR`](https://no-color.org) standard:

- Set `NO_COLOR=1` (or any non-empty value) to force plain-text output without emoji or unicode block bars. Useful for piping into other tools or running in CI.

The CLI also auto-detects when stdout isn't a TTY (e.g. `askscout > digest.txt`) and falls back to the same plain-text rendering, so you usually don't need to set `NO_COLOR` explicitly.

## Web app

For hosted digest history, GitHub OAuth, the **AI Resume Prompt** button, and a richer UI, visit [askscout.dev](https://askscout.dev).

The web app provides one piece of context the CLI can't: pull request descriptions and the linked issue bodies they reference. Git doesn't store that data locally, so the CLI is intentionally diff-focused while the web app reads the wider GitHub graph.

## Source

Source, issues, and contribution guide live in the monorepo: [github.com/charleshonig5/askscout](https://github.com/charleshonig5/askscout).

## License

[MIT](https://github.com/charleshonig5/askscout/blob/main/LICENSE) © 2026 Charles Honig
