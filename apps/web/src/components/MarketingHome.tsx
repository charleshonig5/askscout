import { Fragment } from "react";
import Link from "next/link";
import {
  BookText,
  ChartPie,
  ChevronDown,
  CircleX,
  Copy,
  PackageOpen,
  SearchX,
  SquareArrowUpRight,
  Download,
  FileText,
  Forward,
  GitCommitHorizontal,
  LayoutList,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { signIn } from "@/auth";
import { GitHubMark } from "@/components/GitHubMark";
import { InstallChip } from "@/components/InstallChip";
import { ReadyCTA } from "@/components/ReadyCTA";
import { FeaturesMotion } from "@/components/FeaturesMotion";
import { FeaturesResumeBody } from "@/components/FeaturesResumeBody";
import { RunLocalMotion } from "@/components/RunLocalMotion";
import { RunLocalPrompt } from "@/components/RunLocalPrompt";
import { Emoji } from "@/components/Emoji";
import { HeroBgVideo } from "@/components/HeroBgVideo";
import { HeroCardOpener } from "@/components/HeroCardOpener";
import { HeroGraphicMotion } from "@/components/HeroGraphicMotion";
import { Logo } from "@/components/Logo";
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
const HERO_GRAPHIC_SECTIONS = [
  {
    key: "shipped" as const,
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
    key: "changed" as const,
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
    key: "stillShifting" as const,
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
    key: "leftOff" as const,
    emoji: "leftOff" as const,
    label: "Left Off",
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
        <section className="home-hero">
          {/* Background — silent looping starfield video per Figma
            244:2059, plus the bottom-fade gradient (244:2453) that
            blends the video into the page bg as you scroll down. */}
          <HeroBgVideo />
          {/* Darken overlay — bg-primary at 60% sitting on top of
            the video so the starfield reads as atmospheric haze
            rather than competing with the hero content. */}
          <div className="home-hero-bg-darken" aria-hidden />
          <div className="home-hero-bg-fade" aria-hidden />
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
                    Open source
                    <Forward size={10} strokeWidth={1.5} aria-hidden />
                  </a>
                  <span className="home-hero-chip">Read only</span>
                </div>
                {/* Pridi title with mixed weights — "Your morning" and
                  "in 10 seconds" render at ExtraLight (200), while
                  "code briefing" stays at Regular (400) for emphasis.
                  52px / 60 line-height per Figma. */}
                <h1 className="home-hero-title">
                  <span className="home-hero-title-light">Your morning</span> code
                  {/* Mobile forces the break here so the title always
                    reads "Your morning code" / "briefing in 10
                    seconds" at any phone width. Hidden on desktop
                    (br is display:none there) — desktop wraps as
                    before. */}{" "}
                  <br className="home-hero-title-br" />
                  briefing <span className="home-hero-title-light">in 10 seconds</span>
                </h1>
              </div>
              <p className="home-hero-subtitle">
                A daily digest of your code in plain language so you can pick up exactly where you
                left off.
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
                {/* Figma 442:178 — icon-left CTA. The official GitHub mark
                  to the left of "Continue with GitHub" sets the
                  expectation that the click routes to GitHub OAuth, so
                  users aren't surprised when the consent screen appears.
                  Replaces the previous value-led "Try askScout free"
                  copy which read like an in-app trial flow. */}
                <button type="submit" className="home-cta">
                  <GitHubMark />
                  Continue with GitHub
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
          <HeroGraphicMotion>
            <div className="home-hero-graphic" aria-hidden>
              <div className="home-hero-frame">
                <div className="home-hero-frame-inner">
                  <div className="home-hero-frame-card">
                    {/* Pre-stream typed line — "Scanning the horizon for
                    commits…" types itself out during the "opener"
                    phase, then fades out as skeletons reveal. */}
                    <HeroCardOpener />

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
                          <p className="home-hero-card-title">Today’s Digest</p>
                          <div className="home-hero-card-chips">
                            <span className="home-hero-card-chip">
                              askscout
                              <Forward size={8} strokeWidth={1} />
                            </span>
                            <span className="home-hero-card-chip">
                              <Emoji name="streak" size={12} />7 Day Streak
                            </span>
                          </div>
                        </div>
                        <p className="home-hero-card-date">Thursday, April 16, 2026</p>
                      </div>
                      <div className="home-hero-card-actions">
                        <span className="home-hero-card-action">
                          <Copy size={12} strokeWidth={1} />
                          Copy
                        </span>
                        <span className="home-hero-card-action">
                          <Download size={12} strokeWidth={1} />
                          Download
                        </span>
                        <span className="home-hero-card-action">
                          <Send size={12} strokeWidth={1} />
                          Email
                        </span>
                      </div>
                    </div>

                    {/* Left column body — 4 digest sections per Figma
                    244:2099 (Shipped/Changed/Still Shifting/Left Off). */}
                    <div className="home-hero-card-left">
                      {HERO_GRAPHIC_SECTIONS.map((section) => (
                        <div
                          key={section.key}
                          className="home-hero-card-section"
                          data-section={section.key}
                        >
                          <div className="home-hero-card-section-head">
                            <span className="home-hero-card-section-title">
                              <Emoji name={section.emoji} size={16} />
                              {section.label}
                            </span>
                            <span className="home-hero-card-section-count">
                              {section.items.length} items
                            </span>
                            {/* LiveBadge — CSS-hidden by default, shown
                            only when the wrapper's data-graphic-phase
                            equals this section's key. */}
                            <span className="home-hero-card-live" aria-hidden>
                              Live
                              <span className="home-hero-card-live-dot" />
                            </span>
                          </div>
                          <ul className="home-hero-card-bullets">
                            {section.items.map((item) => (
                              <li key={item.title} className="home-hero-card-bullet">
                                <span className="home-hero-card-bullet-mark" aria-hidden />
                                <p>
                                  <span className="home-hero-card-bullet-title">{item.title}</span>{" "}
                                  - <span className="home-hero-card-bullet-body">{item.body}</span>
                                </p>
                              </li>
                            ))}
                          </ul>
                          {/* Skeleton placeholder — 4 shimmer rows per
                          section with varied widths (100/84/67/94),
                          mirroring NARRATIVE_LINE_WIDTHS in the
                          live product's PreGeneration.tsx so the
                          skeleton reads like 2 wrapped-bullet rows
                          of natural prose. Hidden by default, shown
                          only when this section is pending. */}
                          <div className="home-hero-card-bullets-skel" aria-hidden>
                            <span
                              className="home-hero-card-skel home-hero-card-skel--bullet-row"
                              style={{ width: "100%" }}
                            />
                            <span
                              className="home-hero-card-skel home-hero-card-skel--bullet-row"
                              style={{ width: "84%" }}
                            />
                            <span
                              className="home-hero-card-skel home-hero-card-skel--bullet-row"
                              style={{ width: "67%" }}
                            />
                            <span
                              className="home-hero-card-skel home-hero-card-skel--bullet-row"
                              style={{ width: "94%" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Right column body — Statistics header + summary
                    block + Most Active files + Codebase Health per
                    Figma 244:2183. */}
                    <div className="home-hero-card-right" data-section="statistics">
                      <span className="home-hero-card-section-title">
                        <Emoji name="statistics" size={16} />
                        Statistics
                        <span className="home-hero-card-live" aria-hidden>
                          Live
                          <span className="home-hero-card-live-dot" />
                        </span>
                      </span>
                      {/* Statistics summary (244:2188). Numbers animate
                      up from 0 to target via --count-target +
                      @property --count-num during the "stats" phase. */}
                      <div className="home-hero-card-stats">
                        <div className="home-hero-card-stats-lines">
                          <span className="home-hero-card-stats-add">
                            +
                            <span
                              className="home-hero-card-count-up"
                              style={{ "--count-target": 425 } as React.CSSProperties}
                            />{" "}
                            lines
                          </span>
                          <span className="home-hero-card-stats-rem">
                            -
                            <span
                              className="home-hero-card-count-up"
                              style={{ "--count-target": 86 } as React.CSSProperties}
                            />{" "}
                            lines
                          </span>
                        </div>
                        <div className="home-hero-card-stats-meta">
                          <span className="home-hero-card-stats-metaitem">
                            <GitCommitHorizontal size={16} strokeWidth={1} />
                            <span
                              className="home-hero-card-count-up"
                              style={{ "--count-target": 19 } as React.CSSProperties}
                            />{" "}
                            commits
                          </span>
                          <span className="home-hero-card-stats-metaitem">
                            <FileText size={12} strokeWidth={1} />
                            <span
                              className="home-hero-card-count-up"
                              style={{ "--count-target": 8 } as React.CSSProperties}
                            />{" "}
                            Files
                          </span>
                        </div>
                      </div>
                      {/* Stats summary skeleton — shows during pre-stats
                      phases in place of the real stats. */}
                      <div className="home-hero-card-stats-skel" aria-hidden>
                        <span
                          className="home-hero-card-skel home-hero-card-skel--stats-row"
                          style={{ width: "75%" }}
                        />
                        <span
                          className="home-hero-card-skel home-hero-card-skel--stats-row"
                          style={{ width: "60%" }}
                        />
                      </div>

                      {/* Most Active files (244:2207). Wrapped in a
                      fragment so the skel sibling can live in the
                      column's flex stack at the same level. */}
                      <div className="home-hero-card-block">
                        <p className="home-hero-card-block-title">Most Active files</p>
                        <ul className="home-hero-card-files">
                          {[
                            "components/OnboardingFlow.tsx",
                            "api/billing/route.ts",
                            "lib/stripe.ts",
                          ].map((path, i) => (
                            <li key={path} className="home-hero-card-file">
                              <span className="home-hero-card-file-num">{i + 1})</span>
                              <span className="home-hero-card-file-path">{path}</span>
                              <span className="home-hero-card-file-link">
                                <Forward size={8} strokeWidth={1} />
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="home-hero-card-files-skel" aria-hidden>
                          <span
                            className="home-hero-card-skel home-hero-card-skel--file-row"
                            style={{ width: "92%" }}
                          />
                          <span
                            className="home-hero-card-skel home-hero-card-skel--file-row"
                            style={{ width: "78%" }}
                          />
                          <span
                            className="home-hero-card-skel home-hero-card-skel--file-row"
                            style={{ width: "60%" }}
                          />
                        </div>
                      </div>

                      {/* Codebase Health (244:2234) — Growth (Heavy / danger),
                      Focus (Moderate / warning), Churn (Clean / success). */}
                      <div className="home-hero-card-block">
                        <p className="home-hero-card-block-title">Codebase Health</p>
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
                                <p className="home-hero-card-health-label">{card.label}</p>
                                <p className="home-hero-card-health-desc">{card.desc}</p>
                              </div>
                              <span className="home-hero-card-health-pill">{card.status}</span>
                              <div className="home-hero-card-health-bar">
                                <div
                                  className="home-hero-card-health-fill"
                                  style={
                                    {
                                      "--fill-target": `${card.fill}px`,
                                    } as React.CSSProperties
                                  }
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="home-hero-card-health-skel" aria-hidden>
                          <span className="home-hero-card-skel home-hero-card-skel--health-card" />
                          <span className="home-hero-card-skel home-hero-card-skel--health-card" />
                          <span className="home-hero-card-skel home-hero-card-skel--health-card" />
                        </div>
                      </div>
                    </div>

                    {/* Inner bottom fade (244:2264) — bg-primary gradient
                    over the bottom 87px of the card content area so
                    the long bullet list visually dissolves rather
                    than hitting a hard edge. */}
                    <div className="home-hero-card-fade" />
                  </div>

                  {/* Sidebar top bar — logo + utility icons (244:2413).
                  Uses the real <Logo /> SVG component (same one
                  Sidebar.tsx renders at height 18) at a smaller
                  height to match the graphic's scale. */}
                  <div className="home-hero-side-top">
                    <Logo height={14} />
                    <div className="home-hero-side-utils">
                      <ChartPie size={14} strokeWidth={1} />
                      <Settings2 size={14} strokeWidth={1} />
                    </div>
                  </div>

                  {/* Repo dropdown chip (244:2265). */}
                  <div className="home-hero-side-repo">
                    <span>askscout</span>
                    <ChevronDown size={14} strokeWidth={1} />
                  </div>

                  {/* Days list (244:2269) — first row is the active
                  selection, rendered with a bg-tertiary highlight pill
                  underneath the content stack. */}
                  <div className="home-hero-side-days">
                    <div className="home-hero-side-days-active" />
                    <div className="home-hero-side-days-list">
                      {HERO_GRAPHIC_DAYS.map((day, i) => {
                        // Today's row gets count-up animations on its
                        // numbers (start at 0 → animate to target during
                        // the stats phase) plus a brief success-tinted
                        // glow on completion — mirroring the dashboard's
                        // .sidebar-item--fresh treatment when a digest
                        // run finishes. Historical days render plain
                        // static numbers.
                        const isToday = i === 0;
                        return (
                          <div
                            key={day.label}
                            className="home-hero-side-day"
                            {...(isToday ? { "data-today": "" } : {})}
                          >
                            <p className="home-hero-side-day-label">{day.label}</p>
                            <div className="home-hero-side-day-stats">
                              <span className="home-hero-side-day-add">
                                {isToday ? (
                                  <>
                                    +
                                    <span
                                      className="home-hero-card-count-up"
                                      style={
                                        {
                                          "--count-target": day.added,
                                        } as React.CSSProperties
                                      }
                                    />
                                  </>
                                ) : (
                                  `+${day.added}`
                                )}
                              </span>
                              <span className="home-hero-side-day-rem">
                                {isToday ? (
                                  <>
                                    -
                                    <span
                                      className="home-hero-card-count-up"
                                      style={
                                        {
                                          "--count-target": day.removed,
                                        } as React.CSSProperties
                                      }
                                    />
                                  </>
                                ) : (
                                  `-${day.removed}`
                                )}
                              </span>
                              <span className="home-hero-side-day-meta">
                                {isToday ? (
                                  <span
                                    className="home-hero-card-count-up"
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
                              <span className="home-hero-side-day-meta">
                                {isToday ? (
                                  <span
                                    className="home-hero-card-count-up"
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
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </HeroGraphicMotion>

          {/* Mobile-only static export of the digest graphic. The live
            animated graphic above is display:none below 768px and
            this <img> takes over: scaling the 976px live graphic
            down hit iOS text-autosizing and sub-pixel drift, so on
            mobile we show a flat PNG export of the Figma — pixel-
            exact and autosizing-proof, at the cost of the streaming
            animation. Desktop keeps the live graphic. aria-hidden:
            decorative, same as the live graphic. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-graphic.png"
            alt=""
            aria-hidden
            width={1952}
            height={1168}
            className="home-hero-graphic-img"
          />
        </section>

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
        <section className="home-section home-trust">
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
        </section>

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
