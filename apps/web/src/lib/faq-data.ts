/* Plain-text FAQ Q&A pairs. Lives in /lib (no "use client") so both
   the server-rendered MarketingHome (for JSON-LD) and the client
   FAQTabs component can import it. Keeps schema text in lockstep
   with what users read on the page. */

export const FAQ_PLAIN: { q: string; a: string }[] = [
  {
    q: "What is askScout?",
    a: "askScout is a daily digest tool for developers, designed to summarize your code changes into a readable report. It reads your git commits and diffs, then generates a clear summary of what you shipped, what changed, and what you left off. Think of it as a daily standup that writes itself, built for solo developers and vibe coders shipping fast.",
  },
  {
    q: "How does askScout work?",
    a: "Sign in with GitHub on the web, or run the askScout CLI in any local git repo. askScout pulls your commit messages and diffs from your git history, then returns a structured digest covering what shipped, what changed, what's still in progress, and what you left off. The web app stores your digest history under your account. The CLI runs entirely on your machine and stores nothing online.",
  },
  {
    q: "Is askScout free?",
    a: "Yes. The askScout web app is free to use with a soft cap of 30 digests per day across your account, which comfortably covers daily standup notes and end-of-day reviews. The askScout CLI is free open-source software under the MIT license. With the CLI you bring your own API key, which typically costs $0.001 to $0.003 per digest depending on commit volume and repo size.",
  },
  {
    q: "How do I install the askScout CLI?",
    a: "Install the askScout CLI globally with npm install -g askscout, then run askscout --setup to add your API key (saved with owner-only file permissions in your home folder). After setup, run askscout in any git repo to generate a digest of recent commits. Full installation and usage instructions are in the CLI docs.",
  },
  {
    q: "Can askScout summarize what I shipped this week?",
    a: "Yes. Run askScout in your repo or open the web app, and it generates a daily digest of what shipped, what changed, and what you left off across your recent git commits. Each digest covers commits since the last run, so checking in once a day or once a week gives you a clear summary of what you shipped without scrolling through git log or browsing GitHub activity manually.",
  },
  {
    q: "Does askScout read my source code?",
    a: "No. askScout reads only commit messages and diffs, meaning the specific lines added and removed in each git commit. Full source files, environment variables, secrets, build artifacts, and untracked files are never accessed or transmitted. A diff only contains code that actually changed in a commit, not your entire codebase or repository state.",
  },
  {
    q: "Is askScout safe to use on my repo?",
    a: "Yes. askScout's code only ever reads from your repo, never writes, modifies, or deletes anything. The full codebase is open source under the MIT license, so you can audit exactly what it does and how it handles your data. The web app uses GitHub OAuth, which you can revoke any time at github.com/settings/applications.",
  },
  {
    q: "What data does askScout store?",
    a: "The web app stores your digest history under your GitHub account in a private database, so you can revisit past digests anytime. The askScout CLI stores nothing online, with no telemetry or analytics. Locally, the CLI saves your API key in ~/.askscout/config.json with owner-only file permissions, plus a small per-project state file in .askscout/state.json that tracks pace and run history.",
  },
  {
    q: "Can I delete my askScout data?",
    a: "Yes. On the web app, Settings → Danger Zone → Delete Account permanently removes every digest, summary, and record tied to your user ID. You can also clear individual repo histories without deleting your account. For the CLI, just remove the ~/.askscout folder from your home directory and any .askscout folder inside your project to wipe local state.",
  },
  {
    q: "Is askScout open source?",
    a: "Yes. askScout is fully open source under the MIT license. The complete codebase, including the web app, the CLI, and the shared core library, is public on GitHub. You can read every line, fork the project, audit how your data is handled, or contribute improvements through pull requests.",
  },
  {
    q: "What's the difference between the web app and the CLI?",
    a: "The askScout web app runs in your browser, signs in with GitHub, and stores your digest history under your account so you can revisit past summaries. The askScout CLI runs locally in any git repo, uses your own API key, and stores nothing online beyond the calls to your provider. Same digest format and same daily summary, two surfaces, depending on whether you want a hosted history or a fully local workflow.",
  },
  {
    q: "Does askScout work with private repos?",
    a: "Yes. Once you grant access during GitHub sign-in, the askScout web app generates digests for any repo on your account, public or private, including organization repositories you have access to. The CLI works on any local git repository by default since it reads from your local clone, so private repo support is automatic with no extra configuration.",
  },
  {
    q: "Does askScout work with GitLab or Bitbucket?",
    a: "The askScout CLI works with any git repo regardless of host, including GitLab, Bitbucket, Codeberg, Gitea, and self-hosted git servers, because it reads from your local clone rather than calling a host API. The web app currently only supports GitHub OAuth for sign-in.",
  },
  {
    q: "How accurate is the askScout digest?",
    a: "The digest is automatically generated from your real git history, so it can occasionally miss nuance or restate the same change twice across sections. It stays grounded in your actual commit messages and diffs rather than working from memory, which keeps the output close to what you really shipped. For day-to-day tracking, standup notes, weekly reviews, and remembering your own work, the digest is reliably useful.",
  },
  {
    q: "Is there a usage limit?",
    a: "The askScout web app has a soft cap of 30 digests per day across your entire account, which covers daily standup notes, end-of-day reviews, and weekly summaries comfortably. The CLI has no askScout-imposed usage limit, so you can run digests as often as you want. The only limits there are your provider's API rate limits and your own spend on the key you bring.",
  },
];
