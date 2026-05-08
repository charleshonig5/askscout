/**
 * Digest email template.
 *
 * Mirrors the on-screen digest design system exactly: dark-mode color
 * palette pulled from globals.css, same section structures, same
 * typography scale, same Vibe Check bordered card, same Field Notes
 * vertical-line accent, same dot bullets. Email-safe primitives via
 * @react-email so this renders correctly across Gmail, Apple Mail,
 * Outlook.
 *
 * What we keep from the web:
 *   - Section emojis as the only visual marker for each section header
 *   - Work Sans typography (with system-font fallback for clients that
 *     strip web fonts)
 *   - 12 / 18 body, 16px / Medium 500 section labels, 600 weight on
 *     bullet titles + Field Notes subtitle
 *   - Vibe Check rendered as a bordered card with bg-secondary and
 *     border tokens
 *   - Field Notes rendered with a vertical hairline (1px border-left
 *     on a table cell — most reliable email-safe equivalent of the
 *     web's flex-stretch rule)
 *   - Bulleted sections use a small round dot before each item, same
 *     position as on the web
 *
 * What degrades from the web:
 *   - Vibe Check inset glow (box-shadow inset 0 0 40px) is not
 *     reliably supported in email clients — drops cleanly to a flat
 *     border + bg-secondary fill
 *   - Coding Timeline chart is omitted (charts don't render in email).
 *     The CTA at the bottom links back to the web for it.
 *   - Health bars degrade to text rows
 *
 * Light/dark: this template is dark-mode-only. Email-client dark mode
 * handling varies wildly (Gmail iOS recolors, Outlook Mac inverts,
 * Apple Mail respects @media). Forcing dark with the
 * color-scheme/supported-color-schemes meta and inline backgrounds is
 * the most reliable path. We can add a light variant later if needed.
 */

import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

const WEB_URL = "https://askscout.dev";

// Dark-mode palette pulled directly from globals.css :root[data-theme="dark"].
// Hard-coded as hex literals here because email clients do not support
// CSS variables. If the web tokens change, mirror them here.
const c = {
  bgPrimary: "#070707",
  bgSecondary: "#121212",
  bgTertiary: "#252525",
  bgElevated: "#141414",
  textPrimary: "#ededed",
  textSecondary: "#a0a0a0",
  textTertiary: "#616161",
  border: "#222222",
  borderHover: "#333333",
} as const;

const fonts = {
  // Work Sans first, then web-safe stack. Outlook strips the @import,
  // and many clients refuse to load custom fonts at all — the system
  // stack covers that case without re-flowing the layout.
  sans: '"Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  // Pridi (serif display) is reserved for digest titles in the web app.
  // Email clients vary on custom-font support — Apple Mail respects
  // the @font-face import; Gmail and Outlook strip it. Fall back to a
  // serif system stack so the display character survives.
  display: '"Pridi", Georgia, "Times New Roman", "Cambria", serif',
};

// Spacing scale roughly mirroring globals.css var(--space-*) tokens.
// Email layout works in tens of pixels; we don't need finer than this.
const space = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "14px",
  xl: "28px",
};

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BulletItem {
  title: string;
  context: string;
}

export interface DigestEmailProps {
  /**
   * Title text matching the web's `formatDigestTitle()` helper:
   * "Today's Digest", "Yesterday's Digest", or "April 12th's Digest".
   * Rendered in Pridi serif at 24px / weight 400, same as the
   * dashboard's `.digest-page-name`.
   */
  digestTitle: string;
  /**
   * Repository slug (e.g. "owner/repo"). Renders as a small Work Sans
   * Light 12 chip under the title — mirrors the dashboard's
   * `.digest-repo-chip` pattern so email recipients can immediately
   * see which repo this digest is for when they have multiple.
   */
  repoName: string;
  /**
   * Full date label (e.g. "Thursday, May 8, 2026"). Renders in
   * Work Sans Light 12 / text-primary, 4px below the title — matches
   * the dashboard's `.digest-page-date`.
   */
  dateLabel: string;
  vibeCheck?: string;
  shipped: BulletItem[];
  changed: BulletItem[];
  unstable: BulletItem[];
  leftOff: BulletItem[];
  fieldNotes?: { subtitle: string; body: string };
  keyTakeaways?: string;
  stats?: {
    commits?: number;
    filesChanged?: number;
    linesAdded?: number;
    linesRemoved?: number;
    topFiles?: Array<{ file: string; added?: number; removed?: number; commits: number }>;
    health?: {
      growth?: { level: string; added: number; removed: number };
      focus?: { level: string; filesPerCommit: number };
      churn?: { level: string; files: number };
    } | null;
    pace?: { multiplier: number; label: string; todayCommits: number; avgCommits: number } | null;
  } | null;
  visibility?: Record<string, boolean>;
}

const isVisible = (visibility: Record<string, boolean> | undefined, key: string) =>
  !visibility || visibility[key] !== false;

// Collapse mid-paragraph newlines so prose reads as one flowing paragraph
// regardless of where the LLM placed line breaks.
const collapseNewlines = (s: string) => s.replace(/\s*\n+\s*/g, " ").trim();

// ---------------------------------------------------------------------------
// Top-level template
// ---------------------------------------------------------------------------

export function DigestEmail({
  digestTitle,
  repoName,
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
    !!stats &&
    (isVisible(visibility, "statistics") ||
      isVisible(visibility, "mostActiveFiles") ||
      isVisible(visibility, "codebaseHealth") ||
      isVisible(visibility, "paceCheck"));

  return (
    <Html>
      <Head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="x-apple-disable-message-reformatting" />
        {/* Force the email's color scheme so clients that auto-invert
            (Outlook, some iOS Gmail) leave our intentional dark theme
            alone. */}
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
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "32px 24px 48px",
            backgroundColor: c.bgPrimary,
          }}
        >
          {/* --- Header: wordmark + Pridi serif title + repo + date
              Mirrors the dashboard header exactly:
                - .digest-page-name: Pridi serif display, 24px, weight
                  400, color text-primary, no letter-spacing
                - .digest-page-date: Work Sans Light 12, color
                  text-primary, 4px margin-top
              The repo chip pattern (.digest-repo-chip) sits below the
              date as a small Work Sans Light 12 pill — bg-tertiary,
              90px radius, 4×8 padding — matching the dashboard's
              "quiet metadata next to the serif title" treatment. */}
          <Section style={{ paddingBottom: "20px" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: fonts.sans,
                fontWeight: 500,
                fontSize: "13px",
                lineHeight: "1",
                color: c.textSecondary,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              AskScout
            </Text>
          </Section>
          <Section style={{ paddingBottom: "12px" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: fonts.display,
                fontWeight: 400,
                fontSize: "24px",
                lineHeight: "normal",
                color: c.textPrimary,
                letterSpacing: 0,
              }}
            >
              {digestTitle}
            </Text>
            <Text
              style={{
                margin: "4px 0 0",
                fontFamily: fonts.sans,
                fontWeight: 300,
                fontSize: "12px",
                lineHeight: "normal",
                color: c.textPrimary,
                letterSpacing: 0,
              }}
            >
              {dateLabel}
            </Text>
          </Section>
          <Section style={{ paddingBottom: space.xl }}>
            <Text
              style={{
                margin: 0,
                display: "inline-block",
                padding: "4px 8px",
                borderRadius: "90px",
                backgroundColor: c.bgTertiary,
                fontFamily: fonts.sans,
                fontWeight: 300,
                fontSize: "12px",
                lineHeight: "1",
                color: c.textPrimary,
                letterSpacing: 0,
              }}
            >
              {repoName}
            </Text>
          </Section>

          <Hr style={{ borderTop: `1px solid ${c.border}`, margin: `0 0 ${space.xl}` }} />

          {/* --- Vibe Check (bordered card) ----------------------- */}
          {vibeCheck && isVisible(visibility, "vibeCheck") && (
            <VibeCheckCard body={vibeCheck} />
          )}

          {/* --- Bulleted sections -------------------------------- */}
          {shipped.length > 0 && isVisible(visibility, "shipped") && (
            <BulletSection emoji="🚀" label="Shipped" items={shipped} />
          )}
          {changed.length > 0 && isVisible(visibility, "changed") && (
            <BulletSection emoji="🔧" label="Changed" items={changed} />
          )}
          {unstable.length > 0 && isVisible(visibility, "unstable") && (
            <BulletSection emoji="🔁" label="Still Shifting" items={unstable} />
          )}
          {leftOff.length > 0 && isVisible(visibility, "leftOff") && (
            <BulletSection emoji="📍" label="Left Off" items={leftOff} />
          )}

          {/* --- Field Notes (vertical-line accent) --------------- */}
          {fieldNotes &&
            (fieldNotes.subtitle || fieldNotes.body) &&
            isVisible(visibility, "fieldNotes") && (
              <FieldNotesSection
                subtitle={fieldNotes.subtitle}
                body={fieldNotes.body}
              />
            )}

          {/* --- Key Takeaways (prose) ---------------------------- */}
          {keyTakeaways && isVisible(visibility, "oneTakeaway") && (
            <ProseSection emoji="🔑" label="Key Takeaways" body={keyTakeaways} />
          )}

          {/* --- Statistics (text-only, no charts) ---------------- */}
          {showStats && stats && <StatsSection stats={stats} visibility={visibility} />}

          {/* --- CTA back to web for the visual experience -------- */}
          <Section style={{ paddingTop: space.lg }}>
            <Hr
              style={{
                borderTop: `1px solid ${c.border}`,
                margin: `0 0 ${space.xl}`,
              }}
            />
            <Link
              href={`${WEB_URL}/dashboard`}
              style={{
                display: "inline-block",
                padding: "10px 16px",
                backgroundColor: c.bgTertiary,
                color: c.textPrimary,
                fontFamily: fonts.sans,
                fontWeight: 500,
                fontSize: "13px",
                lineHeight: "1",
                textDecoration: "none",
                borderRadius: "8px",
                border: `1px solid ${c.border}`,
              }}
            >
              Open in AskScout for full stats
            </Link>
          </Section>

          {/* --- Footer ------------------------------------------- */}
          <Section style={{ paddingTop: "32px" }}>
            <Hr
              style={{
                borderTop: `1px solid ${c.border}`,
                margin: `0 0 ${space.lg}`,
              }}
            />
            <Text
              style={{
                margin: 0,
                fontFamily: fonts.sans,
                fontWeight: 300,
                fontSize: "11px",
                lineHeight: "16px",
                color: c.textTertiary,
                textAlign: "center",
              }}
            >
              You received this because you clicked Email on your AskScout digest.{" "}
              <Link
                href={`${WEB_URL}/settings`}
                style={{ color: c.textSecondary, textDecoration: "underline" }}
              >
                Manage settings
              </Link>
            </Text>
            <Text
              style={{
                margin: "8px 0 0",
                fontFamily: fonts.sans,
                fontWeight: 300,
                fontSize: "11px",
                lineHeight: "16px",
                color: c.textTertiary,
                textAlign: "center",
              }}
            >
              <Link
                href={WEB_URL}
                style={{ color: c.textTertiary, textDecoration: "none" }}
              >
                askscout.dev
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Vibe Check — the only section that uses the bordered card surface
 *  in the web digest. Drop the inset glow (no email support) and keep
 *  the bg-secondary fill + border. */
function VibeCheckCard({ body }: { body: string }) {
  return (
    <Section style={{ paddingBottom: space.xl }}>
      <Section
        style={{
          backgroundColor: c.bgSecondary,
          border: `1px solid ${c.border}`,
          borderRadius: "8px",
          padding: "13px",
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
          💬 Vibe Check
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
    </Section>
  );
}

/** Bulleted section (Shipped / Changed / Still Shifting / Left Off).
 *  Header row with emoji + label + count pill, then a list of items
 *  each with a small round dot + bold title + light context. */
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
    <Section style={{ paddingBottom: space.xl }}>
      {/* Header row: emoji + label + count pill */}
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
            {emoji} {label}
          </Text>
        </Column>
        <Column style={{ width: "auto", verticalAlign: "middle" }}>
          <Text
            style={{
              margin: 0,
              display: "inline-block",
              padding: "3px 6px",
              borderRadius: "60px",
              backgroundColor: c.bgTertiary,
              fontFamily: fonts.sans,
              fontWeight: 300,
              fontSize: "12px",
              lineHeight: "1",
              color: c.textPrimary,
            }}
          >
            {items.length}
          </Text>
        </Column>
        <Column />
      </Row>

      {/* Bullet list */}
      <Section style={{ paddingTop: space.lg }}>
        {items.map((item, i) => (
          <Section
            key={i}
            style={{ paddingBottom: i === items.length - 1 ? 0 : space.lg }}
          >
            <Row>
              {/* 16px bullet column with a centered round dot. Approximated
                  in email-safe markup by using a Unicode mid-dot in the
                  body color set to text-secondary, baseline-aligned with
                  the text. */}
              <Column
                style={{
                  width: "16px",
                  verticalAlign: "top",
                  paddingTop: "5px",
                }}
              >
                <Text
                  style={{
                    margin: 0,
                    fontFamily: fonts.sans,
                    fontSize: "12px",
                    lineHeight: "8px",
                    color: c.textSecondary,
                  }}
                >
                  •
                </Text>
              </Column>
              <Column style={{ verticalAlign: "top", paddingLeft: space.xs }}>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: fonts.sans,
                    fontSize: "12px",
                    lineHeight: "18px",
                    color: c.textPrimary,
                  }}
                >
                  {item.title && (
                    <span style={{ fontWeight: 600 }}>{item.title}</span>
                  )}
                  {item.title && item.context && (
                    <span style={{ fontWeight: 300 }}> - </span>
                  )}
                  {item.context && (
                    <span style={{ fontWeight: 300 }}>{item.context}</span>
                  )}
                </Text>
              </Column>
            </Row>
          </Section>
        ))}
      </Section>
    </Section>
  );
}

/** Field Notes — emoji + label header, then a body row with a
 *  vertical hairline accent on the left and a content column with
 *  bold subtitle + body paragraph. The hairline is a 1px left border
 *  on a table cell, which is the most reliable email-safe equivalent
 *  of the web's flex-stretch rule. */
function FieldNotesSection({ subtitle, body }: { subtitle: string; body: string }) {
  const cleanedBody = collapseNewlines(body);
  return (
    <Section style={{ paddingBottom: space.xl }}>
      {/* Header */}
      <Text
        style={{
          margin: `0 0 ${space.lg}`,
          fontFamily: fonts.sans,
          fontWeight: 500,
          fontSize: "16px",
          lineHeight: "normal",
          color: c.textPrimary,
        }}
      >
        🧭 Field Notes
      </Text>

      {/* Body row: 1px left border on the content column = vertical hairline */}
      <Row>
        <Column
          style={{
            width: "4px",
            paddingLeft: "4px",
          }}
        />
        <Column
          style={{
            borderLeft: `1px solid ${c.border}`,
            paddingLeft: space.lg,
            verticalAlign: "top",
          }}
        >
          {subtitle && (
            <Text
              style={{
                margin: `0 0 ${space.xs}`,
                fontFamily: fonts.sans,
                fontWeight: 600,
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
    </Section>
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
    <Section style={{ paddingBottom: space.xl }}>
      <Text
        style={{
          margin: `0 0 ${space.lg}`,
          fontFamily: fonts.sans,
          fontWeight: 500,
          fontSize: "16px",
          lineHeight: "normal",
          color: c.textPrimary,
        }}
      >
        {emoji} {label}
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

/** Statistics — text-only summary. Cards row, top files list,
 *  codebase health, pace check. Coding Timeline is intentionally
 *  omitted (charts don't render in email; CTA links back to web). */
function StatsSection({
  stats,
  visibility,
}: {
  stats: NonNullable<DigestEmailProps["stats"]>;
  visibility: DigestEmailProps["visibility"];
}) {
  const fmt = (n: number) => n.toLocaleString("en-US");
  return (
    <Section style={{ paddingBottom: space.xl }}>
      {/* Umbrella header */}
      <Text
        style={{
          margin: `0 0 ${space.lg}`,
          fontFamily: fonts.sans,
          fontWeight: 500,
          fontSize: "16px",
          lineHeight: "normal",
          color: c.textPrimary,
        }}
      >
        📊 Statistics
      </Text>

      {/* Cards row */}
      {isVisible(visibility, "statistics") && stats.commits != null && (
        <Section style={{ paddingBottom: space.lg }}>
          <Section
            style={{
              backgroundColor: c.bgSecondary,
              border: `1px solid ${c.border}`,
              borderRadius: "8px",
              padding: "12px 14px",
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: fonts.sans,
                fontWeight: 500,
                fontSize: "13px",
                lineHeight: "18px",
                color: c.textPrimary,
              }}
            >
              +{fmt(stats.linesAdded ?? 0)} lines · -{fmt(stats.linesRemoved ?? 0)} lines ·{" "}
              {fmt(stats.commits)} commits · {fmt(stats.filesChanged ?? 0)} files
            </Text>
          </Section>
        </Section>
      )}

      {/* Most Active Files */}
      {isVisible(visibility, "mostActiveFiles") && (stats.topFiles?.length ?? 0) > 0 && (
        <Section style={{ paddingBottom: space.lg }}>
          <Text
            style={{
              margin: `0 0 ${space.sm}`,
              fontFamily: fonts.sans,
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: c.textSecondary,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Most Active Files
          </Text>
          {stats.topFiles!.map((f, i) => (
            <Text
              key={i}
              style={{
                margin: "0 0 4px",
                fontFamily: fonts.sans,
                fontWeight: 300,
                fontSize: "12px",
                lineHeight: "18px",
                color: c.textPrimary,
              }}
            >
              {i + 1}. {f.file} (+{fmt(f.added ?? 0)} / -{fmt(f.removed ?? 0)},{" "}
              {f.commits} {f.commits === 1 ? "commit" : "commits"})
            </Text>
          ))}
        </Section>
      )}

      {/* Codebase Health */}
      {isVisible(visibility, "codebaseHealth") &&
        stats.health?.growth?.level &&
        stats.health.focus?.level &&
        stats.health.churn?.level && (
          <Section style={{ paddingBottom: space.lg }}>
            <Text
              style={{
                margin: `0 0 ${space.sm}`,
                fontFamily: fonts.sans,
                fontWeight: 500,
                fontSize: "12px",
                lineHeight: "18px",
                color: c.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Codebase Health
            </Text>
            <Text
              style={{
                margin: "0 0 4px",
                fontFamily: fonts.sans,
                fontWeight: 300,
                fontSize: "12px",
                lineHeight: "18px",
                color: c.textPrimary,
              }}
            >
              Growth: {stats.health.growth.level} (+{fmt(stats.health.growth.added)} / -
              {fmt(stats.health.growth.removed)})
            </Text>
            <Text
              style={{
                margin: "0 0 4px",
                fontFamily: fonts.sans,
                fontWeight: 300,
                fontSize: "12px",
                lineHeight: "18px",
                color: c.textPrimary,
              }}
            >
              Focus: {stats.health.focus.level} ({stats.health.focus.filesPerCommit} files
              touched per commit)
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
              Churn: {stats.health.churn.level} ({stats.health.churn.files}{" "}
              {stats.health.churn.files === 1 ? "file" : "files"} reworked)
            </Text>
          </Section>
        )}

      {/* Pace Check */}
      {isVisible(visibility, "paceCheck") &&
        stats.pace &&
        typeof stats.pace.multiplier === "number" && (
          <Section>
            <Text
              style={{
                margin: `0 0 ${space.sm}`,
                fontFamily: fonts.sans,
                fontWeight: 500,
                fontSize: "12px",
                lineHeight: "18px",
                color: c.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Pace Check
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
              <span style={{ fontWeight: 500 }}>{stats.pace.multiplier}x</span> ·{" "}
              {stats.pace.label}
              <br />
              {stats.pace.todayCommits} commits today · {stats.pace.avgCommits}-commit avg
            </Text>
          </Section>
        )}
    </Section>
  );
}

export default DigestEmail;
