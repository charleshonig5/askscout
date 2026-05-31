/**
 * Digest email template — implementing Figma node 279:2224.
 *
 * Outer page (#070707) → email card (600px, rounded-bottom 30px,
 * 1px border #252525) → header → hr → content sections → CTA button →
 * (outside the card) footer with logo wordmark + copy.
 *
 * Section spacing inside the card is 44px; internal section spacing
 * is 14px (heading → body, bullet → bullet). Vibe Check is the only
 * section wrapped in a bordered card with the inset glow. Field Notes
 * uses a vertical hairline accent on the left of its body row.
 *
 * Email-safe primitives only — no Tailwind, no flex math that
 * doesn't survive Outlook. All sizing/colors via inline styles
 * pulled from the design tokens hard-coded below (mirroring
 * globals.css :root[data-theme="dark"]).
 */

import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

const WEB_URL = "https://askscout.dev";

// Dark-mode palette. Bg/border colors mirror globals.css; text color
// uses pure white #ffffff to match the Figma email design exactly
// (the web app uses #ededed but the email design specifies #ffffff
// — slightly higher contrast for inbox rendering).
const c = {
  bgPrimary: "#070707",
  bgSecondary: "#121212",
  bgTertiary: "#252525",
  textPrimary: "#ffffff",
  textSecondary: "#a0a0a0",
  textTertiary: "#616161",
  border: "#252525",
  // Page color OUTSIDE the dark card. Off-white that reads as
  // "paper" in any client's light mode and is light-enough that
  // dark-mode clients tend to leave it alone (or only mildly
  // darken it) instead of force-inverting. Brand newsletters
  // (Substack, Stripe Press, NYT briefings) all use a similar
  // muted off-white for this slot.
  // Page color OUTSIDE the 600px column. Off-white #fafafa — the
  // same value the dashboard's light-mode `--color-bg-secondary`
  // uses, so the email's page tone matches the web app instead of
  // being pure white. Subtle enough to keep dark-mode inverters
  // from muddying it but visibly warmer than #ffffff.
  pageBg: "#fafafa",
  // Stats colors per the design.
  green: "#57d32e",
  red: "#dd1d1d",
} as const;

const fonts = {
  sans: '"Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  display: '"Pridi", Georgia, "Times New Roman", "Cambria", serif',
};

// Spacing tokens matching globals.css. gap14 is the digest's internal
// section gap (heading → body, bullet → bullet). The 44px between
// top-level sections in this email is its own value used inline.
const space = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  gap14: "14px",
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BulletItem {
  title: string;
  context: string;
}

export interface DigestEmailProps {
  /** Title — e.g. "Today's Digest". Pridi serif 24/400 in the header. */
  digestTitle: string;
  /** Short repo display name (e.g. "askscout") — shown in the chip
   *  and the subject line. Matches the dashboard convention of
   *  `selectedRepo.split("/").pop()`. */
  repoName: string;
  /** Full "owner/repo" slug used for the GitHub link target on the
   *  chip and the "Open in dashboard" CTA. Falls back to repoName
   *  when omitted so the type remains backwards-compatible with
   *  callers that haven't been updated. */
  repoFullName?: string;
  /** Optional consecutive-days streak. Renders the fire-emoji chip when present. */
  streak?: number;
  /** Full date label, e.g. "Thursday, May 8, 2026". */
  dateLabel: string;
  vibeCheck?: string;
  shipped: BulletItem[];
  changed: BulletItem[];
  unstable: BulletItem[];
  leftOff: BulletItem[];
  fieldNotes?: { subtitle: string; body: string };
  keyTakeaways?: string;
  /** Headline stats — rendered as a single horizontal line below
   *  Key Takeaways. The +/- lines use semantic green/red. */
  stats?: {
    commits?: number;
    filesChanged?: number;
    linesAdded?: number;
    linesRemoved?: number;
  } | null;
  visibility?: Record<string, boolean>;
}

const isVisible = (visibility: Record<string, boolean> | undefined, key: string) =>
  !visibility || visibility[key] !== false;

const collapseNewlines = (s: string) => s.replace(/\s*\n+\s*/g, " ").trim();

// ---------------------------------------------------------------------------
// Top-level template
// ---------------------------------------------------------------------------

export function DigestEmail({
  digestTitle,
  repoName,
  repoFullName,
  streak,
  dateLabel,
  vibeCheck,
  shipped,
  changed,
  unstable,
  leftOff,
  fieldNotes,
  keyTakeaways,
  stats,
  visibility,
}: DigestEmailProps) {
  // Always use the full slug for GitHub / dashboard links; fall back
  // to repoName when callers haven't passed it (older call sites).
  const fullSlug = repoFullName ?? repoName;
  const previewText = vibeCheck
    ? collapseNewlines(vibeCheck).slice(0, 120)
    : `Your askScout digest for ${repoName}`;

  const showStats =
    !!stats && isVisible(visibility, "statistics") && stats.commits != null;

  return (
    <Html>
      <Head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        {/*
         * Force-dark stylesheet. Email clients implement dark/light
         * mode wildly inconsistently:
         *
         *   - Apple Mail (iOS + macOS) reads the meta tags above and
         *     leaves a dark-mode email alone. No further work needed.
         *   - Gmail web respects the meta tags.
         *   - Gmail mobile (iOS app especially) IGNORES the meta tags
         *     and force-inverts emails it decides are "dark on light,"
         *     producing the broken-contrast look the user saw.
         *   - Outlook.com uses [data-ogsc] / [data-ogsb] attributes
         *     on the body in dark mode.
         *
         * Belt-and-braces: declare color-scheme at :root, hard-pin
         * the body/card backgrounds with !important inside a
         * prefers-color-scheme: light media query, and add Outlook
         * data-* overrides. Combined, this keeps the dark palette in
         * every client we care about — including light-mode Outlook
         * and most Gmail mobile cases. The Gmail iOS app's
         * auto-inverter is buggy enough that NO solution makes it
         * perfect, but this stops the worst contrast failures.
         */}
        <style>{`
          :root {
            color-scheme: dark;
            supported-color-schemes: dark;
          }
          @media (prefers-color-scheme: light) {
            .force-dark-bg { background-color: ${c.bgSecondary} !important; }
            .force-dark-card { background-color: ${c.bgPrimary} !important; }
            .force-dark-chip { background-color: ${c.bgTertiary} !important; }
            .force-dark-text { color: ${c.textPrimary} !important; }
            .force-dark-text-muted { color: ${c.textSecondary} !important; }
            .force-dark-border { border-color: ${c.border} !important; }
          }
          /* Outlook.com / Outlook Web — apply on the body via attribute. */
          [data-ogsc] .force-dark-text { color: ${c.textPrimary} !important; }
          [data-ogsc] .force-dark-text-muted { color: ${c.textSecondary} !important; }
          [data-ogsb] .force-dark-bg { background-color: ${c.bgSecondary} !important; }
          [data-ogsb] .force-dark-card { background-color: ${c.bgPrimary} !important; }
          [data-ogsb] .force-dark-chip { background-color: ${c.bgTertiary} !important; }
        `}</style>
      </Head>
      <Preview>{previewText}</Preview>
      <Body
        style={{
          // White page bg per Figma 442:2. The dark 600px column
          // touches the top and bottom of the page (no vertical
          // margin on Body) so it reads as a full-height postcard
          // on a sheet of paper. Page itself stays light — the dark
          // column below carries its own force-dark protection so
          // client-side inverters can't flip it to light.
          backgroundColor: c.pageBg,
          fontFamily: fonts.sans,
          margin: 0,
          padding: 0,
          color: c.textPrimary,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        {/* OUTER COLUMN — 600px wide, centered, 1px #252525 border,
            bg #121212 (the lighter "footer" shade), NO rounded
            corners (the column touches the top + bottom of the
            white page per Figma 442:3). The darker digest panel
            nests inside this column with its own rounded bottom
            corners, so the visible #121212 only appears below the
            digest scoop where the footer block sits. */}
        <Container
          width="600"
          className="force-dark-card force-dark-border force-dark-text"
          style={{
            backgroundColor: c.bgSecondary,
            border: `1px solid ${c.border}`,
            maxWidth: "600px",
            width: "600px",
            margin: "0 auto",
            padding: 0,
            boxSizing: "border-box",
          }}
        >
        {/* DIGEST PANEL — bg #070707, 1px border, rounded BOTTOM
            corners only (30px). Sits flush against the top edge of
            the outer column and "scoops" out at the bottom to
            reveal the lighter #121212 footer band below. Per Figma
            442:4 the panel's border continues the outer column's
            border seamlessly — same color, same width. */}
        <div
          className="force-dark-card force-dark-border force-dark-text"
          style={{
            backgroundColor: c.bgPrimary,
            borderBottomLeftRadius: "30px",
            borderBottomRightRadius: "30px",
            // No top/side borders here — the outer Container's
            // border already paints those edges. Setting borders
            // on a side that's already painted would double up
            // visually in clients that anti-alias differently.
            padding: "24px 0 40px",
          }}
        >
          {/* HEADER ---------------------------------------------------
              Header inset is 33px sides + 23px top from container.
              paddingBottom is sized so the divider lands at the
              Figma's top:98. With a Pridi 24 title (~30px tall) +
              Light 12 date (~14px tall) + 23px top padding,
              paddingBottom 30 puts the divider at ~97-98 — matching
              the design.

              Title row uses a single-cell table with inline elements
              for the same reason BulletSection does — Row/Column
              redistributes width across cells, pushing the chips
              away from the title. Single cell + inline-blocks +
              explicit margins = chips sit exactly 14px and 8px from
              their neighbors. */}
          <Section style={{ paddingLeft: "34px", paddingRight: "34px", paddingBottom: "24px" }}>
            <table
              cellPadding={0}
              cellSpacing={0}
              border={0}
              role="presentation"
              style={{ borderCollapse: "collapse" }}
            >
              <tbody>
                <tr>
                  <td style={{ padding: 0, verticalAlign: "middle", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        fontFamily: fonts.display,
                        fontWeight: 400,
                        fontSize: "24px",
                        lineHeight: "normal",
                        color: c.textPrimary,
                        verticalAlign: "middle",
                        marginRight: "14px",
                      }}
                    >
                      {digestTitle}
                    </span>
                    <RepoChip repoName={repoName} repoFullName={fullSlug} />
                    {streak != null && streak > 0 && (
                      <span style={{ marginLeft: "8px" }}>
                        <StreakChip days={streak} />
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            {/* Date below the title row — 4px margin-top per the
                user's spec, slightly more breathing room than the
                Figma's tight line-height-only stack. */}
            <Text
              style={{
                margin: "4px 0 0",
                fontFamily: fonts.sans,
                fontWeight: 300,
                fontSize: "12px",
                lineHeight: "normal",
                color: c.textPrimary,
              }}
            >
              {dateLabel}
            </Text>
          </Section>

          {/* Divider — pixel-clean 1px line edge-to-edge. Implemented as
              a <div> with explicit height + background-color rather
              than <Hr>, because <hr> elements render with browser-
              default anti-aliasing quirks (often visually thinner or
              thicker than a 1px css border). A solid-fill div at
              height:1 paints exactly 1px and matches the card's 1px
              #252525 border weight perfectly. */}
          <div
            style={{
              height: "1px",
              backgroundColor: c.border,
              fontSize: 0,
              lineHeight: 0,
              margin: 0,
            }}
            aria-hidden
          />

          {/* CONTENT SECTIONS — 44px gap between sections in the inner
              column, then 34px gap before the CTA. Wrapped in a div
              that adds the 33px horizontal inset so content sits where
              the Figma frame placed it. */}
          <div style={{ paddingTop: "24px", paddingLeft: "34px", paddingRight: "34px" }}>
            {vibeCheck && isVisible(visibility, "vibeCheck") && (
              <SectionWrapper marginBottom={34}>
                <VibeCheckCard body={vibeCheck} />
              </SectionWrapper>
            )}

            {shipped.length > 0 && isVisible(visibility, "shipped") && (
              <SectionWrapper marginBottom={34}>
                <BulletSection emojiKey="shipped" label="Shipped" items={shipped} />
              </SectionWrapper>
            )}

            {changed.length > 0 && isVisible(visibility, "changed") && (
              <SectionWrapper marginBottom={34}>
                <BulletSection emojiKey="changed" label="Changed" items={changed} />
              </SectionWrapper>
            )}

            {unstable.length > 0 && isVisible(visibility, "unstable") && (
              <SectionWrapper marginBottom={34}>
                <BulletSection emojiKey="unstable" label="Still Shifting" items={unstable} />
              </SectionWrapper>
            )}

            {leftOff.length > 0 && isVisible(visibility, "leftOff") && (
              <SectionWrapper marginBottom={34}>
                <BulletSection emojiKey="leftOff" label="Left Off" items={leftOff} />
              </SectionWrapper>
            )}

            {fieldNotes &&
              (fieldNotes.subtitle || fieldNotes.body) &&
              isVisible(visibility, "fieldNotes") && (
                <SectionWrapper marginBottom={34}>
                  <FieldNotesSection
                    subtitle={fieldNotes.subtitle}
                    body={fieldNotes.body}
                  />
                </SectionWrapper>
              )}

            {keyTakeaways && isVisible(visibility, "oneTakeaway") && (
              <SectionWrapper marginBottom={34}>
                <ProseSection emojiKey="takeaway" label="Key Takeaways" body={keyTakeaways} />
              </SectionWrapper>
            )}

            {showStats && stats && (
              // Stats line is the last item in the gap-44 section group.
              // The gap between the stats line and the CTA below is
              // 34px (the outer-column gap-34 in the Figma layout),
              // not 44px — so this wrapper uses 34 instead of 44.
              <SectionWrapper marginBottom={34}>
                <StatsLine stats={stats} />
              </SectionWrapper>
            )}

            {/* CTA — Open Full Digest button. Deep-links to the
                dashboard with the specific repo selected via the
                `?repo=` query param so the user lands on the exact
                digest the email is for, regardless of whether it's
                their default repo. The dashboard reads this param
                on mount and selects the matching repo. */}
            <CTAButton
              href={`${WEB_URL}/dashboard?repo=${encodeURIComponent(fullSlug)}`}
            />
          </div>
        </div>
        {/* End DIGEST PANEL — the rounded bottom corners above end
            here. Whatever follows sits on the outer column's lighter
            #121212 background, visible beneath the scoop. */}

          {/* FOOTER block — outside the rounded-bottom digest panel,
              inside the outer column, sitting on the column's
              #121212 background per Figma 442:140. The 175px wrap
              on the inner block matches the Figma frame
              (left:33, w:175) — keeps "You sent this to
              yourself..." on two narrow lines as designed. */}
          <div style={{ padding: "33px 34px 40px" }}>
              <div style={{ width: "175px" }}>
              <Img
                src={`${WEB_URL}/logo-white.svg`}
                alt="askScout"
                width="112"
                height="20"
                style={{ display: "block", border: 0, outline: "none" }}
              />
              <Text
                style={{
                  margin: "25px 0 0",
                  fontFamily: fonts.sans,
                  fontWeight: 300,
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: c.textPrimary,
                  width: "175px",
                }}
              >
                You sent this to yourself from your askScout digest.
              </Text>
              <Text
                style={{
                  margin: "14px 0 0",
                  fontFamily: fonts.sans,
                  fontWeight: 300,
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: c.textPrimary,
                  whiteSpace: "nowrap",
                }}
              >
                © 2026 askScout
              </Text>
              </div>
            </div>
        </Container>
      </Body>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Wrapper that gives a section consistent bottom margin. Used so
 *  every top-level section block is preceded by 44px of breathing
 *  room without each component setting its own paddingBottom. */
function SectionWrapper({
  children,
  marginBottom,
}: {
  children: React.ReactNode;
  marginBottom: number;
}) {
  return <div style={{ marginBottom: `${marginBottom}px` }}>{children}</div>;
}

/** Microsoft Fluent Emoji 3D assets — mirrors the product's
 *  apps/web/src/components/Emoji.tsx EMOJI_MAP. Email uses <img>
 *  pointing at the same jsdelivr CDN so the rendered glyphs are
 *  identical to what the dashboard shows, instead of OS-default
 *  Unicode emoji which differ per platform. */
const FLUENT_BASE =
  "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets";
const FLUENT_EMOJI: Record<string, { folder: string; file: string }> = {
  vibe: { folder: "Megaphone", file: "megaphone_3d.png" },
  shipped: { folder: "Rocket", file: "rocket_3d.png" },
  changed: { folder: "Hammer and wrench", file: "hammer_and_wrench_3d.png" },
  unstable: { folder: "Construction", file: "construction_3d.png" },
  leftOff: { folder: "Round pushpin", file: "round_pushpin_3d.png" },
  fieldNotes: { folder: "Compass", file: "compass_3d.png" },
  takeaway: { folder: "Old key", file: "old_key_3d.png" },
  streak: { folder: "Fire", file: "fire_3d.png" },
};

function fluentEmojiUrl(key: keyof typeof FLUENT_EMOJI) {
  const a = FLUENT_EMOJI[key]!;
  return `${FLUENT_BASE}/${encodeURIComponent(a.folder)}/3D/${a.file}`;
}

/** Section-header emoji rendered as a 20×20 Fluent Emoji <img>, with
 *  8px right margin. Mirrors the web's <Emoji size={20} /> + flex
 *  gap:8 on the title row, using the exact same CDN asset. */
function SectionEmoji({ name }: { name: keyof typeof FLUENT_EMOJI }) {
  return (
    <img
      src={fluentEmojiUrl(name)}
      alt=""
      width={20}
      height={20}
      style={{
        display: "inline-block",
        width: "20px",
        height: "20px",
        verticalAlign: "middle",
        marginRight: "8px",
        border: 0,
        outline: "none",
      }}
    />
  );
}

/** Lucide `Forward` icon at 10×10 — same glyph the dashboard's
 *  .digest-repo-chip uses (see Dashboard.tsx where <Forward
 *  size={10} /> is rendered next to the repo name). Inline SVG so
 *  it embeds directly into the email HTML.
 *
 *  Lucide `SquareArrowUpRight` icon at 20×20 — same glyph the
 *  dashboard's "View Last Digest" / open-digest buttons use. */
// SVG_FORWARD used to live here for the repo chip's trailing arrow,
// but Gmail strips inline <svg> via dangerouslySetInnerHTML so the
// glyph never rendered in inbox. The chip now uses a Unicode "→"
// character instead — see RepoChip below.
// SVG_SQUARE_ARROW_UP_RIGHT used to live here for the CTA button's
// leading icon, but Gmail strips inline <svg> injected via
// dangerouslySetInnerHTML so the glyph never rendered in inbox.
// The button now uses a Unicode "↗" character — see CTAButton.

/** Repo chip — bg-tertiary pill with the repo slug + Lucide Forward
 *  glyph (10×10). Wraps in an <a> that opens the repo on GitHub in
 *  a new tab, matching the dashboard's .digest-repo-chip behavior. */
function RepoChip({
  repoName,
  repoFullName,
}: {
  repoName: string;
  repoFullName: string;
}) {
  return (
    <Link
      href={`https://github.com/${repoFullName}`}
      className="force-dark-chip force-dark-text"
      style={{
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: "90px",
        backgroundColor: c.bgTertiary,
        boxShadow: "inset 0 8px 20px 0 rgba(255, 255, 255, 0.04)",
        fontFamily: fonts.sans,
        fontWeight: 300,
        fontSize: "12px",
        lineHeight: "1",
        color: c.textPrimary,
        textDecoration: "none",
        verticalAlign: "middle",
      }}
    >
      {repoName}
      {/* Use the Unicode rightward arrow rather than the inline-SVG
          glyph we use elsewhere. Gmail web (and Outlook) strip
          dangerouslySetInnerHTML-injected <svg> elements wholesale,
          so the SVG never rendered in the inbox — the chip showed
          just the repo name with no trailing arrow. A real character
          survives every email client and styles like any other text. */}
      <span
        style={{
          marginLeft: "6px",
          fontSize: "12px",
          lineHeight: "1",
          color: c.textPrimary,
          verticalAlign: "middle",
        }}
      >
        →
      </span>
    </Link>
  );
}

/** Streak chip — fire-emoji + "N Day Streak" pill that mirrors
 *  .digest-streak on the web. Rendered next to the repo chip in the
 *  email header. */
function StreakChip({ days }: { days: number }) {
  return (
    <span
      className="force-dark-chip force-dark-text"
      style={{
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: "90px",
        backgroundColor: c.bgTertiary,
        boxShadow: "inset 0 8px 20px 0 rgba(255, 255, 255, 0.04)",
        fontFamily: fonts.sans,
        fontWeight: 300,
        fontSize: "12px",
        lineHeight: "1",
        color: c.textPrimary,
      }}
    >
      <img
        src={fluentEmojiUrl("streak")}
        alt=""
        width={14}
        height={14}
        style={{
          display: "inline-block",
          width: "14px",
          height: "14px",
          verticalAlign: "middle",
          marginRight: "4px",
          border: 0,
          outline: "none",
        }}
      />
      {days} Day Streak
    </span>
  );
}

/** Vibe Check — bordered card surface with bg-secondary, 1px border,
 *  8px radius, 14px padding, 8px gap between heading and body, plus
 *  the strong inset glow per the Figma frame
 *  (inset 0 0 40px rgba(255,255,255,0.04)). */
function VibeCheckCard({ body }: { body: string }) {
  return (
    <Section
      style={{
        backgroundColor: c.bgSecondary,
        border: `1px solid ${c.border}`,
        borderRadius: "8px",
        padding: "14px",
        boxShadow: "inset 0 0 40px 0 rgba(255, 255, 255, 0.04)",
      }}
    >
      <Text
        style={{
          margin: `0 0 ${space.sm}`,
          fontFamily: fonts.sans,
          fontWeight: 500,
          fontSize: "16px",
          lineHeight: "normal",
          color: c.textPrimary,
        }}
      >
        <SectionEmoji name="vibe" />
        Vibe Check
      </Text>
      <Text
        style={{
          margin: 0,
          fontFamily: fonts.sans,
          fontWeight: 300,
          fontSize: "12px",
          lineHeight: "18px",
          color: c.textPrimary,
        }}
      >
        {collapseNewlines(body)}
      </Text>
    </Section>
  );
}

/** Bulleted section — emoji + Medium 16 label + count pill ("N items"),
 *  then a 14px-gapped list of bullets. Each bullet is a 16×20 frame
 *  with a 4×4 round dot, followed by Medium 12 title + Light 12
 *  context separated by " - ". */
function BulletSection({
  emojiKey,
  label,
  items,
}: {
  emojiKey: keyof typeof FLUENT_EMOJI;
  label: string;
  items: BulletItem[];
}) {
  return (
    <div>
      {/* Header row — a single-cell table with inline elements rather
          than Row/Column. The Row/Column pattern renders as a multi-
          cell <table> where browsers distribute width across cells,
          which was pushing the count pill far away from the label.
          Single cell + inline-block elements = the pill sits exactly
          8px after the label as the design intends. */}
      <table
        cellPadding={0}
        cellSpacing={0}
        border={0}
        role="presentation"
        style={{ borderCollapse: "collapse" }}
      >
        <tbody>
          <tr>
            <td style={{ padding: 0, verticalAlign: "middle", whiteSpace: "nowrap" }}>
              <img
                src={fluentEmojiUrl(emojiKey)}
                alt=""
                width={20}
                height={20}
                style={{
                  display: "inline-block",
                  width: "20px",
                  height: "20px",
                  verticalAlign: "middle",
                  marginRight: "8px",
                  border: 0,
                  outline: "none",
                }}
              />
              <span
                style={{
                  fontFamily: fonts.sans,
                  fontWeight: 500,
                  fontSize: "16px",
                  lineHeight: "normal",
                  color: c.textPrimary,
                  verticalAlign: "middle",
                  marginRight: "8px",
                }}
              >
                {label}
              </span>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 6px",
                  borderRadius: "60px",
                  backgroundColor: c.bgTertiary,
                  boxShadow: "inset 0 8px 20px 0 rgba(255, 255, 255, 0.04)",
                  fontFamily: fonts.sans,
                  fontWeight: 300,
                  fontSize: "12px",
                  lineHeight: "1",
                  color: c.textPrimary,
                  verticalAlign: "middle",
                }}
              >
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Bullet list — 14px gap below the header, 14px between items */}
      <div style={{ paddingTop: space.gap14 }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{ paddingBottom: i === items.length - 1 ? 0 : space.gap14 }}
          >
            <Row>
              <Column
                style={{
                  width: "12px",
                  verticalAlign: "top",
                  paddingTop: "8px",
                }}
              >
                <div
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    backgroundColor: c.textSecondary,
                    fontSize: 0,
                    lineHeight: 0,
                  }}
                  aria-hidden
                />
              </Column>
              <Column style={{ verticalAlign: "top", paddingLeft: space.xs }}>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: fonts.sans,
                    fontWeight: 300,
                    fontSize: "12px",
                    lineHeight: "18px",
                    color: c.textPrimary,
                  }}
                >
                  {item.title && <span style={{ fontWeight: 500 }}>{item.title}</span>}
                  {item.title && item.context && " - "}
                  {item.context && <span style={{ fontWeight: 300 }}>{item.context}</span>}
                </Text>
              </Column>
            </Row>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Field Notes — emoji + label header, then a body row with a 1px
 *  vertical hairline accent on the left and a content column with
 *  Medium 12 subtitle + Light 12 body, 4px gap between them. */
function FieldNotesSection({ subtitle, body }: { subtitle: string; body: string }) {
  const cleanedBody = collapseNewlines(body);
  return (
    <div>
      <Text
        style={{
          margin: `0 0 ${space.gap14}`,
          fontFamily: fonts.sans,
          fontWeight: 500,
          fontSize: "16px",
          lineHeight: "normal",
          color: c.textPrimary,
        }}
      >
        <SectionEmoji name="fieldNotes" />
        Field Notes
      </Text>
      <Row>
        <Column style={{ width: "4px" }} />
        <Column
          style={{
            borderLeft: `1px solid ${c.border}`,
            paddingLeft: space.gap14,
            verticalAlign: "top",
          }}
        >
          {subtitle && (
            <Text
              style={{
                margin: `0 0 ${space.xs}`,
                fontFamily: fonts.sans,
                fontWeight: 500,
                fontSize: "12px",
                lineHeight: "18px",
                color: c.textPrimary,
              }}
            >
              {subtitle}
            </Text>
          )}
          {cleanedBody && (
            <Text
              style={{
                margin: 0,
                fontFamily: fonts.sans,
                fontWeight: 300,
                fontSize: "12px",
                lineHeight: "18px",
                color: c.textPrimary,
              }}
            >
              {cleanedBody}
            </Text>
          )}
        </Column>
      </Row>
    </div>
  );
}

/** Plain prose section (Key Takeaways). Header + body, no card. */
function ProseSection({
  emojiKey,
  label,
  body,
}: {
  emojiKey: keyof typeof FLUENT_EMOJI;
  label: string;
  body: string;
}) {
  return (
    <div>
      <Text
        style={{
          margin: `0 0 ${space.gap14}`,
          fontFamily: fonts.sans,
          fontWeight: 500,
          fontSize: "16px",
          lineHeight: "normal",
          color: c.textPrimary,
        }}
      >
        <SectionEmoji name={emojiKey} />
        {label}
      </Text>
      <Text
        style={{
          margin: 0,
          fontFamily: fonts.sans,
          fontWeight: 300,
          fontSize: "12px",
          lineHeight: "18px",
          color: c.textPrimary,
        }}
      >
        {collapseNewlines(body)}
      </Text>
    </div>
  );
}

/** Inline SVG icons for the stats line. Lucide-style strokes, 16×16,
 *  rendered via `dangerouslySetInnerHTML` inside a span so the SVG
 *  embeds in the email HTML directly. Modern email clients
 *  (Apple Mail, Gmail web/iOS, Outlook web) render inline SVG;
 *  Outlook desktop's mso engine may strip — in that case the row
 *  shows just the text labels, which is still legible. */
const SVG_GIT_COMMIT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/></svg>';
const SVG_FILE_TEXT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>';

/** 16×16 stats icon. Inline SVG via dangerouslySetInnerHTML.
 *  Color set to text-secondary (#a0a0a0) to match how the same
 *  icons are tinted in the dashboard's stat rows — quieter than
 *  the labels next to them. SVGs use stroke="currentColor" so the
 *  span's color attribute drives the stroke color. */
function StatsIcon({ svg }: { svg: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: "16px",
        height: "16px",
        verticalAlign: "middle",
        marginRight: "4px",
        color: c.textSecondary,
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** Stats line — single horizontal row, Work Sans Regular 12, with
 *  +N lines (green #57d32e), -N lines (red #dd1d1d), git-commit
 *  icon + "N commits", file-text icon + "N Files". Items separated
 *  by exactly 14px via marginLeft on each subsequent block.
 *
 *  Implemented as a single-cell table with inline-block spans
 *  rather than Row/Column, because Row/Column renders as a multi-
 *  cell <table> where browsers distribute width across cells —
 *  spreading items out to fill the available width. Single cell +
 *  inline-block + explicit margins keeps items at the design's
 *  exact 14px spacing. */
function StatsLine({ stats }: { stats: NonNullable<DigestEmailProps["stats"]> }) {
  const fmt = (n: number) => n.toLocaleString("en-US");
  return (
    <table
      cellPadding={0}
      cellSpacing={0}
      border={0}
      role="presentation"
      style={{ borderCollapse: "collapse" }}
    >
      <tbody>
        <tr>
          <td style={{ padding: 0, verticalAlign: "middle", whiteSpace: "nowrap" }}>
            <span
              style={{
                fontFamily: fonts.sans,
                fontWeight: 400,
                fontSize: "12px",
                lineHeight: "normal",
                color: c.green,
                verticalAlign: "middle",
              }}
            >
              +{fmt(stats.linesAdded ?? 0)} lines
            </span>
            <span
              style={{
                fontFamily: fonts.sans,
                fontWeight: 400,
                fontSize: "12px",
                lineHeight: "normal",
                color: c.red,
                verticalAlign: "middle",
                marginLeft: "14px",
              }}
            >
              -{fmt(stats.linesRemoved ?? 0)} lines
            </span>
            <span style={{ marginLeft: "14px", verticalAlign: "middle" }}>
              <StatsIcon svg={SVG_GIT_COMMIT} />
              <span
                style={{
                  fontFamily: fonts.sans,
                  fontWeight: 400,
                  fontSize: "12px",
                  lineHeight: "normal",
                  color: c.textPrimary,
                  verticalAlign: "middle",
                }}
              >
                {fmt(stats.commits ?? 0)} commits
              </span>
            </span>
            <span style={{ marginLeft: "14px", verticalAlign: "middle" }}>
              <StatsIcon svg={SVG_FILE_TEXT} />
              <span
                style={{
                  fontFamily: fonts.sans,
                  fontWeight: 400,
                  fontSize: "12px",
                  lineHeight: "normal",
                  color: c.textPrimary,
                  verticalAlign: "middle",
                }}
              >
                {fmt(stats.filesChanged ?? 0)} Files
              </span>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** Open Full Digest CTA — bordered card with a 20×20 Lucide
 *  SquareArrowUpRight icon (the same glyph the dashboard's
 *  "View Last Digest" / open-digest buttons use) + Work Sans Light
 *  16 label and an inset glow. Background is bg-secondary
 *  (#121212) per the Figma frame; padding 10px vertical / 14px
 *  horizontal matches `py-10 px-14`. */
function CTAButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        padding: "10px 14px",
        backgroundColor: c.bgSecondary,
        border: `1px solid ${c.border}`,
        borderRadius: "8px",
        boxShadow: "inset 0 0 20px 0 rgba(255, 255, 255, 0.04)",
        textDecoration: "none",
        color: c.textPrimary,
      }}
    >
      {/* Inner layout is a single-row table so each cell can use
          vertical-align: middle against the cell box (not text
          baseline). With inline-block + vertical-align: middle, a
          16px text glyph and a 20px icon look slightly offset
          because "middle" aligns to the text's x-height, not the
          glyph's geometric center. Table cells don't have that
          quirk — each cell's content is genuinely centered against
          the row height. */}
      <table
        cellPadding={0}
        cellSpacing={0}
        border={0}
        role="presentation"
        style={{ borderCollapse: "collapse" }}
      >
        <tbody>
          <tr>
            <td
              style={{
                padding: 0,
                verticalAlign: "middle",
                width: "20px",
                lineHeight: 0,
              }}
            >
              {/* Unicode "↗" (north-east arrow) instead of the
                  inline Lucide SquareArrowUpRight SVG — Gmail web
                  and Outlook strip any <svg> injected via
                  dangerouslySetInnerHTML, so the icon disappeared
                  in inbox. A text character survives every client
                  and inherits color like any glyph. Same fix
                  pattern we used on the repo chip's "→". */}
              <span
                style={{
                  display: "block",
                  width: "20px",
                  height: "20px",
                  fontSize: "18px",
                  lineHeight: "20px",
                  textAlign: "center",
                  color: c.textPrimary,
                }}
              >
                ↗
              </span>
            </td>
            <td
              style={{
                padding: "0 0 0 8px",
                verticalAlign: "middle",
                fontFamily: fonts.sans,
                fontWeight: 300,
                fontSize: "16px",
                lineHeight: "normal",
                color: c.textPrimary,
                whiteSpace: "nowrap",
              }}
            >
              Open Full Digest
            </td>
          </tr>
        </tbody>
      </table>
    </Link>
  );
}

export default DigestEmail;
