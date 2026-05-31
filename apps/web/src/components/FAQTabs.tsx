"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { FAQTablist } from "@/components/FAQTablist";

/**
 * FAQ section per Figma 244:2605.
 *
 * Layout: header row with a Pridi 36px title on the left and a
 * segmented tab control on the right (Getting Started / Product
 * Details / Privacy & Security). The selected tab gets the
 * bg-secondary fill + inset glow; the others render as #616161
 * text only. Below the header sits a single rounded card holding
 * the active tab's questions, each row collapsing/expanding via
 * native `<details>` so the section works without JS and stays
 * SSR-clean.
 *
 * All rows start closed by default. The Figma comp shows one row
 * open and one closed as a state example only.
 */

type FAQItem = { q: string; a: React.ReactNode };
type FAQTab = { id: string; label: string; items: FAQItem[] };

const TABS: FAQTab[] = [
  {
    id: "start",
    label: "Getting started",
    items: [
      {
        q: "What is AskScout?",
        a: (
          <p>
            AskScout is a daily digest tool for developers, designed to summarize your code
            changes into a readable report. It reads your git commits and diffs, then generates
            a clear summary of what you shipped, what changed, and what you left off. Think of
            it as a daily standup that writes itself, built for solo developers and vibe coders
            shipping fast.
          </p>
        ),
      },
      {
        q: "How does AskScout work?",
        a: (
          <p>
            Sign in with GitHub on the web, or run the AskScout CLI in any local git repo.
            AskScout pulls your commit messages and diffs from your git history, then returns a
            structured digest covering what shipped, what changed, what&apos;s still in progress,
            and what you left off. The web app stores your digest history under your account.
            The CLI runs entirely on your machine and stores nothing online.
          </p>
        ),
      },
      {
        q: "Is AskScout free?",
        a: (
          <p>
            Yes. The AskScout web app is free to use with a soft cap of 30 digests per day across
            your account, which comfortably covers daily standup notes and end-of-day reviews.
            The AskScout CLI is free open-source software under the MIT license. With the CLI you
            bring your own API key, which typically costs $0.001 to $0.003 per digest depending
            on commit volume and repo size.
          </p>
        ),
      },
      {
        q: "How do I install the AskScout CLI?",
        a: (
          <p>
            Install the AskScout CLI globally with <code>npm install -g askscout</code>, then run{" "}
            <code>askscout --setup</code> to add your API key (saved with owner-only file
            permissions in your home folder). After setup, run <code>askscout</code> in any git
            repo to generate a digest of recent commits. Full installation and usage
            instructions are in the <Link href="/docs">CLI docs</Link>.
          </p>
        ),
      },
      {
        q: "Can AskScout summarize what I shipped this week?",
        a: (
          <p>
            Yes. Run AskScout in your repo or open the web app, and it generates a daily digest
            of what shipped, what changed, and what you left off across your recent git commits.
            Each digest covers commits since the last run, so checking in once a day or once a
            week gives you a clear summary of what you shipped without scrolling through git log
            or browsing GitHub activity manually.
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
            The AskScout web app runs in your browser, signs in with GitHub, and stores your
            digest history under your account so you can revisit past summaries. The AskScout
            CLI runs locally in any git repo, uses your own API key, and stores nothing online
            beyond the calls to your provider. Same digest format and same daily summary, two
            surfaces, depending on whether you want a hosted history or a fully local workflow.
          </p>
        ),
      },
      {
        q: "Does AskScout work with private repos?",
        a: (
          <p>
            Yes. Once you grant access during GitHub sign-in, the AskScout web app generates
            digests for any repo on your account, public or private, including organization
            repositories you have access to. The CLI works on any local git repository by
            default since it reads from your local clone, so private repo support is automatic
            with no extra configuration.
          </p>
        ),
      },
      {
        q: "Does AskScout work with GitLab or Bitbucket?",
        a: (
          <p>
            The AskScout CLI works with any git repo regardless of host, including GitLab,
            Bitbucket, Codeberg, Gitea, and self-hosted git servers, because it reads from your
            local clone rather than calling a host API. The web app currently only supports
            GitHub OAuth for sign-in.
          </p>
        ),
      },
      {
        q: "How accurate is the AskScout digest?",
        a: (
          <p>
            The digest is automatically generated from your real git history, so it can
            occasionally miss nuance or restate the same change twice across sections. It stays
            grounded in your actual commit messages and diffs rather than working from memory,
            which keeps the output close to what you really shipped. For day-to-day tracking,
            standup notes, weekly reviews, and remembering your own work, the digest is
            reliably useful.
          </p>
        ),
      },
      {
        q: "Is there a usage limit?",
        a: (
          <p>
            The AskScout web app has a soft cap of 30 digests per day across your entire
            account, which covers daily standup notes, end-of-day reviews, and weekly summaries
            comfortably. The CLI has no AskScout-imposed usage limit, so you can run digests as
            often as you want. The only limits there are your provider&apos;s API rate limits
            and your own spend on the key you bring.
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
        q: "Does AskScout read my source code?",
        a: (
          <p>
            No. AskScout reads only commit messages and diffs, meaning the specific lines added
            and removed in each git commit. Full source files, environment variables, secrets,
            build artifacts, and untracked files are never accessed or transmitted. A diff only
            contains code that actually changed in a commit, not your entire codebase or
            repository state.
          </p>
        ),
      },
      {
        q: "Is AskScout safe to use on my repo?",
        a: (
          <p>
            Yes. AskScout&apos;s code only ever reads from your repo, never writes, modifies,
            or deletes anything. The full codebase is open source under the MIT license, so you
            can audit exactly what it does and how it handles your data. The web app uses GitHub
            OAuth, which you can revoke any time at{" "}
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
        q: "What data does AskScout store?",
        a: (
          <p>
            The web app stores your digest history under your GitHub account in a private
            database, so you can revisit past digests anytime. The AskScout CLI stores nothing
            online, with no telemetry or analytics. Locally, the CLI saves your API key in{" "}
            <code>~/.askscout/config.json</code> with owner-only file permissions, plus a small
            per-project state file in <code>.askscout/state.json</code> that tracks pace and run
            history.
          </p>
        ),
      },
      {
        q: "Can I delete my AskScout data?",
        a: (
          <p>
            Yes. On the web app, Settings → Danger Zone → Delete Account permanently removes
            every digest, summary, and record tied to your user ID. You can also clear
            individual repo histories without deleting your account. For the CLI, just remove
            the <code>~/.askscout</code> folder from your home directory and any{" "}
            <code>.askscout</code> folder inside your project to wipe local state.
          </p>
        ),
      },
      {
        q: "Is AskScout open source?",
        a: (
          <p>
            Yes. AskScout is fully open source under the MIT license. The complete codebase,
            including the web app, the CLI, and the shared core library, is public on{" "}
            <a
              href="https://github.com/charleshonig5/askscout"
              target="_blank"
              rel="noopener noreferrer"
              className="home-prose-link"
            >
              GitHub
            </a>
            . You can read every line, fork the project, audit how your data is handled, or
            contribute improvements through pull requests.
          </p>
        ),
      },
    ],
  },
];

export default function FAQTabs() {
  const [active, setActive] = useState(TABS[0]!.id);

  return (
    <div className="home-faq-section">
      <div className="home-faq-header">
        <h2 className="home-faq-title">Frequently asked questions</h2>
        <FAQTablist
          tabs={TABS.map((t) => ({ id: t.id, label: t.label }))}
          active={active}
          onChange={setActive}
          ariaLabel="FAQ categories"
          panelIdPrefix="faq-panel"
          tabIdPrefix="faq-tab"
        />
      </div>
      {/* Render every tab's panel into the initial HTML — only the
          active one is visible (others get display:none via the
          hidden modifier). Trade-off: a few extra hidden DOM nodes
          in exchange for AI search bots / LLM crawlers seeing all
          15 Q&As without needing to execute JS to switch tabs. The
          FAQPage JSON-LD already covers the schema side; this
          covers the plain-DOM side. */}
      {TABS.map((tab) => (
        <div
          key={tab.id}
          className={`home-faq-card${tab.id === active ? "" : " home-faq-card--hidden"}`}
          role="tabpanel"
          id={`faq-panel-${tab.id}`}
          aria-labelledby={`faq-tab-${tab.id}`}
          aria-hidden={tab.id !== active}
          hidden={tab.id !== active ? true : undefined}
        >
          {tab.items.map((item, i) => (
            <Fragment key={`${tab.id}-${i}`}>
              {i > 0 ? <div className="home-faq-divider" aria-hidden /> : null}
              <details className="home-faq-item">
                <summary className="home-faq-question">
                  <span>{item.q}</span>
                  <ChevronDown
                    size={28}
                    strokeWidth={1.25}
                    className="home-faq-chevron"
                    aria-hidden
                  />
                </summary>
                <div className="home-faq-answer">{item.a}</div>
              </details>
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
