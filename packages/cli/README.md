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

The CLI runs **100% locally**. Your code never leaves your machine, except the diffs sent to your chosen LLM provider (Anthropic or OpenAI). API keys are stored in `~/.askscout/config.json` with file mode 0600 (owner read/write only).

## Provider

askscout auto-detects the provider from your API key format:

- **Anthropic** — keys starting with `sk-ant-` (recommended; slightly cheaper)
- **OpenAI** — keys starting with `sk-`

Get a key at [console.anthropic.com](https://console.anthropic.com) or [platform.openai.com](https://platform.openai.com).

## Web app

For persistent history, GitHub OAuth, and a richer UI, visit [askscout.dev](https://askscout.dev).

## Source

Source, issues, and contribution guide live in the monorepo: [github.com/charleshonig5/askscout](https://github.com/charleshonig5/askscout).

## License

[MIT](https://github.com/charleshonig5/askscout/blob/main/LICENSE) © 2026 Charles Honig
