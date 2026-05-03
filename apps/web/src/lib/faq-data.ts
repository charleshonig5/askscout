/* Plain-text FAQ Q&A pairs. Lives in /lib (no "use client") so both
   the server-rendered MarketingHome (for JSON-LD FAQPage schema) and
   the client FAQTabs component can import it. Keeps schema text in
   lockstep with what users read on the page. */

export const FAQ_PLAIN: { q: string; a: string }[] = [
  {
    q: "What is askscout?",
    a: "askscout is a daily digest tool for developers. It reads your git commits and diffs, then generates a clear summary of what you shipped each day. Think of it as a daily standup that writes itself, built for solo devs and vibe coders.",
  },
  {
    q: "How does askscout work?",
    a: "Sign in with GitHub on the web, or run the askscout CLI in any local git repo. askscout reads your commit messages and diffs and returns a structured digest of what shipped, what changed, and what you left off. The web app stores your digest history; the CLI runs entirely on your machine.",
  },
  {
    q: "Is askscout free?",
    a: "Yes. The askscout web app is free to use with a soft cap of 30 digests per day, which is plenty for daily standup or end-of-day reflection. The CLI is free open-source software. With the CLI you bring your own API key, which costs roughly $0.001 to $0.003 per digest depending on repo size.",
  },
  {
    q: "How do I install the askscout CLI?",
    a: "Install the CLI globally with npm install -g askscout, then run askscout --setup to add your API key. After setup, run askscout in any git repo to generate a digest of recent commits. Full instructions are in the CLI docs.",
  },
  {
    q: "Can askscout summarize what I shipped this week?",
    a: "Yes. Run askscout in your repo or open the web app, and it generates a daily digest of what shipped, what changed, and what you left off. Each digest covers commits since the last run, so checking in once a day or once a week gives you a clear summary of what you shipped without scrolling through git log.",
  },
  {
    q: "Does askscout read my source code?",
    a: "No. askscout reads commit messages and diffs (the lines added and removed in each commit). Full source files, environment variables, secrets, and build artifacts are never accessed. Diffs only contain code that actually changed in a commit, not your entire codebase.",
  },
  {
    q: "Is askscout safe to use on my repo?",
    a: "Yes. askscout's code only ever reads from your repo, never writes to it. The codebase is open source under the MIT license, so you can audit exactly what it does. The web app uses GitHub OAuth, which you can revoke any time at github.com/settings/applications.",
  },
  {
    q: "What data does askscout store?",
    a: "The web app stores your digest history under your GitHub account in a private database, so you can revisit past digests. The CLI stores nothing online. Locally, the CLI saves your LLM API key in ~/.askscout/config.json (owner-only permissions) and a small per-project state file in .askscout/state.json for pace tracking.",
  },
  {
    q: "Can I delete my askscout data?",
    a: "Yes. On the web app, Settings → Danger Zone → Delete Account removes every record tied to your user ID. You can also clear individual repo histories without deleting your account. For the CLI, just remove ~/.askscout and any .askscout folder from your project to wipe local state.",
  },
  {
    q: "Is askscout open source?",
    a: "Yes. askscout is open source under the MIT license. The full codebase, including the web app, CLI, and core library, is public on GitHub. You can read, fork, audit, or contribute to any part of it.",
  },
  {
    q: "What's the difference between the web app and the CLI?",
    a: "The askscout web app runs in your browser, signs in with GitHub, and stores your digest history under your account. The askscout CLI runs locally in any git repo, uses your own API key, and stores nothing online. Same digest format, two surfaces, depending on whether you want a hosted history or a local-only workflow.",
  },
  {
    q: "Does askscout work with private repos?",
    a: "Yes. Once you grant access during GitHub sign-in, the askscout web app generates digests for any repo on your account, public or private. The CLI works on any local git repo by default since it reads from your local clone, so private repo support is automatic.",
  },
  {
    q: "Does askscout work with GitLab or Bitbucket?",
    a: "The askscout CLI works with any git repo regardless of host, including GitLab, Bitbucket, and self-hosted git servers, because it reads from your local clone. The web app currently only supports GitHub OAuth.",
  },
  {
    q: "How accurate is the askscout digest?",
    a: "The digest is automatically generated, so it can occasionally miss nuance or restate the same change twice. It stays grounded in your actual commit messages and diffs rather than working from memory, which keeps the output close to what you really shipped. For day-to-day tracking, standup notes, and remembering your work, the digest is reliably useful.",
  },
  {
    q: "Is there a usage limit?",
    a: "The askscout web app has a soft cap of 30 digests per day across your account, which covers daily standup and end-of-day reviews comfortably. The CLI has no askscout usage limit; the only limits are your provider's rate limits and your own spend on whichever API you connect.",
  },
];
