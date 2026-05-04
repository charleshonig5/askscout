"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type DocsFAQItem = { q: string; a: React.ReactNode };
type DocsFAQTab = { id: string; label: string; items: DocsFAQItem[] };

const TABS: DocsFAQTab[] = [
  {
    id: "cli",
    label: "CLI",
    items: [
      {
        q: "Does the AskScout CLI work in a monorepo?",
        a: (
          <p>
            Yes. The CLI walks up from your current directory to find the nearest{" "}
            <code>.git</code> root and reads every commit in that repo. It does not filter by
            subdirectory, so a digest from a monorepo covers every package and workspace
            inside. To scope a digest to one package, run the CLI from a separate clone of just
            that package.
          </p>
        ),
      },
      {
        q: "Where does the CLI store my data?",
        a: (
          <p>
            Two places, both local. Your API key and provider live at{" "}
            <code>~/.askscout/config.json</code> with owner-only permissions (
            <code>chmod 600</code>). Each repo also gets its own{" "}
            <code>.askscout/state.json</code> in the project root holding the last run
            timestamp, run count, project summary, and a small history of recent runs. The CLI
            sends no telemetry and stores nothing online.
          </p>
        ),
      },
      {
        q: "Why does the CLI reject my API key?",
        a: (
          <p>
            Three reasons setup will reject a key. The key is shorter than 20 characters. The
            key contains characters outside letters, numbers, hyphens, or underscores. Or the
            prefix is not <code>sk-ant-</code> (Anthropic) or <code>sk-</code> (OpenAI). To
            replace a stored key, run <code>askscout --setup</code> again. The existing config
            is overwritten in place.
          </p>
        ),
      },
      {
        q: "Can I run the AskScout CLI in CI or cron?",
        a: (
          <p>
            Yes. When the CLI runs without a TTY (piped to a file, in CI logs, or cron
            emails), it automatically suppresses the spinner and swaps emoji headers and
            unicode bullets for bracketed plain text and ASCII characters. For
            machine-readable output, use <code>askscout --json</code>. Setting{" "}
            <code>NO_COLOR=1</code> also forces plain-text mode.
          </p>
        ),
      },
      {
        q: "How do I reset or uninstall the CLI?",
        a: (
          <p>
            Run <code>npm uninstall -g askscout</code> to remove the binary. Delete{" "}
            <code>~/.askscout</code> to clear your saved API key and provider. Delete{" "}
            <code>.askscout</code> inside any repo to clear that project&apos;s history and
            AI-maintained summary. These three are independent. You can uninstall the binary
            while keeping config, or wipe config while keeping the binary.
          </p>
        ),
      },
    ],
  },
  {
    id: "web",
    label: "Web app",
    items: [
      {
        q: "How do I switch repos in the web app?",
        a: (
          <p>
            Use the repo selector at the top of the sidebar in the dashboard. Picking a
            different repo loads its digest history immediately. To change which repo loads
            when you open AskScout, go to Settings and set a Default Repository there.
          </p>
        ),
      },
      {
        q: "Why does AskScout need GitHub authorization?",
        a: (
          <p>
            Two reasons. The <code>read:user</code> scope identifies you to AskScout so your
            digests save under your GitHub account. The <code>repo</code> scope is what lets
            AskScout fetch commits and diffs from your repos through the GitHub API. GitHub
            does not offer a finer-grained read-only repo scope, so granting{" "}
            <code>repo</code> necessarily includes write capabilities our code never uses. You
            can revoke access any time at{" "}
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
        q: "Why is there a 30-digest-per-day cap?",
        a: (
          <p>
            The hosted web app uses our own LLM API key, and the cap keeps API costs
            predictable. 30 digests per day per account covers daily standup and end-of-day
            reviews. If you need more, the CLI has no AskScout-imposed cap. You bring your own
            API key and pay your provider directly.
          </p>
        ),
      },
      {
        q: "How do I delete my AskScout account and data?",
        a: (
          <p>
            Settings, then Danger Zone, then Delete Account. The action removes every record
            tied to your user ID from our database: digests, project summaries, settings, and
            check-ins. You will need to sign in with GitHub again to use AskScout afterwards.
            To clear individual repo histories without deleting your account, use Settings,
            then Clear History instead.
          </p>
        ),
      },
      {
        q: "How do I share or export a digest?",
        a: (
          <p>
            Every digest in the dashboard has three share actions in the header.{" "}
            <strong>Copy</strong> puts the digest on your clipboard as markdown, ready to
            paste into Slack or any markdown-aware tool. <strong>Download</strong> saves the
            same markdown as a <code>.md</code> file named after the repo and date.{" "}
            <strong>Email</strong> sends the digest to the address tied to your account.
          </p>
        ),
      },
    ],
  },
];

export default function DocsFAQ() {
  const [active, setActive] = useState(TABS[0]!.id);
  const activeTab = TABS.find((t) => t.id === active) ?? TABS[0]!;

  return (
    <div className="home-faq-wrap">
      <div className="home-faq-tabs" role="tablist" aria-label="Docs FAQ categories">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === active}
            aria-controls={`docs-faq-panel-${t.id}`}
            id={`docs-faq-tab-${t.id}`}
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
        id={`docs-faq-panel-${activeTab.id}`}
        aria-labelledby={`docs-faq-tab-${activeTab.id}`}
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
