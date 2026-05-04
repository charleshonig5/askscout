/* Plain-text Q&A pairs for the docs page FAQ. Server-importable so
   the docs route can emit a FAQPage JSON-LD schema for rich-result
   snippets in Google search alongside the rendered tabs. Two
   sections: CLI and Web app. Every question explicitly names which
   surface it applies to so readers landing on the wrong tab get
   immediate clarity. */

export const DOCS_FAQ_PLAIN: { q: string; a: string }[] = [
  {
    q: "Does the AskScout CLI work in a monorepo?",
    a: "Yes. The CLI walks up from your current directory to find the nearest .git root and reads every commit in that repo. It does not filter by subdirectory, so a digest from a monorepo covers every package and workspace inside. To scope a digest to one package, run the CLI from a separate clone of just that package.",
  },
  {
    q: "Where does the CLI store my data?",
    a: "Two places, both local. Your API key and provider live at ~/.askscout/config.json with owner-only permissions (chmod 600). Each repo also gets its own .askscout/state.json in the project root holding the last run timestamp, run count, project summary, and a small history of recent runs. The CLI sends no telemetry and stores nothing online.",
  },
  {
    q: "Why does the CLI reject my API key?",
    a: "Three reasons setup will reject a key. The key is shorter than 20 characters. The key contains characters outside letters, numbers, hyphens, or underscores. Or the prefix is not sk-ant- (Anthropic) or sk- (OpenAI). To replace a stored key, run askscout --setup again. The existing config is overwritten in place.",
  },
  {
    q: "Can I run the AskScout CLI in CI or cron?",
    a: "Yes. When the CLI runs without a TTY (piped to a file, in CI logs, or cron emails), it automatically suppresses the spinner and swaps emoji headers and unicode bullets for bracketed plain text and ASCII characters. For machine-readable output, use askscout --json. Setting NO_COLOR=1 also forces plain-text mode.",
  },
  {
    q: "How do I reset or uninstall the CLI?",
    a: "Run npm uninstall -g askscout to remove the binary. Delete ~/.askscout to clear your saved API key and provider. Delete .askscout inside any repo to clear that project's history and AI-maintained summary. These three are independent. You can uninstall the binary while keeping config, or wipe config while keeping the binary.",
  },
  {
    q: "How do I switch repos in the web app?",
    a: "Use the repo selector at the top of the sidebar in the dashboard. Picking a different repo loads its digest history immediately. To change which repo loads when you open AskScout, go to Settings and set a Default Repository there.",
  },
  {
    q: "Why does AskScout need GitHub authorization?",
    a: "Two reasons. The read:user scope identifies you to AskScout so your digests save under your GitHub account. The repo scope is what lets AskScout fetch commits and diffs from your repos through the GitHub API. GitHub does not offer a finer-grained read-only repo scope, so granting repo necessarily includes write capabilities our code never uses. You can revoke access any time at github.com/settings/applications.",
  },
  {
    q: "Why is there a 30-digest-per-day cap?",
    a: "The hosted web app uses our own LLM API key, and the cap keeps API costs predictable. 30 digests per day per account covers daily standup and end-of-day reviews. If you need more, the CLI has no AskScout-imposed cap. You bring your own API key and pay your provider directly.",
  },
  {
    q: "How do I delete my AskScout account and data?",
    a: "Settings, then Danger Zone, then Delete Account. The action removes every record tied to your user ID from our database: digests, project summaries, settings, and check-ins. You will need to sign in with GitHub again to use AskScout afterwards. To clear individual repo histories without deleting your account, use Settings, then Clear History instead.",
  },
  {
    q: "Why is Pace Check missing from my digest?",
    a: "Pace Check needs at least 3 prior digest runs to compute a baseline that is not statistical noise. On runs 1 and 2 the section is hidden by design. Keep running daily and it shows up on run 4 with a multiplier comparing today's commit count to the average of your three most recent runs.",
  },
];
