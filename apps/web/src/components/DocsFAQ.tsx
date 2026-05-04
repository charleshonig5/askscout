"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type DocsFAQItem = { q: string; a: React.ReactNode };
type DocsFAQTab = { id: string; label: string; items: DocsFAQItem[] };

const TABS: DocsFAQTab[] = [
  {
    id: "use",
    label: "Using AskScout",
    items: [
      {
        q: "Does AskScout work in a monorepo?",
        a: (
          <p>
            Yes. AskScout reads commits at the repo root, so it sees activity across every
            package and workspace inside your monorepo. It does not filter by directory, so the
            digest covers everything that landed in any commit during the time window. If you
            want a digest scoped to one package, run AskScout from a separate checkout of just
            that package.
          </p>
        ),
      },
      {
        q: "How do I change which model AskScout uses?",
        a: (
          <p>
            Open <code>~/.askscout/config.json</code> and add a <code>"model"</code> field with
            the model ID you want. AskScout uses that on the next run instead of the default.
            The model has to belong to the same provider as your key. Anthropic keys can only
            target Anthropic models, and OpenAI keys can only target OpenAI models.
          </p>
        ),
      },
      {
        q: "Can I run AskScout in CI or cron?",
        a: (
          <p>
            Yes. Use <code>askscout --json</code> for parseable output, or pipe the default
            output to a file. AskScout drops the spinner, emoji, and color automatically when
            stdout is not a TTY, so logs stay readable in CI output and cron emails.
          </p>
        ),
      },
      {
        q: "Does the AskScout CLI work on Windows?",
        a: (
          <p>
            Yes, on Node 22 or later via PowerShell, CMD, or WSL. The config lives at{" "}
            <code>%USERPROFILE%\.askscout\config.json</code> on Windows. Per-project state lives
            at <code>.askscout\state.json</code> in each repo.
          </p>
        ),
      },
    ],
  },
  {
    id: "trouble",
    label: "Troubleshooting",
    items: [
      {
        q: "What does \"Scout didn't find any new commits\" mean?",
        a: (
          <p>
            AskScout looks at commits since your last run by default, so an empty window just
            means nothing landed since you last checked. Try <code>askscout --week</code> for
            the past 7 days, or <code>askscout --dry-run</code> to see exactly what is in the
            window.
          </p>
        ),
      },
      {
        q: "Why does AskScout reject my API key?",
        a: (
          <p>
            Keys are validated by prefix. Anthropic keys start with <code>sk-ant-</code> and
            OpenAI keys start with <code>sk-</code>. Anything else is rejected at setup. To
            replace a stored key with a new one, run <code>askscout --setup</code> again. The
            existing config is overwritten in place.
          </p>
        ),
      },
      {
        q: "Why is Pace Check missing from my digest?",
        a: (
          <p>
            Pace Check needs at least 3 prior digest runs to compute a baseline that is not
            statistical noise. On runs 1 and 2 the section is hidden. Keep running daily and it
            shows up on run 4.
          </p>
        ),
      },
      {
        q: "How do I uninstall AskScout?",
        a: (
          <p>
            Run <code>npm uninstall -g askscout</code> to remove the CLI. Delete{" "}
            <code>~/.askscout</code> if you also want to clear your saved API key, and delete
            any <code>.askscout</code> folders inside repos to remove per-project state.
          </p>
        ),
      },
      {
        q: "How do I reset AskScout completely?",
        a: (
          <p>
            Delete <code>~/.askscout</code> to clear your config and global state. Delete{" "}
            <code>.askscout</code> inside a repo to clear that project's history and
            AI-maintained summary. The next run is treated as a fresh first run.
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
