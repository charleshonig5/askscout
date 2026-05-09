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
  /** Repo slug, rendered as a chip with a forward arrow next to the title. */
  repoName: string;
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
  const previewText = vibeCheck
    ? collapseNewlines(vibeCheck).slice(0, 120)
    : `Your AskScout digest for ${repoName}`;

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
      </Head>
      <Preview>{previewText}</Preview>
      <Body
        style={{
          // Body bg is the lighter #121212 ("page" color). The dark
          // digest area sits on top and fills the email-pane width
          // edge-to-edge, so the lighter color is only visible BELOW
          // the digest where the footer lives, never on the sides.
          backgroundColor: c.bgSecondary,
          fontFamily: fonts.sans,
          margin: 0,
          padding: 0,
          color: c.textPrimary,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        {/* TOP DIGEST SECTION — full pane width, bg #070707, rounded
            BOTTOM corners only. Renders as a 100%-wide table with the
            dark fill, so the email-pane edges are dark with no lighter
            color visible on the sides. The 30px rounded-bottom corners
            "scoop" into the lighter body bg below, giving the visual
            transition from digest to footer. Sides have no border (a
            border at the email pane edge looks awkward in most
            clients); the rounded curve + color contrast does the
            visual separation work. */}
        <Section
          style={{
            backgroundColor: c.bgPrimary,
            borderBottomLeftRadius: "30px",
            borderBottomRightRadius: "30px",
            margin: 0,
          }}
        >
          {/* Inner Container holds the 600px-centered digest content.
              boxSizing: border-box ensures padding is included inside
              the 600px width rather than added to it, so the rendered
              element is exactly 600px wide and never overflows the
              email pane. */}
          <Container
            style={{
              maxWidth: "600px",
              width: "600px",
              margin: "0 auto",
              padding: "23px 0 40px",
              boxSizing: "border-box",
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
          <Section style={{ paddingLeft: "33px", paddingRight: "33px", paddingBottom: "30px" }}>
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
                    <RepoChip repoName={repoName} />
                    {streak != null && streak > 0 && (
                      <span style={{ marginLeft: "8px" }}>
                        <StreakChip days={streak} />
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            {/* Date below the title row — Figma stacks title + date in
                a flex column with no gap; line-height creates the
                visual separation. margin: 0 to remove browser default. */}
            <Text
              style={{
                margin: 0,
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
          <div style={{ paddingTop: "24px", paddingLeft: "33px", paddingRight: "33px" }}>
            {vibeCheck && isVisible(visibility, "vibeCheck") && (
              <SectionWrapper marginBottom={44}>
                <VibeCheckCard body={vibeCheck} />
              </SectionWrapper>
            )}

            {shipped.length > 0 && isVisible(visibility, "shipped") && (
              <SectionWrapper marginBottom={44}>
                <BulletSection emoji="🚀" label="Shipped" items={shipped} />
              </SectionWrapper>
            )}

            {changed.length > 0 && isVisible(visibility, "changed") && (
              <SectionWrapper marginBottom={44}>
                <BulletSection emoji="🔧" label="Changed" items={changed} />
              </SectionWrapper>
            )}

            {unstable.length > 0 && isVisible(visibility, "unstable") && (
              <SectionWrapper marginBottom={44}>
                <BulletSection emoji="🔁" label="Still Shifting" items={unstable} />
              </SectionWrapper>
            )}

            {leftOff.length > 0 && isVisible(visibility, "leftOff") && (
              <SectionWrapper marginBottom={44}>
                <BulletSection emoji="📍" label="Left Off" items={leftOff} />
              </SectionWrapper>
            )}

            {fieldNotes &&
              (fieldNotes.subtitle || fieldNotes.body) &&
              isVisible(visibility, "fieldNotes") && (
                <SectionWrapper marginBottom={44}>
                  <FieldNotesSection
                    subtitle={fieldNotes.subtitle}
                    body={fieldNotes.body}
                  />
                </SectionWrapper>
              )}

            {keyTakeaways && isVisible(visibility, "oneTakeaway") && (
              <SectionWrapper marginBottom={44}>
                <ProseSection emoji="🔑" label="Key Takeaways" body={keyTakeaways} />
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
              href={`${WEB_URL}/dashboard?repo=${encodeURIComponent(repoName)}`}
            />
          </div>
        </Container>
        </Section>

        {/* FOOTER SECTION — full pane width, bg #121212. Sits directly
            below the rounded-bottom of the digest section so the
            lighter surface is visible only here, never on the sides
            of the digest. Inner Container holds 600px-centered
            content; inside that, the footer block is left-aligned at
            33px in a narrow 175px column matching the Figma frame
            (left:33, w:175). The 175px constraint wraps the
            "You sent this to yourself..." line to two narrow lines
            intentionally per the design. */}
        <Section
          style={{
            backgroundColor: c.bgSecondary,
            margin: 0,
          }}
        >
          <Container
            style={{
              maxWidth: "600px",
              width: "600px",
              margin: "0 auto",
              padding: "30px 33px 40px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ width: "175px" }}>
              <Img
                src={`${WEB_URL}/logo-white.svg`}
                alt="AskScout"
                width="113"
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
                You sent this to yourself from your AskScout digest.
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
                © 2026 AskScout
              </Text>
            </div>
          </Container>
        </Section>
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

/** Section-header emoji rendered at 20px, 8px right margin. Mirrors
 *  the web's <Emoji size={20} /> + flex gap:8 on the title row. */
function SectionEmoji({ char }: { char: string }) {
  return (
    <span
      style={{
        fontSize: "20px",
        lineHeight: "1",
        verticalAlign: "middle",
        marginRight: "8px",
      }}
    >
      {char}
    </span>
  );
}

/** Lucide `Forward` icon at 10×10 — same glyph the dashboard's
 *  .digest-repo-chip uses (see Dashboard.tsx where <Forward
 *  size={10} /> is rendered next to the repo name). Inline SVG so
 *  it embeds directly into the email HTML.
 *
 *  Lucide `SquareArrowUpRight` icon at 20×20 — same glyph the
 *  dashboard's "View Last Digest" / open-digest buttons use. */
const SVG_FORWARD =
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>';
const SVG_SQUARE_ARROW_UP_RIGHT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 8h8v8"/><path d="m8 16 8-8"/></svg>';

/** Repo chip — bg-tertiary pill with the repo slug + Lucide Forward
 *  glyph (10×10). Wraps in an <a> that opens the repo on GitHub in
 *  a new tab, matching the dashboard's .digest-repo-chip behavior. */
function RepoChip({ repoName }: { repoName: string }) {
  return (
    <Link
      href={`https://github.com/${repoName}`}
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
      <span
        style={{
          display: "inline-block",
          width: "10px",
          height: "10px",
          marginLeft: "4px",
          verticalAlign: "middle",
          color: c.textPrimary,
        }}
        dangerouslySetInnerHTML={{ __html: SVG_FORWARD }}
      />
    </Link>
  );
}

/** Streak chip — fire-emoji + "N Day Streak" pill that mirrors
 *  .digest-streak on the web. Rendered next to the repo chip in the
 *  email header. */
function StreakChip({ days }: { days: number }) {
  return (
    <span
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
      <span style={{ fontSize: "14px", lineHeight: "1", verticalAlign: "middle", marginRight: "4px" }}>
        🔥
      </span>
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
        <SectionEmoji char="💬" />
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
  emoji,
  label,
  items,
}: {
  emoji: string;
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
              <span
                style={{
                  fontSize: "20px",
                  lineHeight: "1",
                  verticalAlign: "middle",
                  marginRight: "8px",
                }}
              >
                {emoji}
              </span>
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
                  width: "16px",
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
        <SectionEmoji char="🧭" />
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
  emoji,
  label,
  body,
}: {
  emoji: string;
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
        <SectionEmoji char={emoji} />
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
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/></svg>';
const SVG_FILE_TEXT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>';

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
      <span
        style={{
          display: "inline-block",
          width: "20px",
          height: "20px",
          verticalAlign: "middle",
          marginRight: "8px",
          color: c.textPrimary,
        }}
        dangerouslySetInnerHTML={{ __html: SVG_SQUARE_ARROW_UP_RIGHT }}
      />
      <span
        style={{
          fontFamily: fonts.sans,
          fontWeight: 300,
          fontSize: "16px",
          lineHeight: "normal",
          color: c.textPrimary,
          verticalAlign: "middle",
          whiteSpace: "nowrap",
        }}
      >
        Open Full Digest
      </span>
    </Link>
  );
}

export default DigestEmail;
