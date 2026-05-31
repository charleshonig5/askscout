import { Terminal, ChartPie, NotebookText, Sparkles, Check, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Comparison "matrix" for the four options covered in
 * /articles/best-ways-to-track-what-you-shipped — rendered as a
 * stack of four ELEVATED option cards rather than a flat HTML
 * table, so the visual reads as four surfaces in conversation
 * instead of a spreadsheet.
 *
 * Each card:
 *   - Card chrome: bg-secondary + inset 1px border + inset 0 0 40px
 *     inner-glow + 8px radius. Identical surface to .home-faq-card
 *     and .articles-card so the visuals nest inside an article body
 *     without inventing a new pattern.
 *   - Top-left: a lucide icon in a bg-tertiary squircle "well"
 *     (matches the visual treatment of icons in .docs-webapp-card)
 *     followed by the tool name (Pridi 22, the same display tier
 *     home bento cards use).
 *   - Bottom-right: a wrapping row of CRITERION chips. Each chip
 *     mirrors .home-readycta-badge's shape (4px radius, inset 1px
 *     outline, 4/8 padding) — passive on a transparent surface so
 *     they're scannable without competing with the card itself.
 *   - The final "Scales at AI volume" chip uses semantic color
 *     (--color-success / --color-warning / --color-danger) so the
 *     reader's eye lands on the comparison's actual punch line.
 *
 * Stacked vertically with 14px gap so the column reads top-to-
 * bottom; on wide enough containers the criterion chips wrap to
 * one line, on phones they wrap to two.
 *
 * Placement: top of the article's "How to pick" section so a
 * reader who's already half-decided can skip the prose decision
 * tree below.
 */

type Verdict = "good" | "partial" | "bad";

interface Option {
  name: string;
  icon: LucideIcon;
  criteria: Array<{ label: string; value: string }>;
  scales: { verdict: Verdict; label: string };
}

const OPTIONS: Option[] = [
  {
    name: "Git log",
    icon: Terminal,
    criteria: [
      { label: "Effort", value: "None" },
      { label: "Output", value: "Raw commits" },
      { label: "Cost", value: "Free" },
    ],
    scales: { verdict: "bad", label: "Doesn't scale" },
  },
  {
    name: "GitHub Insights",
    icon: ChartPie,
    criteria: [
      { label: "Effort", value: "None" },
      { label: "Output", value: "Counts only" },
      { label: "Cost", value: "Free" },
    ],
    scales: { verdict: "partial", label: "Scales partially" },
  },
  {
    name: "Developer journal",
    icon: NotebookText,
    criteria: [
      { label: "Effort", value: "High, daily" },
      { label: "Output", value: "High when kept" },
      { label: "Cost", value: "Free" },
    ],
    scales: { verdict: "bad", label: "Doesn't scale" },
  },
  {
    name: "Automated digest",
    icon: Sparkles,
    criteria: [
      { label: "Effort", value: "One-time setup" },
      { label: "Output", value: "Plain-English summary" },
      { label: "Cost", value: "Free or fractions of a cent" },
    ],
    scales: { verdict: "good", label: "Scales at AI volume" },
  },
];

export function TrackOptionsMatrix() {
  return (
    <div className="article-compare" role="region" aria-label="Tracking options comparison">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <article key={option.name} className="article-compare-option">
            <header className="article-compare-option-head">
              <span className="article-compare-option-icon" aria-hidden>
                <Icon size={20} strokeWidth={1.5} />
              </span>
              <h3 className="article-compare-option-name">{option.name}</h3>
            </header>
            <ul className="article-compare-option-chips">
              {option.criteria.map((c) => (
                <li key={c.label} className="article-compare-chip">
                  <span className="article-compare-chip-label">{c.label}</span>
                  <span className="article-compare-chip-value">{c.value}</span>
                </li>
              ))}
              <li
                className={`article-compare-chip article-compare-chip--verdict article-compare-chip--${option.scales.verdict}`}
              >
                {option.scales.verdict === "good" ? (
                  <Check size={12} strokeWidth={2} aria-hidden />
                ) : option.scales.verdict === "bad" ? (
                  <X size={12} strokeWidth={2} aria-hidden />
                ) : null}
                <span className="article-compare-chip-value">{option.scales.label}</span>
              </li>
            </ul>
          </article>
        );
      })}
    </div>
  );
}
