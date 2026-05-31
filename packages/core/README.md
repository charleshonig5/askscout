# askscout-core

> Shared library powering askScout — git reading, LLM digest summarization, output formatting, and project state management.

[![npm version](https://img.shields.io/npm/v/askscout-core.svg)](https://www.npmjs.com/package/askscout-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/charleshonig5/askscout/blob/main/LICENSE)

This is the engine behind the [`askscout` CLI](https://www.npmjs.com/package/askscout) and the [askscout.dev](https://askscout.dev) web app. Most users want one of those, not this package directly. Use this package if you're building your own integration on top of the same primitives.

## Install

```bash
npm install askscout-core
```

Requires **Node.js >= 22**. ESM and CJS builds are both shipped.

## What's exported

### Git reading

- `getCommits(projectRoot, since)` — read git history into typed `GitCommit[]`
- `getDiffs(projectRoot, commits)` — extract per-file diffs as `GitDiff[]`
- `getRepoName(projectRoot)` — read the repo's owner/name slug

### LLM summarization

- `summarize(commits, diffs, state, options)` — generate a structured `Digest` from git data
- `buildSystemPrompt`, `buildUnifiedSystemPrompt`, `buildAIContextSystemPrompt`, `buildStandupSystemPrompt` — the prompts the CLI and web both use
- `buildUserPrompt`, `formatCommitsForPrompt`, `formatDiffsForPrompt`, `computeStats` — lower-level helpers

### Formatting

- `formatDigest(digest, options)` — terminal-ready digest output
- `formatCodebaseHealth(commits, diffs?)` — Most Active Files + Growth / Focus / Churn indicators
- `formatCodingTimeline(commits)` — single-line session summary
- `formatPaceCheck({ todayCommits, history })` — pace multiplier vs rolling baseline
- `formatResume(digest)` — Resume Prompt output
- `formatStandup(digest)` — Standup output

All formatters auto-detect TTY / `NO_COLOR` and fall back to plain bracketed labels when piped or in CI.

### Project state

- `readState(projectRoot)`, `writeState(projectRoot, state)` — read/write `.askscout/state.json`
- `appendDigestRun(history, run)` — append a run to the rolling history (capped at `STATE_HISTORY_CAP`)
- `STATE_HISTORY_CAP` — current cap (10)

### Types

`Digest`, `DigestItem`, `DigestStats`, `DigestRunSummary`, `GitCommit`, `GitDiff`, `HealthIndicator`, `OutputMode`, `ProjectState`, `ResumeContext`, `ResumePrompt`, `Standup`, `StandupNotes`, `SummarizeOptions`, `SummarizeResult`, `TimeRange`, `UnstableItem`, `AiConfig`, `AiProvider`.

See [`src/types.ts`](https://github.com/charleshonig5/askscout/blob/main/packages/core/src/types.ts) for full type definitions.

## Example

```ts
import { getCommits, getDiffs, summarize, formatDigest, readState } from "askscout-core";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  throw new Error("Set ANTHROPIC_API_KEY (sk-ant-…) or use provider: 'openai' with OPENAI_API_KEY.");
}

const projectRoot = process.cwd();
const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
const commits = await getCommits(projectRoot, since);
const diffs = await getDiffs(projectRoot, commits);
const state = await readState(projectRoot);

const result = await summarize(commits, diffs, state, {
  apiKey,
  provider: "anthropic",
});

console.log(
  formatDigest(result.digest, {
    repoName: "your-org/your-repo",
    timeLabel: "today",
  }),
);
```

## Default models

`summarize()` defaults to a small, fast model per provider unless you override via `ai.model`:

| Provider | Default model | Override via |
|---|---|---|
| `anthropic` | `claude-haiku-4-5-20250414` | `{ provider: "anthropic", apiKey, model: "claude-sonnet-4-…" }` |
| `openai` | `gpt-4o-mini` | `{ provider: "openai", apiKey, model: "gpt-4o" }` |

The defaults are tuned for speed + cost on typical commit volumes. Larger models work fine but cost more and take longer per digest.

## Common errors

These bubble out of `summarize()` as `Error` instances. The message includes the HTTP status and the first 200 chars of the provider's response body so you can debug without re-issuing the call.

| Pattern | Likely cause | Fix |
|---|---|---|
| `Anthropic API error (401): …` | Invalid or revoked Anthropic key | Re-issue at https://console.anthropic.com/settings/keys |
| `Anthropic API error (429): …` | Rate limited or out of credit | Wait, top up credits, or switch model |
| `OpenAI API error (401): …` | Invalid OpenAI key | Re-issue at https://platform.openai.com/api-keys |
| `OpenAI API error (429): …` | Rate limited or quota exhausted | Check usage at https://platform.openai.com/usage |
| `(Anthropic\|OpenAI) API returned an unexpected response structure.` | Provider changed response shape | File an issue at https://github.com/charleshonig5/askscout/issues — likely needs a version bump |

## Stability

Pre-1.0. Public API may change between minor versions. Pin a version range that matches your tolerance.

## Source

[github.com/charleshonig5/askscout](https://github.com/charleshonig5/askscout)

## License

[MIT](https://github.com/charleshonig5/askscout/blob/main/LICENSE) © 2026 Charles Honig
