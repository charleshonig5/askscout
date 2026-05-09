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
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

const WEB_URL = "https://askscout.dev";

// Dark-mode palette pulled directly from globals.css.
const c = {
  bgPrimary: "#070707",
  bgSecondary: "#121212",
  bgTertiary: "#252525",
  textPrimary: "#ededed",
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
          backgroundColor: c.bgPrimary,
          fontFamily: fonts.sans,
          margin: 0,
          padding: 0,
          color: c.textPrimary,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        {/* The email card. 600px wide, rounded-bottom 30px, 1px border
            in tertiary (#252525) per the Figma frame. Padding inside is
            33px sides / 23px top so the header sits exactly where the
            design places it. */}
        <Container
          style={{
            maxWidth: "600px",
            width: "600px",
            margin: "0 auto",
            backgroundColor: c.bgPrimary,
            border: `1px solid ${c.border}`,
            borderTop: "none",
            borderRadius: "0 0 30px 30px",
            padding: "23px 33px 40px",
          }}
        >
          {/* HEADER --------------------------------------------------- */}
          <Section style={{ paddingBottom: "22px" }}>
            {/* Title row: serif title + repo chip + streak chip */}
            <Row>
              <Column style={{ width: "auto", verticalAlign: "middle", paddingRight: "14px" }}>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: fonts.display,
                    fontWeight: 400,
                    fontSize: "24px",
                    lineHeight: "normal",
                    color: c.textPrimary,
                    whiteSpace: "nowrap",
                  }}
                >
                  {digestTitle}
                </Text>
              </Column>
              <Column style={{ width: "auto", verticalAlign: "middle", paddingRight: "8px" }}>
                <RepoChip repoName={repoName} />
              </Column>
              {streak != null && streak > 0 && (
                <Column style={{ width: "auto", verticalAlign: "middle" }}>
                  <StreakChip days={streak} />
                </Column>
              )}
              <Column />
            </Row>
            {/* Date below the title row */}
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

          {/* HR divider — 1px line at full width below the header */}
          <Hr
            style={{
              borderTop: `1px solid ${c.border}`,
              margin: "0 -33px",
              width: "calc(100% + 66px)",
            }}
          />

          {/* CONTENT SECTIONS — 44px gap between them ------------------ */}
          <div style={{ paddingTop: "24px" }}>
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
              <SectionWrapper marginBottom={44}>
                <StatsLine stats={stats} />
              </SectionWrapper>
            )}

            {/* CTA — Open Full Digest button */}
            <CTAButton href={`${WEB_URL}/dashboard`} />
          </div>
        </Container>

        {/* FOOTER — outside the card. Logo wordmark + copy. ----------- */}
        <Container
          style={{
            maxWidth: "600px",
            width: "600px",
            margin: "0 auto",
            padding: "30px 33px 40px",
          }}
        >
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
            }}
          >
            © 2026 AskScout
          </Text>
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

/** Repo chip — small bg-tertiary pill with the repo slug + a forward
 *  arrow glyph, matching .digest-repo-chip on the web. */
function RepoChip({ repoName }: { repoName: string }) {
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
      {repoName}
      <span
        style={{
          display: "inline-block",
          marginLeft: "4px",
          fontSize: "10px",
          lineHeight: "1",
          verticalAlign: "middle",
          color: c.textSecondary,
        }}
      >
        ↗
      </span>
    </span>
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
      {/* Header row */}
      <Row>
        <Column style={{ width: "auto", verticalAlign: "middle" }}>
          <Text
            style={{
              margin: 0,
              fontFamily: fonts.sans,
              fontWeight: 500,
              fontSize: "16px",
              lineHeight: "normal",
              color: c.textPrimary,
              paddingRight: space.sm,
              whiteSpace: "nowrap",
            }}
          >
            <SectionEmoji char={emoji} />
            {label}
          </Text>
        </Column>
        <Column style={{ width: "auto", verticalAlign: "middle" }}>
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
            }}
          >
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </Column>
        <Column />
      </Row>

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

/** Stats line — single horizontal row at Work Sans Regular 12 with
 *  +N lines (green), -N lines (red), N commits, N files, separated
 *  by 14px gaps. No emoji header — just the numbers. */
function StatsLine({ stats }: { stats: NonNullable<DigestEmailProps["stats"]> }) {
  const fmt = (n: number) => n.toLocaleString("en-US");
  return (
    <Row>
      <Column style={{ width: "auto", paddingRight: "14px", verticalAlign: "middle" }}>
        <Text
          style={{
            margin: 0,
            fontFamily: fonts.sans,
            fontWeight: 400,
            fontSize: "12px",
            lineHeight: "normal",
            color: c.green,
            whiteSpace: "nowrap",
          }}
        >
          +{fmt(stats.linesAdded ?? 0)} lines
        </Text>
      </Column>
      <Column style={{ width: "auto", paddingRight: "14px", verticalAlign: "middle" }}>
        <Text
          style={{
            margin: 0,
            fontFamily: fonts.sans,
            fontWeight: 400,
            fontSize: "12px",
            lineHeight: "normal",
            color: c.red,
            whiteSpace: "nowrap",
          }}
        >
          -{fmt(stats.linesRemoved ?? 0)} lines
        </Text>
      </Column>
      <Column style={{ width: "auto", paddingRight: "14px", verticalAlign: "middle" }}>
        <Text
          style={{
            margin: 0,
            fontFamily: fonts.sans,
            fontWeight: 400,
            fontSize: "12px",
            lineHeight: "normal",
            color: c.textPrimary,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: "14px", marginRight: "4px", verticalAlign: "middle" }}>
            ⎇
          </span>
          {fmt(stats.commits ?? 0)} commits
        </Text>
      </Column>
      <Column style={{ width: "auto", verticalAlign: "middle" }}>
        <Text
          style={{
            margin: 0,
            fontFamily: fonts.sans,
            fontWeight: 400,
            fontSize: "12px",
            lineHeight: "normal",
            color: c.textPrimary,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: "14px", marginRight: "4px", verticalAlign: "middle" }}>
            📄
          </span>
          {fmt(stats.filesChanged ?? 0)} files
        </Text>
      </Column>
      <Column />
    </Row>
  );
}

/** Open Full Digest CTA — bordered card with icon + Light 16 label,
 *  inset glow, mirroring the design's button treatment. */
function CTAButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        padding: "10px 14px",
        backgroundColor: c.bgPrimary,
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
          fontSize: "16px",
          lineHeight: "1",
          verticalAlign: "middle",
          marginRight: "8px",
        }}
      >
        ↗
      </span>
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
