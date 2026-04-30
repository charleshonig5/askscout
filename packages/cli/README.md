# askscout

> The daily digest for vibe coders. Scout reads through your repo and tells you what you built, what changed, and where you left off.

[![npm version](https://img.shields.io/npm/v/askscout.svg)](https://www.npmjs.com/package/askscout)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/charleshonig5/askscout/blob/main/LICENSE)

## Install

```bash
npm install -g askscout
```

Requires **Node.js >= 22**.

## Quick start

```bash
cd path/to/your/repo
askscout --setup    # one-time: configure your API key
askscout            # daily digest
```

## Modes

```bash
askscout            # default — daily digest of recent activity
askscout --standup  # copy-paste standup formatted for Slack / Teams
askscout --resume   # AI context for pasting into your coding tools
askscout --week     # review the past 7 days
askscout --json     # output as JSON (for piping into other tools)
askscout --dry-run  # show what would be sent without calling the API
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

The CLI runs **100% locally**. Your code never leaves your machine, except the diffs sent to your chosen LLM provider. API keys are stored in `~/.askscout/config.json` with file mode 0600 (owner read/write only).

## API keys

askscout supports two LLM providers, auto-detected from your API key format:

- Keys starting with `sk-ant-` use one provider (typically slightly cheaper per digest)
- Keys starting with `sk-` use the other

Either works. Sign up with the LLM provider of your choice and paste the key during `askscout --setup`.

## Environment variables

The CLI is config-file-driven, not env-var-driven — your API key lives in `~/.askscout/config.json`, not in env. The only environment variable askscout reads is the universal [`NO_COLOR`](https://no-color.org) standard:

- Set `NO_COLOR=1` (or any non-empty value) to force plain-text output without emoji or unicode block bars. Useful for piping into other tools or running in CI.

The CLI also auto-detects when stdout isn't a TTY (e.g. `askscout > digest.txt`) and falls back to the same plain-text rendering, so you usually don't need to set `NO_COLOR` explicitly.

## Web app

For persistent history, GitHub OAuth, and a richer UI, visit [askscout.dev](https://askscout.dev).

## Source

Source, issues, and contribution guide live in the monorepo: [github.com/charleshonig5/askscout](https://github.com/charleshonig5/askscout).

## License

[MIT](https://github.com/charleshonig5/askscout/blob/main/LICENSE) © 2026 Charles Honig
