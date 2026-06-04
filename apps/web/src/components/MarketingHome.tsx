import { Fragment } from "react";
import Link from "next/link";
import {
  BookText,
  CircleX,
  Copy,
  PackageOpen,
  SearchX,
  SquareArrowUpRight,
  FileText,
  Forward,
  GitCommitHorizontal,
  LayoutList,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ReadyCTA } from "@/components/ReadyCTA";
import { FeaturesMotion } from "@/components/FeaturesMotion";
import { FeaturesResumeBody } from "@/components/FeaturesResumeBody";
import { RunLocalMotion } from "@/components/RunLocalMotion";
import { RunLocalPrompt } from "@/components/RunLocalPrompt";
import { Emoji } from "@/components/Emoji";
import { HeroSection } from "@/components/HeroSection";
import { TrustMotion } from "@/components/TrustMotion";
import FAQTabs from "@/components/FAQTabs";
import { MarketingNav } from "@/components/MarketingNav";
import { SiteFooter } from "@/components/SiteFooter";
import { FAQ_PLAIN } from "@/lib/faq-data";

/* JSON-LD FAQPage schema generated from FAQ_PLAIN so the structured
   data stays in lockstep with the rendered tabbed FAQ. Google
   requires the answer text in schema to mirror what users see on
   the page. */
/* Day rows shown in the hero graphic's sidebar — fake history
   data sized to match Figma 244:2269. The first row ("Today")
   is the active selection (highlighted with the bg-tertiary
   pill). Order matches the design exactly. */
/* Bullet sections inside the digest card — fake content sized
   to match Figma 244:2099. Each section has an emoji marker,
   a label, an item count, and 2 bullet items. Order matches
   the design. (Figma's "Share" and "Resume Prompt" badges
   were intentionally dropped — the marketing graphic is a
   simplified illustration, not the real product UI.) */
const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_PLAIN.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

/* SoftwareApplication schema lives on the homepage (the canonical
   product surface) so AI search models — ChatGPT, Perplexity,
   Claude, Google's AI Overviews — get a structured answer to
   "what is askScout, how much does it cost, where does it run."
   Other pages reference this entity by name via `about` in their
   own schemas. Kept conservative: no aggregateRating (no real
   review pool to claim) and no fabricated metrics. */
const SOFTWARE_APP_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "askScout",
  description:
    "askScout is an open source daily digest tool for developers and vibe coders. It reads your git activity and writes a plain-English summary of what you shipped each day. Run it in the browser or as a local CLI.",
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: "Developer productivity",
  operatingSystem: "Web, macOS, Linux, Windows",
  url: "https://askscout.dev",
  downloadUrl: "https://www.npmjs.com/package/askscout",
  installUrl: "https://www.npmjs.com/package/askscout",
  license: "https://opensource.org/licenses/MIT",
  /* sameAs lets AI search and graph crawlers tie this entity to its
     canonical presences on other platforms (GitHub repo, npm
     package, docs page) — the standard way to express "these URLs
     are all the same product." */
  sameAs: [
    "https://github.com/charleshonig5/askscout",
    "https://www.npmjs.com/package/askscout",
    "https://askscout.dev/docs",
  ],
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Organization",
    name: "askScout",
    url: "https://askscout.dev",
  },
  publisher: {
    "@type": "Organization",
    name: "askScout",
    url: "https://askscout.dev",
  },
};

export default function MarketingHome() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(SOFTWARE_APP_SCHEMA),
        }}
      />
      <main className="home">
        {/* ===========================================================
          NAV — minimal top bar with section anchors + theme toggle.
          Sticky-ish behavior is handled by the page scroll, not the
          element — keeps it lightweight and avoids overlap with the
          hero. =========================================================== */}
        <MarketingNav />

        {/* ===========================================================
          HERO — the first 100vh of the page. Wordmark, tagline, the
          primary CTA with its orbital star animation, and the
          streaming digest demo card sitting beneath. Everything
          centers on the page's content axis. =========================================================== */}
        <HeroSection />

        {/* ===========================================================
          FEATURES — 4-card grid per Figma 244:2697. Each card holds
          a mini product mock (top) + headline + body (bottom). The
          mocks show real product surfaces (recap, history, settings
          toggles, resume prompt) at marketing scale.
          =========================================================== */}
        <section className="home-section home-features">
          <div className="home-features-inner">
            <div className="home-features-header">
              <h2 className="home-features-title">A daily read on your code in plain language</h2>
              <p className="home-features-subtitle">
                A simple, structured interface for understanding your own repo.
              </p>
            </div>
            <FeaturesMotion>
              <div className="home-features-grid">
                {/* 1. YOUR DAILY RECAP — mini digest sections showing
                Shipped + Changed bullets at marketing scale. */}
                <div className="home-features-card">
                  <div className="home-features-mock" aria-hidden>
                    <div className="home-features-recap">
                      {[
                        {
                          emoji: "shipped" as const,
                          label: "Shipped",
                          items: [
                            {
                              title: "Cancel from one click",
                              body: "Subscribers can cancel without three confirmation screens. One click and a free-text reason box if they want to leave feedback.",
                            },
                            {
                              title: "Onboarding finally feels finished",
                              body: "First-time users get a three-step setup with a progress bar. If they bail, the next visit picks up where they left off.",
                            },
                          ],
                        },
                        {
                          emoji: "changed" as const,
                          label: "Changed",
                          items: [
                            {
                              title: "Search is way faster",
                              body: "User search used to chug for half a second on big orgs. Same query runs in under twenty milliseconds now.",
                            },
                            {
                              title: "Sign-out works across tabs",
                              body: "Sign out in one tab and every other tab knows immediately. No more stale-session weirdness across windows.",
                            },
                          ],
                        },
                      ].map((section) => (
                        <div key={section.label} className="home-features-recap-section">
                          <div className="home-features-recap-head">
                            <span className="home-features-recap-title">
                              <Emoji name={section.emoji} size={16} />
                              {section.label}
                            </span>
                            <span className="home-features-recap-count">
                              {section.items.length} items
                            </span>
                          </div>
                          <ul className="home-features-recap-items">
                            {section.items.map((item) => (
                              <li key={item.title} className="home-features-recap-item">
                                <span className="home-features-recap-dot" aria-hidden />
                                <p>
                                  <span className="home-features-recap-item-title">
                                    {item.title}
                                  </span>
                                  {" - "}
                                  <span className="home-features-recap-item-body">{item.body}</span>
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="home-features-fade" aria-hidden />
                  <div className="home-features-copy">
                    <h3>Your daily recap</h3>
                    <p>
                      A plain language, easily digestible read on where your codebase stands. What
                      you shipped, changed, where you left off, and more.
                    </p>
                  </div>
                </div>

                {/* 2. BUILT-IN HISTORY — sidebar days list on the left,
                stat skeletons on the right. */}
                <div className="home-features-card">
                  <div className="home-features-mock" aria-hidden>
                    <div className="home-features-history">
                      <div className="home-features-history-side">
                        <span className="home-features-history-active" />
                        <ul className="home-features-history-days">
                          {[
                            { label: "Today", added: 425, removed: 86, commits: 19, files: 8 },
                            {
                              label: "Yesterday",
                              added: 312,
                              removed: 174,
                              commits: 14,
                              files: 11,
                            },
                            { label: "April 12", added: 94, removed: 23, commits: 4, files: 3 },
                            { label: "April 11", added: 156, removed: 67, commits: 7, files: 5 },
                            { label: "April 10", added: 389, removed: 210, commits: 16, files: 13 },
                            { label: "April 9", added: 218, removed: 55, commits: 11, files: 6 },
                            { label: "April 8", added: 147, removed: 38, commits: 8, files: 5 },
                          ].map((day) => {
                            const isToday = day.label === "Today";
                            return (
                              <li key={day.label} className="home-features-history-day">
                                <p className="home-features-history-label">{day.label}</p>
                                <div className="home-features-history-stats">
                                  <span className="home-features-history-add">
                                    +
                                    {isToday ? (
                                      <span
                                        className="home-features-history-count"
                                        style={
                                          {
                                            "--count-target": day.added,
                                          } as React.CSSProperties
                                        }
                                      />
                                    ) : (
                                      day.added
                                    )}
                                  </span>
                                  <span className="home-features-history-rem">
                                    -
                                    {isToday ? (
                                      <span
                                        className="home-features-history-count"
                                        style={
                                          {
                                            "--count-target": day.removed,
                                          } as React.CSSProperties
                                        }
                                      />
                                    ) : (
                                      day.removed
                                    )}
                                  </span>
                                  <span className="home-features-history-meta">
                                    {isToday ? (
                                      <span
                                        className="home-features-history-count"
                                        style={
                                          {
                                            "--count-target": day.commits,
                                          } as React.CSSProperties
                                        }
                                      />
                                    ) : (
                                      day.commits
                                    )}
                                    <GitCommitHorizontal size={16} strokeWidth={1} />
                                  </span>
                                  <span className="home-features-history-meta">
                                    {isToday ? (
                                      <span
                                        className="home-features-history-count"
                                        style={
                                          {
                                            "--count-target": day.files,
                                          } as React.CSSProperties
                                        }
                                      />
                                    ) : (
                                      day.files
                                    )}
                                    <FileText size={12} strokeWidth={1} />
                                  </span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      {/* Detail panel — separate bordered rectangle that
                      starts at left:193 with width:422, deliberately
                      extending past the mock's right edge per Figma
                      244:2891. The mock's overflow:hidden clips it,
                      producing the truncated preview look. */}
                      <div className="home-features-history-detail">
                        <span className="home-features-history-skel" style={{ width: "323px" }} />
                        <span className="home-features-history-skel" style={{ width: "161px" }} />
                        <span className="home-features-history-skel" style={{ width: "215px" }} />
                        <span className="home-features-history-skel home-features-history-skel--card" />
                      </div>
                    </div>
                  </div>
                  <div className="home-features-fade" aria-hidden />
                  <div className="home-features-copy">
                    <h3>Built-in history</h3>
                    <p>
                      Every digest in every repo is saved for future reference. Your full history is
                      always available.
                    </p>
                  </div>
                </div>

                {/* 3. CUSTOMIZED TO YOUR NEEDS — 3 settings rows with
                toggle switches in mixed on/off states. */}
                <div className="home-features-card">
                  <div className="home-features-mock" aria-hidden>
                    <div className="home-features-toggles">
                      {[
                        {
                          label: "Most Active Files",
                          desc: "The files you touched most in a session",
                          on: true,
                        },
                        {
                          label: "Codebase Health",
                          desc: "Growth, focus, and churn indicators",
                          on: true,
                        },
                        {
                          label: "Coding Timeline",
                          desc: "Timeline of your commits across the day",
                          on: false,
                        },
                      ].map((row, i) => (
                        <Fragment key={row.label}>
                          {i > 0 ? <div className="home-features-toggle-divider" /> : null}
                          <div className="home-features-toggle-row">
                            <div className="home-features-toggle-text">
                              <p className="home-features-toggle-label">{row.label}</p>
                              <p className="home-features-toggle-desc">{row.desc}</p>
                            </div>
                            <span
                              className={`home-features-toggle${row.on ? " home-features-toggle--on" : ""}`}
                            >
                              <span className="home-features-toggle-thumb" />
                            </span>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div className="home-features-fade" aria-hidden />
                  <div className="home-features-copy">
                    <h3>Customized to your needs</h3>
                    <p>
                      Toggle every section on or off. Pin a default repo. Clear history per repo or
                      all at once anytime.
                    </p>
                  </div>
                </div>

                {/* 4. PICK UP WHERE YOU LEFT OFF — Resume Prompt UI with
                sparkles header, close X, Current Focus, Key Files. */}
                <div className="home-features-card">
                  <div className="home-features-mock" aria-hidden>
                    <div className="home-features-resume">
                      <div className="home-features-resume-headrow">
                        <div className="home-features-resume-head">
                          <span className="home-features-resume-title">
                            <Emoji name="resume" size={16} />
                            Resume Prompt
                          </span>
                          <p className="home-features-resume-sub">
                            Paste this into your AI coding tool
                            <span className="home-features-resume-sub-tail">
                              {" "}
                              to pick up where you left off
                            </span>
                            .
                          </p>
                        </div>
                        <span className="home-features-resume-close">
                          <CircleX size={16} strokeWidth={1} />
                        </span>
                      </div>
                      <div className="home-features-resume-divider" />
                      <div className="home-features-resume-body">
                        <div className="home-features-resume-block">
                          <p className="home-features-resume-heading">Current Focus</p>
                          <FeaturesResumeBody />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="home-features-fade" aria-hidden />
                  <div className="home-features-copy">
                    <h3>Pick up where you left off</h3>
                    <p>
                      Paste the resume prompt into your AI coding tool. Lets you pick up your
                      project on a new session without you explaining it.
                    </p>
                  </div>
                </div>
              </div>
            </FeaturesMotion>
            <div className="home-bento" style={{ display: "none" }}>
              {/* 1. THE READ — your daily recap. Mock shows a streamed
                digest section + a couple of fake bullets so readers
                see the product's actual output shape on first scan. */}
              <div className="home-bento-tile">
                <div className="home-bento-content">
                  <p className="home-bento-eyebrow">Today</p>
                  <h3 className="home-bento-title">Your daily recap.</h3>
                  <p className="home-bento-body">
                    A plain-English read on what you shipped, changed, and where you left off. Six
                    sections, same shape every day.
                  </p>
                </div>
                <div className="home-bento-mock home-bento-mock--scaled" aria-hidden>
                  {/* Real digest section DOM — same classes the dashboard
                    uses (`.digest-bulleted`, `.digest-bulleted-heading`,
                    `.digest-item-bullet/title/context`). What you see
                    here is what the live digest renders, just shrunk
                    via the .home-bento-mock--scaled wrapper. */}
                  <div className="digest-bulleted">
                    <div className="digest-bulleted-header">
                      <div className="digest-bulleted-heading">
                        <Emoji name="shipped" size={20} />
                        <span className="digest-bulleted-label">Shipped</span>
                      </div>
                    </div>
                    <div className="digest-bulleted-list">
                      <div className="digest-item">
                        <span className="digest-item-bullet" aria-hidden />
                        <p className="digest-item-text">
                          <span className="digest-item-title">Sign in with Google</span>
                          {" - "}
                          <span className="digest-item-context">
                            Users can log in without a password.
                          </span>
                        </p>
                      </div>
                      <div className="digest-item">
                        <span className="digest-item-bullet" aria-hidden />
                        <p className="digest-item-text">
                          <span className="digest-item-title">Settings page</span>
                          {" - "}
                          <span className="digest-item-context">
                            Dark mode + saved per-repo prefs.
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="digest-bulleted">
                    <div className="digest-bulleted-header">
                      <div className="digest-bulleted-heading">
                        <Emoji name="changed" size={20} />
                        <span className="digest-bulleted-label">Changed</span>
                      </div>
                    </div>
                    <div className="digest-bulleted-list">
                      <div className="digest-item">
                        <span className="digest-item-bullet" aria-hidden />
                        <p className="digest-item-text">
                          <span className="digest-item-title">Auth flow</span>
                          {" - "}
                          <span className="digest-item-context">
                            Replaced legacy session middleware.
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. CUSTOMIZE — toggle every digest section, pin a
                default repo, manage history. Mock is a settings-style
                row of toggles in mixed states so readers see the
                control directly. */}
              <div className="home-bento-tile">
                <div className="home-bento-content">
                  <p className="home-bento-eyebrow">Yours</p>
                  <h3 className="home-bento-title">Customize your digest.</h3>
                  <p className="home-bento-body">
                    Toggle every section on or off. Pin a default repo. Clear history per repo or
                    all at once.
                  </p>
                </div>
                <div className="home-bento-mock settings-panel settings-panel--toggles" aria-hidden>
                  {/* Real settings toggle DOM — same classes the
                    /settings page uses (`.settings-toggle-row`,
                    `.settings-toggle-info`, `.settings-switch` with
                    track + thumb). Inputs are disabled + tabIndex
                    -1 so the marketing tile stays non-interactive. */}
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label">Vibe Check</span>
                      <span className="settings-toggle-desc">Casual overview of your day</span>
                    </div>
                    <label className="settings-switch">
                      <input type="checkbox" defaultChecked tabIndex={-1} disabled />
                      <span className="settings-switch-track" />
                      <span className="settings-switch-thumb" />
                    </label>
                  </div>
                  <hr className="settings-row-divider" aria-hidden />
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label">Shipped</span>
                      <span className="settings-toggle-desc">New features and functionality</span>
                    </div>
                    <label className="settings-switch">
                      <input type="checkbox" defaultChecked tabIndex={-1} disabled />
                      <span className="settings-switch-track" />
                      <span className="settings-switch-thumb" />
                    </label>
                  </div>
                  <hr className="settings-row-divider" aria-hidden />
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label">Codebase Health</span>
                      <span className="settings-toggle-desc">Growth, focus, and churn</span>
                    </div>
                    <label className="settings-switch">
                      <input type="checkbox" defaultChecked tabIndex={-1} disabled />
                      <span className="settings-switch-track" />
                      <span className="settings-switch-thumb" />
                    </label>
                  </div>
                  <hr className="settings-row-divider" aria-hidden />
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label">Pace Check</span>
                      <span className="settings-toggle-desc">Today vs your rolling average</span>
                    </div>
                    <label className="settings-switch">
                      <input type="checkbox" tabIndex={-1} disabled />
                      <span className="settings-switch-track" />
                      <span className="settings-switch-thumb" />
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. HISTORY — 30-day archive per repo + streaks. Mock
                is the streak count + 7-cell calendar strip from the
                actual sidebar treatment. */}
              <div className="home-bento-tile">
                <div className="home-bento-content">
                  <p className="home-bento-eyebrow">History</p>
                  <h3 className="home-bento-title">Built-in history.</h3>
                  <p className="home-bento-body">
                    Every digest is saved for thirty days per repo. Streaks build, quiet days still
                    count, every read one click away.
                  </p>
                </div>
                <div className="home-bento-mock home-bento-mock--history" aria-hidden>
                  {/* Real streak chip — same `.digest-streak` class the
                    dashboard header uses, with the same Fluent fire
                    Emoji at the same size (14px) the live product
                    renders. Plus a strip of real `.insights-calendar-cell`
                    elements in their active/empty/checkin states from
                    the insights activity grid. */}
                  <span className="digest-streak">
                    <Emoji name="streak" size={14} /> 23 Day Streak
                  </span>
                  <div className="home-bento-mock-cal-row">
                    <span className="insights-calendar-cell" data-state="active" />
                    <span className="insights-calendar-cell" data-state="active" />
                    <span className="insights-calendar-cell" data-state="active" />
                    <span className="insights-calendar-cell" data-state="checkin" />
                    <span className="insights-calendar-cell" data-state="active" />
                    <span className="insights-calendar-cell" data-state="active" />
                    <span className="insights-calendar-cell" data-state="active" />
                  </div>
                </div>
              </div>

              {/* 4. OUTPUTS — three more outputs derived from the same
                digest. Mock shows the three product chips users see
                in the dashboard. */}
              <div className="home-bento-tile">
                <div className="home-bento-content">
                  <p className="home-bento-eyebrow">AI Resume Prompt</p>
                  <h3 className="home-bento-title">Pick up where you left off.</h3>
                  <p className="home-bento-body">
                    Paste the AI Resume Prompt into your AI coding tool. Lets you pick up your
                    project on a new session without you explaining it.
                  </p>
                </div>
                <div className="home-bento-mock home-bento-mock--actions" aria-hidden>
                  {/* Real action-button DOM — same `.standup-btn` class
                    + same Lucide icons (BookText, LayoutList,
                    Sparkles) the dashboard's bottom-action row and
                    the Resume Prompt button render. Disabled +
                    tabIndex -1 so the marketing tile is purely
                    visual. */}
                  <button type="button" className="standup-btn" tabIndex={-1} disabled>
                    <BookText size={20} strokeWidth={1} aria-hidden />
                    Generate Standup
                  </button>
                  <button type="button" className="standup-btn" tabIndex={-1} disabled>
                    <LayoutList size={20} strokeWidth={1} aria-hidden />
                    Generate Todo List
                  </button>
                  <button type="button" className="standup-btn" tabIndex={-1} disabled>
                    <Sparkles size={20} strokeWidth={1} aria-hidden />
                    AI Resume Prompt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===========================================================
          RUN IT LOCALLY — Figma 344:2. Two-column layout: left
          column has Open Source + Fully Local pills, "Run it
          Locally" title, body copy, npm install pill, and a
          Documentation link. Right column is a macOS-style
          terminal mock showing the CLI digest output, with a
          bottom fade dissolving into the section background.
          =========================================================== */}
        <section className="home-section home-runlocal">
          <div className="home-runlocal-inner">
            <div className="home-runlocal-left">
              <div className="home-runlocal-mainblock">
                <div className="home-runlocal-headblock">
                  <div className="home-runlocal-headgroup">
                    <div className="home-runlocal-badges">
                      <Link href="/docs" className="home-runlocal-badge">
                        <span>Open source</span>
                        <Forward size={10} strokeWidth={1.5} aria-hidden />
                      </Link>
                      <span className="home-runlocal-badge">
                        <span>Fully local</span>
                      </span>
                    </div>
                    <h2 className="home-runlocal-title">Run it locally</h2>
                  </div>
                  <p className="home-runlocal-body">
                    Same product, as a CLI on your machine. Bring your own LLM key. Always stays
                    fully local.
                  </p>
                </div>
                <button type="button" className="home-runlocal-install">
                  <span className="home-runlocal-install-text">
                    <span className="home-runlocal-install-prompt">$</span>
                    {"  "}npm install -g askscout
                  </span>
                  <Copy size={16} strokeWidth={1} aria-hidden />
                </button>
              </div>
              <Link href="/docs" className="home-runlocal-doclink">
                <span>Documentation</span>
                <SquareArrowUpRight size={16} strokeWidth={1.5} aria-hidden />
              </Link>
            </div>

            <RunLocalMotion>
              <div className="home-runlocal-right" aria-hidden>
                <div className="home-runlocal-card">
                  <div className="home-runlocal-dots">
                    <span className="home-runlocal-dot home-runlocal-dot--red" />
                    <span className="home-runlocal-dot home-runlocal-dot--yellow" />
                    <span className="home-runlocal-dot home-runlocal-dot--green" />
                  </div>
                  <div className="home-runlocal-card-divider" />
                  <div className="home-runlocal-stream">
                    <div className="home-runlocal-stream-head">
                      <RunLocalPrompt />
                      <p className="home-runlocal-stream-stats">
                        +425 · -86 · 19 commits · 8 files
                      </p>
                    </div>
                    {[
                      {
                        emoji: "shipped" as const,
                        label: "Shipped",
                        items: [
                          {
                            title: "Cancel from one click",
                            body: "Subscribers can cancel without three confirmation screens. One click and a free-text reason box if they want to leave feedback.",
                          },
                          {
                            title: "Onboarding finally feels finished",
                            body: "First-time users get a three-step setup with a progress bar. If they bail mid-flow, the next visit picks up where they left off.",
                          },
                        ],
                      },
                      {
                        emoji: "changed" as const,
                        label: "Changed",
                        items: [
                          {
                            title: "Search is way faster",
                            body: "User search used to chug for half a second on big orgs. Same query runs in under twenty milliseconds now.",
                          },
                          {
                            title: "Sign-out works across tabs",
                            body: "Sign out in one tab and every other tab knows immediately. No more stale-session weirdness across windows.",
                          },
                        ],
                      },
                      {
                        emoji: "unstable" as const,
                        label: "Still Shifting",
                        items: [
                          {
                            title: "The notification badge",
                            body: "Touched five days running. Every fix introduces a new flicker on websocket reconnect. Worth pausing tomorrow to figure out why.",
                          },
                          {
                            title: "Sidebar on Safari",
                            body: "Fourth pass at the collapse animation this week. Every fix works in Chrome and breaks Safari. Might be time to write the Safari path separately.",
                          },
                        ],
                      },
                    ].map((section) => (
                      <div key={section.label} className="home-runlocal-stream-section">
                        <div className="home-runlocal-stream-heading">
                          <Emoji name={section.emoji} size={14} />
                          <span>{section.label}</span>
                        </div>
                        <ul className="home-runlocal-stream-items">
                          {section.items.map((item) => (
                            <li key={item.title} className="home-runlocal-stream-item">
                              <span className="home-runlocal-stream-bullet" aria-hidden />
                              <p>
                                {item.title}
                                {" - "}
                                <span>{item.body}</span>
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="home-runlocal-fade" />
              </div>
            </RunLocalMotion>
          </div>
        </section>

        {/* ===========================================================
          TRUST — three pillars (privacy, open source, security)
          that compound credibility. Each card title is a plain
          claim a non-technical reader can grok; body backs it
          with verifiable specifics grounded in the actual repo
          (github.ts read endpoints, MIT license across all
          packages, chmod 600 on CLI key file). =========================================================== */}
        {/* ===========================================================
          PRIVATE / SECURE / OPEN SOURCE — Figma 344:3. Header
          row with the section title on the left and a Privacy
          Policy button on the right. Three trust cards below,
          each with a 28px icon, a 20px title, and a 12px body.
          Each card has a bottom fade that dissolves the lower
          portion into the section background.
          =========================================================== */}
        <TrustMotion>
          <div className="home-trust-inner">
            <div className="home-trust-header">
              <div className="home-trust-headtext">
                <h2 className="home-trust-title">Private. Secure. Open source.</h2>
                <p className="home-trust-subtitle">
                  You stay in control of your code and your data.
                </p>
              </div>
              <Link href="/privacy" className="home-trust-policy">
                Privacy Policy
              </Link>
            </div>
            <div className="home-trust-grid">
              {[
                {
                  icon: <SearchX size={28} strokeWidth={1.25} aria-hidden />,
                  title: "We don’t read your code",
                  body: "askScout only looks at what ‘s changed in your repo. Never your full codebase or your config.",
                  bodyWidth: 259,
                },
                {
                  icon: <ShieldCheck size={28} strokeWidth={1.25} aria-hidden />,
                  title: "Your data stays safe",
                  body: "askScout can never write to your repo. No tracking, ever. Your keys stay private on your machine.",
                  bodyWidth: 268,
                },
                {
                  icon: <PackageOpen size={28} strokeWidth={1.25} aria-hidden />,
                  title: "Fully open source",
                  body: "Every line of askScout is public on GitHub. Free to read, fork, or build on.",
                  bodyWidth: 244,
                },
              ].map((card) => (
                <article key={card.title} className="home-trust-card">
                  <div className="home-trust-card-inner">
                    <span className="home-trust-card-icon" aria-hidden>
                      {card.icon}
                    </span>
                    <div className="home-trust-card-text">
                      <h3 className="home-trust-card-title">{card.title}</h3>
                      <p className="home-trust-card-body" style={{ width: `${card.bodyWidth}px` }}>
                        {card.body}
                      </p>
                    </div>
                  </div>
                  <div className="home-trust-card-fade" aria-hidden />
                </article>
              ))}
            </div>
          </div>
        </TrustMotion>

        {/* ===========================================================
          FAQ — accordion built with native <details>/<summary> so
          it's accessible and SSR-clean without any client JS. Each
          item collapses on load. Sits between Articles and the
          Final CTA so any last-mile objections get cleared right
          before the second sign-in button.
          =========================================================== */}
        {/* ===========================================================
          FAQ — Figma 244:2605. Pridi title + 3-tab segmented
          control as a single header row, followed by a single
          rounded card holding the active tab's questions. Native
          <details>/<summary> for SSR-clean disclosure; all rows
          collapse on load.
          =========================================================== */}
        <section className="home-section">
          <div className="home-faq-inner">
            <FAQTabs />
          </div>
        </section>

        {/* ===========================================================
          FINAL CTA — reusable end-of-page CTA per Figma 244:2673.
          Lives in <ReadyCTA /> so other marketing pages can drop
          it in right before the footer with one line.
          =========================================================== */}
        <ReadyCTA />

        {/* Footer — extracted to SiteFooter so every public page renders
          the same brand block, wordmark, socials, and theme toggle. */}
        <SiteFooter />
      </main>
    </>
  );
}
