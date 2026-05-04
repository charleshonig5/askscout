/* Plain-text Q&A pairs for the docs page FAQ. Server-importable so
   the docs route can emit a FAQPage JSON-LD schema for rich-result
   snippets in Google search alongside the rendered tabs. */

export const DOCS_FAQ_PLAIN: { q: string; a: string }[] = [
  {
    q: "Does AskScout work in a monorepo?",
    a: "Yes. AskScout reads commits at the repo root, so it sees activity across every package and workspace inside your monorepo. It does not filter by directory, so the digest covers everything that landed in any commit during the time window. If you want a digest scoped to one package, run AskScout from a separate checkout of just that package.",
  },
  {
    q: "How do I change which model AskScout uses?",
    a: "Open ~/.askscout/config.json and add a \"model\" field with the model ID you want. AskScout uses that on the next run instead of the default. The model has to belong to the same provider as your key. Anthropic keys can only target Anthropic models, and OpenAI keys can only target OpenAI models.",
  },
  {
    q: "Can I run AskScout in CI or cron?",
    a: "Yes. Use askscout --json for parseable output, or pipe the default output to a file. AskScout drops the spinner, emoji, and color automatically when stdout is not a TTY, so logs stay readable in CI output and cron emails.",
  },
  {
    q: "Does the AskScout CLI work on Windows?",
    a: "Yes, on Node 22 or later via PowerShell, CMD, or WSL. The config lives at %USERPROFILE%\\.askscout\\config.json on Windows. Per-project state lives at .askscout\\state.json in each repo.",
  },
  {
    q: "How do I uninstall AskScout?",
    a: "Run npm uninstall -g askscout to remove the CLI. Delete ~/.askscout if you also want to clear your saved API key, and delete any .askscout folders inside repos to remove per-project state.",
  },
  {
    q: "What does \"Scout didn't find any new commits\" mean?",
    a: "AskScout looks at commits since your last run by default, so an empty window just means nothing landed since you last checked. Try askscout --week for the past 7 days, or askscout --dry-run to see exactly what is in the window.",
  },
  {
    q: "Why does AskScout reject my API key?",
    a: "Keys are validated by prefix. Anthropic keys start with sk-ant- and OpenAI keys start with sk-. Anything else is rejected at setup. To replace a stored key with a new one, run askscout --setup again. The existing config is overwritten in place.",
  },
  {
    q: "Why is Pace Check missing from my digest?",
    a: "Pace Check needs at least 3 prior digest runs to compute a baseline that is not statistical noise. On runs 1 and 2 the section is hidden. Keep running daily and it shows up on run 4.",
  },
  {
    q: "How do I reset AskScout completely?",
    a: "Delete ~/.askscout to clear your config and global state. Delete .askscout inside a repo to clear that project's history and AI-maintained summary. The next run is treated as a fresh first run.",
  },
];
