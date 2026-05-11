import Link from "next/link";
import {
  BookText,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Download,
  ExternalLink,
  EyeOff,
  FileText,
  Forward,
  GitCommitHorizontal,
  HelpCircle,
  LayoutList,
  Mail,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { signIn } from "@/auth";
import { InstallChip } from "@/components/InstallChip";
import { HeroStars } from "@/components/HeroStars";
import { Emoji } from "@/components/Emoji";
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
   a label, an item count, and 2 bullet items. Shipped and
   Left Off carry a trailing action badge ("Share" / "Resume
   Prompt"). Order matches the design. */
const HERO_GRAPHIC_SECTIONS = [
  {
    emoji: "shipped" as const,
    label: "Shipped",
    badge: { kind: "share" as const, label: "Share" },
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
  {
    emoji: "leftOff" as const,
    label: "Left Off",
    badge: { kind: "resume" as const, label: "Resume Prompt" },
    items: [
      {
        title: "The team invite email",
        body: "Template renders fine, but the org name shows up as null on some test cases. Next is figuring out why the lookup returns nothing.",
      },
      {
        title: "The CI test hang",
        body: "The suite hangs on every third or fourth pull request with no obvious pattern. Database and auth fixtures ruled out. Next is bisecting the cause.",
      },
    ],
  },
];

const HERO_GRAPHIC_DAYS = [
  { label: "Today", added: 425, removed: 86, commits: 19, files: 8 },
  { label: "Yesterday", added: 312, removed: 174, commits: 14, files: 11 },
  { label: "April 12", added: 94, removed: 23, commits: 4, files: 3 },
  { label: "April 11", added: 156, removed: 67, commits: 7, files: 5 },
  { label: "April 10", added: 389, removed: 210, commits: 16, files: 13 },
  { label: "April 9", added: 218, removed: 55, commits: 11, files: 6 },
  { label: "April 8", added: 147, removed: 38, commits: 8, files: 5 },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_PLAIN.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function MarketingHome() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
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
      <section className="home-hero">
        <HeroStars />
        <div className="home-hero-inner">
          <div className="home-hero-text-stack">
            <div className="home-hero-headline">
              {/* Trust chips sit ABOVE the title per Figma 244:2426.
                  Two chips only (was three). "Open Source" is a link
                  to the repo so security-conscious readers can verify
                  the claims directly in code. */}
              <div className="home-hero-chips">
                <a
                  href="https://github.com/charleshonig5/askscout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="home-hero-chip home-hero-chip--link"
                >
                  Open Source
                  <Forward size={10} strokeWidth={1.5} aria-hidden />
                </a>
                <span className="home-hero-chip">Read Only</span>
              </div>
              {/* Pridi title with mixed weights — "Your morning" and
                  "in 10 seconds" render at ExtraLight (200), while
                  "code briefing" stays at Regular (400) for emphasis.
                  52px / 60 line-height per Figma. */}
              <h1 className="home-hero-title">
                <span className="home-hero-title-light">Your morning</span>{" "}
                code briefing{" "}
                <span className="home-hero-title-light">in 10 seconds</span>
              </h1>
            </div>
            <p className="home-hero-subtitle">
              A daily digest of your code in plain language so you can pick up exactly where
              you left off.
            </p>
          </div>
          <div className="home-hero-cta">
            {/* Primary CTA: web-app sign-in. Plain bordered button —
                the previous orbital animation isn't part of the new
                Figma direction. */}
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/dashboard" });
              }}
            >
              <button type="submit" className="home-cta">
                Try AskScout Free
              </button>
            </form>
            {/* Secondary CTA: install command chip. One click copies
                `npm install -g askscout` to the clipboard. */}
            <InstallChip />
          </div>
        </div>

        {/* Graphic frame — Figma 244:2060. Two nested bordered
            rectangles (outer 976x584 on bg-primary, inner 948x556
            on bg-secondary) plus a bottom fade overlay that
            blends the frame into the page bg. Content (the digest
            preview) will live inside the inner frame in a follow-up. */}
        <div className="home-hero-graphic" aria-hidden>
          <div className="home-hero-frame">
            <div className="home-hero-frame-inner">
              <div className="home-hero-frame-card">
                {/* Horizontal divider under the header row (244:2064)
                    and vertical divider between the two body columns
                    (244:2063). Both at #252525 (border token). */}
                <div className="home-hero-card-divider home-hero-card-divider--h" />
                <div className="home-hero-card-divider home-hero-card-divider--v" />

                {/* Header row (244:2065) — title + identity chips +
                    date on the left; action buttons on the right. */}
                <div className="home-hero-card-header">
                  <div className="home-hero-card-heading">
                    <div className="home-hero-card-titlerow">
                      <p className="home-hero-card-title">Today&apos;s Digest</p>
                      <div className="home-hero-card-chips">
                        <span className="home-hero-card-chip">
                          askscout
                          <ExternalLink size={8} strokeWidth={1.5} />
                        </span>
                        <span className="home-hero-card-chip">
                          <Emoji name="streak" size={12} />
                          7 Day Streak
                        </span>
                      </div>
                    </div>
                    <p className="home-hero-card-date">
                      Thursday, April 16, 2026
                    </p>
                  </div>
                  <div className="home-hero-card-actions">
                    <span className="home-hero-card-action">
                      <Copy size={12} strokeWidth={1.5} />
                      Copy
                    </span>
                    <span className="home-hero-card-action">
                      <Download size={12} strokeWidth={1.5} />
                      Download
                    </span>
                    <span className="home-hero-card-action">
                      <Mail size={12} strokeWidth={1.5} />
                      Email
                    </span>
                  </div>
                </div>

                {/* Left column body — 4 digest sections per Figma
                    244:2099 (Shipped/Changed/Still Shifting/Left Off). */}
                <div className="home-hero-card-left">
                  {HERO_GRAPHIC_SECTIONS.map((section) => (
                    <div key={section.label} className="home-hero-card-section">
                      <div className="home-hero-card-section-head">
                        <div className="home-hero-card-section-headinner">
                          <span className="home-hero-card-section-title">
                            <Emoji name={section.emoji} size={16} />
                            {section.label}
                          </span>
                          <span className="home-hero-card-section-count">
                            {section.items.length} items
                          </span>
                        </div>
                        {section.badge ? (
                          <span className="home-hero-card-section-badge">
                            {section.badge.label}
                            {section.badge.kind === "share" ? (
                              <Forward size={8} strokeWidth={1.5} />
                            ) : (
                              <Sparkles size={8} strokeWidth={1.5} />
                            )}
                          </span>
                        ) : null}
                      </div>
                      <ul className="home-hero-card-bullets">
                        {section.items.map((item) => (
                          <li
                            key={item.title}
                            className="home-hero-card-bullet"
                          >
                            <ChevronRight
                              size={10}
                              strokeWidth={1.5}
                              className="home-hero-card-bullet-mark"
                            />
                            <p>
                              <span className="home-hero-card-bullet-title">
                                {item.title}
                              </span>{" "}
                              -{" "}
                              <span className="home-hero-card-bullet-body">
                                {item.body}
                              </span>
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Right column body — Statistics header + summary
                    block + Most Active files + Codebase Health per
                    Figma 244:2183. */}
                <div className="home-hero-card-right">
                  <span className="home-hero-card-section-title">
                    <Emoji name="statistics" size={16} />
                    Statistics
                  </span>
                  {/* Statistics summary (244:2188). */}
                  <div className="home-hero-card-stats">
                    <div className="home-hero-card-stats-lines">
                      <span className="home-hero-card-stats-add">
                        +425 lines
                      </span>
                      <span className="home-hero-card-stats-rem">
                        -86 lines
                      </span>
                    </div>
                    <div className="home-hero-card-stats-meta">
                      <span className="home-hero-card-stats-metaitem">
                        <GitCommitHorizontal size={16} strokeWidth={1.5} />
                        19 commits
                      </span>
                      <span className="home-hero-card-stats-metaitem">
                        <FileText size={12} strokeWidth={1.5} />
                        8 Files
                      </span>
                    </div>
                  </div>

                  {/* Most Active files (244:2207). */}
                  <div className="home-hero-card-block">
                    <p className="home-hero-card-block-title">
                      Most Active files
                    </p>
                    <ul className="home-hero-card-files">
                      {[
                        "components/OnboardingFlow.tsx",
                        "api/billing/route.ts",
                        "lib/stripe.ts",
                      ].map((path, i) => (
                        <li key={path} className="home-hero-card-file">
                          <span className="home-hero-card-file-num">
                            {i + 1})
                          </span>
                          <span className="home-hero-card-file-path">
                            {path}
                          </span>
                          <span className="home-hero-card-file-link">
                            <ExternalLink size={8} strokeWidth={1.5} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Codebase Health (244:2234) — Growth (Heavy / danger),
                      Focus (Moderate / warning), Churn (Clean / success). */}
                  <div className="home-hero-card-block">
                    <p className="home-hero-card-block-title">
                      Codebase Health
                    </p>
                    <div className="home-hero-card-health">
                      {[
                        {
                          label: "Growth",
                          desc: "Adding way more than removing",
                          status: "Heavy",
                          tone: "danger" as const,
                          fill: 179,
                        },
                        {
                          label: "Focus",
                          desc: "Working on a few things",
                          status: "Moderate",
                          tone: "warning" as const,
                          fill: 117,
                        },
                        {
                          label: "Churn",
                          desc: "No repeated edits",
                          status: "Clean",
                          tone: "success" as const,
                          fill: 55,
                        },
                      ].map((card) => (
                        <div
                          key={card.label}
                          className={`home-hero-card-health-card home-hero-card-health-card--${card.tone}`}
                        >
                          <div className="home-hero-card-health-text">
                            <p className="home-hero-card-health-label">
                              {card.label}
                            </p>
                            <p className="home-hero-card-health-desc">
                              {card.desc}
                            </p>
                          </div>
                          <span className="home-hero-card-health-pill">
                            {card.status}
                          </span>
                          <div className="home-hero-card-health-bar">
                            <div
                              className="home-hero-card-health-fill"
                              style={{ width: `${card.fill}px` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Inner bottom fade (244:2264) — bg-primary gradient
                    over the bottom 87px of the card content area so
                    the long bullet list visually dissolves rather
                    than hitting a hard edge. */}
                <div className="home-hero-card-fade" />
              </div>

              {/* Sidebar top bar — logo + utility icons (244:2413). */}
              <div className="home-hero-side-top">
                <div className="home-hero-side-logo">
                  <span className="home-hero-side-logo-mark" />
                  <span className="home-hero-side-logo-word">AskScout</span>
                </div>
                <div className="home-hero-side-utils">
                  <HelpCircle size={14} strokeWidth={1.5} />
                  <Settings2 size={14} strokeWidth={1.5} />
                </div>
              </div>

              {/* Repo dropdown chip (244:2265). */}
              <div className="home-hero-side-repo">
                <span>askscout</span>
                <ChevronDown size={14} strokeWidth={1.5} />
              </div>

              {/* Days list (244:2269) — first row is the active
                  selection, rendered with a bg-tertiary highlight pill
                  underneath the content stack. */}
              <div className="home-hero-side-days">
                <div className="home-hero-side-days-active" />
                <div className="home-hero-side-days-list">
                  {HERO_GRAPHIC_DAYS.map((day) => (
                    <div key={day.label} className="home-hero-side-day">
                      <p className="home-hero-side-day-label">{day.label}</p>
                      <div className="home-hero-side-day-stats">
                        <span className="home-hero-side-day-add">
                          +{day.added}
                        </span>
                        <span className="home-hero-side-day-rem">
                          -{day.removed}
                        </span>
                        <span className="home-hero-side-day-meta">
                          {day.commits}
                          <GitCommitHorizontal size={12} strokeWidth={1.5} />
                        </span>
                        <span className="home-hero-side-day-meta">
                          {day.files}
                          <FileText size={12} strokeWidth={1.5} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="home-hero-frame-fade" />
        </div>
      </section>

      {/* ===========================================================
          BENTO — features showcase. Eight tiles in a 4-column grid.
          The "Daily digest" tile spans two columns and acts as the
          hero of the bento; the four medium tiles fill the second
          row; "Multi-output" is a slim full-width strip at the
          bottom. Each tile has a tiny visual mock, not just text,
          so the section reads as a product surface rather than a
          paragraph wall.
          =========================================================== */}
      <section className="home-section">
        <div className="home-section-inner">
          <p className="home-eyebrow">What you get</p>
          <h2 className="home-section-title">A daily read on your code, in plain English.</h2>
          <div className="home-bento">
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
                  Toggle every section on or off. Pin a default repo. Clear history per repo or all
                  at once.
                </p>
              </div>
              <div
                className="home-bento-mock settings-panel settings-panel--toggles"
                aria-hidden
              >
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
          PREFER LOCAL — CLI section. By the time the reader reaches
          this point the bento grid has covered the web-app surface,
          so this section exists for users who want it local. Single
          tile, BYOK framing. =========================================================== */}
      <section className="home-section">
        <div className="home-section-inner home-section-inner--narrow home-section-inner--align-left">
          <p className="home-eyebrow">Want it local?</p>
          <h2 className="home-section-title">Run it locally.</h2>
          <p className="home-section-prose-narrow">
            Same product, as a CLI on your machine. Bring your own LLM key. Always stays fully
            local.
          </p>
          <div className="home-terminal" role="img" aria-label="AskScout running in a terminal">
            <div className="home-terminal-chrome">
              <span className="home-terminal-dot home-terminal-dot--red" />
              <span className="home-terminal-dot home-terminal-dot--yellow" />
              <span className="home-terminal-dot home-terminal-dot--green" />
              <span className="home-terminal-title">askscout</span>
            </div>
            <pre className="home-terminal-body">
              <span className="home-terminal-prompt">$</span> askscout
              {"\n\n"}
              <span className="home-terminal-heading">
                🔍 Scout scanned acme-app
              </span>
              {"\n"}
              <span className="home-terminal-dim">
                {"   "}12 commits · 23 files · today
              </span>
              {"\n\n"}
              <span className="home-terminal-heading">💬 Vibe Check</span>
              {"\n"}
              Cancel flow shipped, onboarding v2 polished.{"\n"}
              The billing pipeline finally hangs together.
              {"\n\n"}
              <span className="home-terminal-dim">
                {"   "}+1,284 lines · -612 lines · 12 commits · 23 files
              </span>
              {"\n\n"}
              <span className="home-terminal-heading">🚀 Shipped  3</span>
              {"\n"}
              {"  "}• Stripe cancel webhook handles renewals and bounces{"\n"}
              {"  "}• Onboarding v2 with progress bar and resume drafts{"\n"}
              {"  "}• Verification emails retry on transient SMTP failures
              {"\n\n"}
              <span className="home-terminal-heading">🔧 Changed  2</span>
              {"\n"}
              {"  "}• Search uses a composite index now, queries under 20ms{"\n"}
              {"  "}• Sign-out syncs across browser tabs via BroadcastChannel
              {"\n\n"}
              <span className="home-terminal-heading">📍 Left Off  1</span>
              {"\n"}
              {"  "}• Invitation email template shows null for some org names
              {"\n\n"}
              <span className="home-terminal-heading">🔑 Key Takeaways</span>
              {"\n"}
              Billing is in shape. Next move is fixing the org-name lookup{"\n"}
              before the team-invite email goes live.
              {"\n\n"}
              <span className="home-terminal-prompt">$</span>{" "}
              <span className="home-terminal-cursor" aria-hidden>
                █
              </span>
            </pre>
          </div>
          <div className="home-cli-cta">
            <Link href="/docs" className="home-cta home-cta--inline">
              Read the CLI docs →
            </Link>
          </div>
        </div>
      </section>

      {/* ===========================================================
          TRUST — three pillars (privacy, open source, security)
          that compound credibility. Each card title is a plain
          claim a non-technical reader can grok; body backs it
          with verifiable specifics grounded in the actual repo
          (github.ts read endpoints, MIT license across all
          packages, chmod 600 on CLI key file). =========================================================== */}
      <section className="home-section home-section--quiet">
        <div className="home-section-inner">
          <p className="home-eyebrow">Trust</p>
          <h2 className="home-section-title">Private. Secure. Open.</h2>
          <p className="home-section-prose-narrow">
            You stay in control of your code, your keys, and your data.{" "}
            <Link href="/privacy" className="home-prose-link">
              Read the full privacy policy →
            </Link>
          </p>
          <div className="home-trust-grid">
            <article className="home-trust-card">
              <span className="home-trust-icon" aria-hidden>
                <EyeOff size={20} strokeWidth={1.5} />
              </span>
              <h3 className="home-trust-title">We don&apos;t see your code.</h3>
              <p className="home-trust-body">
                Scout reads what changed in your repo and just enough surrounding context to
                interpret each change. Never your full files, your secrets, or your build
                artifacts.
              </p>
            </article>
            <article className="home-trust-card">
              <span className="home-trust-icon" aria-hidden>
                <ShieldCheck size={20} strokeWidth={1.5} />
              </span>
              <h3 className="home-trust-title">Your data stays safe.</h3>
              <p className="home-trust-body">
                Your keys stay private on your machine. Scout can never write to your repo. No
                tracking, ever.
              </p>
            </article>
            <article className="home-trust-card">
              <span className="home-trust-icon" aria-hidden>
                <Code2 size={20} strokeWidth={1.5} />
              </span>
              <h3 className="home-trust-title">Nothing is hidden.</h3>
              <p className="home-trust-body">
                Every line of Scout is public on GitHub. Free to read, fork, or build on.
              </p>
              <a
                href="https://github.com/charleshonig5/askscout"
                target="_blank"
                rel="noreferrer"
                className="home-trust-link"
              >
                View on GitHub
                <Forward size={10} strokeWidth={1.5} aria-hidden />
              </a>
            </article>
          </div>
        </div>
      </section>

      {/* ===========================================================
          ARTICLES — preview strip pointing readers to the writing.
          One feature card today (The Hidden Cost of Vibe Coding)
          since that's the lead piece; the layout is built as a row
          that scales to two or three cards once more pieces ship.
          The all-articles link sits at the section head so readers
          can jump straight to the index. The FAQ section follows in
          the
          next step.
          =========================================================== */}
      <section className="home-section">
        <div className="home-section-inner">
          <div className="home-articles-head">
            <div>
              <p className="home-eyebrow">Writing</p>
              <h2 className="home-section-title">More from Scout.</h2>
            </div>
            <Link href="/articles" className="home-articles-link">
              All articles
              <Forward size={10} strokeWidth={1.5} aria-hidden />
            </Link>
          </div>
          <div className="home-articles-row">
            <Link
              href="/articles/the-hidden-cost-of-vibe-coding"
              className="home-article-card"
            >
              <span className="home-article-card-tag">Article</span>
              <h3 className="home-article-card-title">The Hidden Cost of Vibe Coding</h3>
              <p className="home-article-card-excerpt">
                AI coding tools sped us up. They also made it harder to remember what we built.
                Why the next big workflow problem is digesting your own code.
              </p>
              <span className="home-article-card-meta">
                Read time: 4 min
                <Forward size={10} strokeWidth={1.5} aria-hidden />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===========================================================
          FAQ — accordion built with native <details>/<summary> so
          it's accessible and SSR-clean without any client JS. Each
          item collapses on load. Sits between Articles and the
          Final CTA so any last-mile objections get cleared right
          before the second sign-in button.
          =========================================================== */}
      <section className="home-section home-section--quiet">
        <div className="home-section-inner home-section-inner--narrow">
          <p className="home-eyebrow">Questions</p>
          <h2 className="home-section-title">Frequently asked questions.</h2>
          <FAQTabs />
        </div>
      </section>

      {/* ===========================================================
          FINAL CTA — the second-and-last sign-in button on the
          page. Same orbital star treatment so it reads as
          consistent with the hero. =========================================================== */}
      <section className="home-section home-section--cta">
        <div className="home-section-inner">
          <h2 className="home-section-title home-section-title--cta">
            Get your first digest now.
          </h2>
          <div className="home-final-cta">
            <div className="home-cta-row">
              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/dashboard" });
                }}
              >
                <button type="submit" className="home-cta home-cta--orbital">
                  <span className="home-cta-label">Try AskScout free</span>
                  <span className="home-cta-orbit" aria-hidden />
                </button>
              </form>
              <InstallChip />
            </div>
            <p className="home-hero-meta">Free. No credit card. No tracking.</p>
          </div>
        </div>
      </section>

      {/* Footer — extracted to SiteFooter so every public page renders
          the same brand block, wordmark, socials, and theme toggle. */}
      <SiteFooter />
    </main>
    </>
  );
}
