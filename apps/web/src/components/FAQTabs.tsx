"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

type FAQItem = { q: string; a: React.ReactNode };
type FAQTab = { id: string; label: string; items: FAQItem[] };

const TABS: FAQTab[] = [
  {
    id: "start",
    label: "Getting started",
    items: [
      {
        q: "What is askscout?",
        a: (
          <p>
            askscout is an AI-powered daily digest tool for developers. It reads your git commits
            and diffs, then generates a clear summary of what you shipped each day. Think of it
            as a daily standup that writes itself, built for solo devs and vibe coders.
          </p>
        ),
      },
      {
        q: "How does askscout work?",
        a: (
          <p>
            Sign in with GitHub on the web, or run the askscout CLI in any local git repo. askscout
            reads your commit messages and diffs, sends them to Anthropic or OpenAI, and returns a
            structured digest of what shipped, what changed, and what you left off. The web app
            stores your digest history; the CLI runs entirely on your machine.
          </p>
        ),
      },
      {
        q: "Is askscout free?",
        a: (
          <p>
            Yes. The askscout web app is free to use with a soft cap of 30 digests per day, which
            is plenty for daily standup or end-of-day reflection. The CLI is free open-source
            software. With the CLI you bring your own LLM API key, which costs roughly $0.001 to
            $0.003 per digest depending on repo size and provider.
          </p>
        ),
      },
      {
        q: "How do I install the askscout CLI?",
        a: (
          <p>
            Install the CLI globally with <code>npm install -g askscout</code>, then run{" "}
            <code>askscout --setup</code> to add your Anthropic or OpenAI API key. After setup,
            run <code>askscout</code> in any git repo to generate a digest of recent commits. Full
            instructions are in the <Link href="/docs">CLI docs</Link>.
          </p>
        ),
      },
      {
        q: "Can askscout summarize what I shipped this week?",
        a: (
          <p>
            Yes. Run askscout in your repo or open the web app, and it generates a daily digest
            of what shipped, what changed, and what you left off. Each digest covers commits
            since the last run, so checking in once a day or once a week gives you a clear
            summary of what you shipped without scrolling through git log.
          </p>
        ),
      },
    ],
  },
  {
    id: "privacy",
    label: "Privacy & security",
    items: [
      {
        q: "Does askscout read my source code?",
        a: (
          <p>
            No. askscout reads commit messages and diffs (the lines added and removed in each
            commit). Full source files, environment variables, secrets, and build artifacts are
            never accessed. Diffs only contain code that actually changed in a commit, not your
            entire codebase.
          </p>
        ),
      },
      {
        q: "Is askscout safe to use on my repo?",
        a: (
          <p>
            Yes. askscout&apos;s code only ever reads from your repo, never writes to it. The
            codebase is open source under the MIT license, so you can audit exactly what it
            does. The web app uses GitHub OAuth, which you can revoke any time at{" "}
            <a
              href="https://github.com/settings/applications"
              target="_blank"
              rel="noopener noreferrer"
              className="home-prose-link"
            >
              github.com/settings/applications
            </a>
            .
          </p>
        ),
      },
      {
        q: "What data does askscout store?",
        a: (
          <p>
            The web app stores your digest history under your GitHub account in a private
            database, so you can revisit past digests. The CLI stores nothing online. Locally,
            the CLI saves your LLM API key in <code>~/.askscout/config.json</code> (owner-only
            permissions) and a small per-project state file in <code>.askscout/state.json</code>{" "}
            for pace tracking.
          </p>
        ),
      },
      {
        q: "Can I delete my askscout data?",
        a: (
          <p>
            Yes. On the web app, Settings → Danger Zone → Delete Account removes every record
            tied to your user ID. You can also clear individual repo histories without deleting
            your account. For the CLI, just remove <code>~/.askscout</code> and any{" "}
            <code>.askscout</code> folder from your project to wipe local state.
          </p>
        ),
      },
      {
        q: "Is askscout open source?",
        a: (
          <p>
            Yes. askscout is open source under the MIT license. The full codebase, including the
            web app, CLI, and core library, is public on{" "}
            <a
              href="https://github.com/charleshonig5/askscout"
              target="_blank"
              rel="noopener noreferrer"
              className="home-prose-link"
            >
              GitHub
            </a>
            . You can read, fork, audit, or contribute to any part of it.
          </p>
        ),
      },
    ],
  },
  {
    id: "details",
    label: "Product details",
    items: [
      {
        q: "What's the difference between the web app and the CLI?",
        a: (
          <p>
            The askscout web app runs in your browser, signs in with GitHub, and stores your
            digest history under your account. The askscout CLI runs locally in any git repo,
            uses your own Anthropic or OpenAI API key, and stores nothing online. Same digest
            format, two surfaces, depending on whether you want a hosted history or a local-only
            workflow.
          </p>
        ),
      },
      {
        q: "Does askscout work with private repos?",
        a: (
          <p>
            Yes. Once you grant access during GitHub sign-in, the askscout web app generates
            digests for any repo on your account, public or private. The CLI works on any local
            git repo by default since it reads from your local clone, so private repo support is
            automatic.
          </p>
        ),
      },
      {
        q: "Does askscout work with GitLab or Bitbucket?",
        a: (
          <p>
            The askscout CLI works with any git repo regardless of host, including GitLab,
            Bitbucket, and self-hosted git servers, because it reads from your local clone. The
            web app currently only supports GitHub OAuth.
          </p>
        ),
      },
      {
        q: "How accurate is the askscout digest?",
        a: (
          <p>
            The digest is generated by an LLM (Claude or GPT), so it can occasionally miss
            nuance or restate the same change twice. It stays grounded in your actual commit
            messages and diffs rather than working from memory, which keeps the output close to
            what you really shipped. For day-to-day tracking, standup notes, and remembering
            your work, the digest is reliably useful.
          </p>
        ),
      },
      {
        q: "Is there a usage limit?",
        a: (
          <p>
            The askscout web app has a soft cap of 30 digests per day across your account, which
            covers daily standup and end-of-day reviews comfortably. The CLI has no askscout
            usage limit; the only limits are your LLM provider&apos;s rate limits and your own
            spend on Anthropic or OpenAI.
          </p>
        ),
      },
    ],
  },
];

export default function FAQTabs() {
  const [active, setActive] = useState(TABS[0]!.id);
  const activeTab = TABS.find((t) => t.id === active) ?? TABS[0]!;

  return (
    <div className="home-faq-wrap">
      <div className="home-faq-tabs" role="tablist" aria-label="FAQ categories">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === active}
            aria-controls={`faq-panel-${t.id}`}
            id={`faq-tab-${t.id}`}
            className={`home-faq-tab ${t.id === active ? "home-faq-tab--active" : ""}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        className="home-faq"
        role="tabpanel"
        id={`faq-panel-${activeTab.id}`}
        aria-labelledby={`faq-tab-${activeTab.id}`}
      >
        {activeTab.items.map((item, i) => (
          <details key={`${activeTab.id}-${i}`} className="home-faq-item">
            <summary className="home-faq-question">
              <span>{item.q}</span>
              <ChevronDown
                size={16}
                strokeWidth={1.5}
                className="home-faq-chevron"
                aria-hidden
              />
            </summary>
            <div className="home-faq-answer">{item.a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
