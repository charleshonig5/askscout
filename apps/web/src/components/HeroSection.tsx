import type React from "react";
import {
  ChartPie,
  ChevronDown,
  Copy,
  Download,
  FileText,
  Forward,
  GitCommitHorizontal,
  Send,
  Settings2,
} from "lucide-react";
import { signIn } from "@/auth";
import { Emoji } from "@/components/Emoji";
import { GitHubMark } from "@/components/GitHubMark";
import { HeroBgVideo } from "@/components/HeroBgVideo";
import { HeroCardOpener } from "@/components/HeroCardOpener";
import { HeroGraphicMotion } from "@/components/HeroGraphicMotion";
import { InstallChip } from "@/components/InstallChip";
import { Logo } from "@/components/Logo";

/* Bullet sections inside the digest card — fake content sized to
   match Figma 244:2099. */
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

interface Props {
  /** Override the hero background video. Defaults to the production
   *  /hero-starfield.mp4. The /dev/hero-video-test route uses this
   *  prop to render the same hero with a candidate replacement video
   *  alongside the production one. */
  videoSrc?: string;
  /** When true, the GitHub sign-in CTA is rendered as a visual-only
   *  button instead of a real form. Use this in test environments
   *  where we don't want clicking the CTA to start an OAuth flow. */
  ctaDisabled?: boolean;
}

/**
 * Hero section for the marketing homepage. Renders the editorial
 * title, trust chips, CTAs, and the animated digest preview card
 * over a silent looping starfield video background.
 *
 * Extracted from MarketingHome.tsx so the /dev/hero-video-test
 * compare route can render two instances side-by-side with
 * different videos — visual comparison happens against the real
 * production hero treatment, not a stripped-down mock.
 *
 * Server component (no "use client") because it embeds a server
 * action in the GitHub sign-in form. The interactive child pieces
 * (HeroBgVideo, HeroGraphicMotion, HeroCardOpener, InstallChip)
 * are client components and run normally.
 */
export function HeroSection({ videoSrc, ctaDisabled = false }: Props = {}) {
  return (
    <section className="home-hero">
      <HeroBgVideo src={videoSrc} />
      <div className="home-hero-bg-darken" aria-hidden />
      <div className="home-hero-bg-fade" aria-hidden />
      <div className="home-hero-inner">
        <div className="home-hero-text-stack">
          <div className="home-hero-headline">
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
            <h1 className="home-hero-title">
              <span className="home-hero-title-light">Your morning</span> code{" "}
              <br className="home-hero-title-br" />
              briefing <span className="home-hero-title-light">in 10 seconds</span>
            </h1>
          </div>
          <p className="home-hero-subtitle">
            A daily digest of your code in plain language so you can pick up exactly where you left
            off.
          </p>
        </div>
        <div className="home-hero-cta">
          {ctaDisabled ? (
            <button type="button" className="home-cta" disabled>
              <GitHubMark />
              Continue with GitHub
            </button>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/dashboard" });
              }}
            >
              <button type="submit" className="home-cta">
                <GitHubMark />
                Continue with GitHub
              </button>
            </form>
          )}
          <InstallChip />
        </div>
      </div>

      <HeroGraphicMotion>
        <div className="home-hero-graphic" aria-hidden>
          <div className="home-hero-frame">
            <div className="home-hero-frame-inner">
              <div className="home-hero-frame-card">
                <HeroCardOpener />

                <div className="home-hero-card-divider home-hero-card-divider--h" />
                <div className="home-hero-card-divider home-hero-card-divider--v" />

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
                              <span className="home-hero-card-bullet-title">{item.title}</span> -{" "}
                              <span className="home-hero-card-bullet-body">{item.body}</span>
                            </p>
                          </li>
                        ))}
                      </ul>
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

                <div className="home-hero-card-right" data-section="statistics">
                  <span className="home-hero-card-section-title">
                    <Emoji name="statistics" size={16} />
                    Statistics
                    <span className="home-hero-card-live" aria-hidden>
                      Live
                      <span className="home-hero-card-live-dot" />
                    </span>
                  </span>
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

                <div className="home-hero-card-fade" />
              </div>

              <div className="home-hero-side-top">
                <Logo height={14} />
                <div className="home-hero-side-utils">
                  <ChartPie size={14} strokeWidth={1} />
                  <Settings2 size={14} strokeWidth={1} />
                </div>
              </div>

              <div className="home-hero-side-repo">
                <span>askscout</span>
                <ChevronDown size={14} strokeWidth={1} />
              </div>

              <div className="home-hero-side-days">
                <div className="home-hero-side-days-active" />
                <div className="home-hero-side-days-list">
                  {HERO_GRAPHIC_DAYS.map((day, i) => {
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
        animated graphic above is display:none below 768px and this
        <img> takes over: scaling the 976px live graphic down hit iOS
        text-autosizing and sub-pixel drift, so on mobile we show a
        flat PNG export of the Figma. */}
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
  );
}
