import { Terminal, ChartPie, NotebookText, Sparkles, Check, X } from "lucide-react";

/**
 * Glanceable comparison matrix for the four options covered in
 * /articles/best-ways-to-track-what-you-shipped. Renders as a card
 * (bg-secondary + inset 1px border + inset glow + 8px radius —
 * same chrome as .home-faq-card / .articles-card so it sits
 * naturally inside an article body).
 *
 * Four criteria rows × four option columns. The first three rows
 * use neutral primary-color cell labels; the fourth row ("Scales at
 * AI volume") uses semantic success/warning/danger color so the
 * scan-the-table reader lands on the visual punch line — only the
 * automated digest scales.
 *
 * Placement: rendered at the top of the article's "How to pick"
 * section so a reader who already knows what they want can skip
 * the four prose options and jump straight to the answer.
 *
 * Responsive: overflow-x: auto on the wrapper so the table never
 * blows past the 720px reading column on narrow viewports. At
 * mobile widths the matrix scrolls horizontally rather than
 * stacking — preserves the comparison-grid metaphor.
 */
export function TrackOptionsMatrix() {
  return (
    <div className="article-compare-card" role="region" aria-label="Comparison matrix">
      <table className="article-compare-table">
        <thead>
          <tr>
            <th aria-label="Criterion" />
            <th>
              <span className="article-compare-th-inner">
                <Terminal size={14} strokeWidth={1.5} aria-hidden />
                Git log
              </span>
            </th>
            <th>
              <span className="article-compare-th-inner">
                <ChartPie size={14} strokeWidth={1.5} aria-hidden />
                GitHub Insights
              </span>
            </th>
            <th>
              <span className="article-compare-th-inner">
                <NotebookText size={14} strokeWidth={1.5} aria-hidden />
                Journal
              </span>
            </th>
            <th>
              <span className="article-compare-th-inner">
                <Sparkles size={14} strokeWidth={1.5} aria-hidden />
                Automated digest
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Effort</th>
            <td>None</td>
            <td>None</td>
            <td>High (daily)</td>
            <td>One-time setup</td>
          </tr>
          <tr>
            <th scope="row">Output</th>
            <td>Raw commits</td>
            <td>Counts only</td>
            <td>High when kept</td>
            <td>Plain-English summary</td>
          </tr>
          <tr>
            <th scope="row">Cost</th>
            <td>Free</td>
            <td>Free</td>
            <td>Free</td>
            <td>Free or fractions of a cent</td>
          </tr>
          <tr>
            <th scope="row">AI volume</th>
            <td>
              <span className="article-compare-rating article-compare-rating--bad">
                <X size={14} strokeWidth={2} aria-hidden /> No
              </span>
            </td>
            <td>
              <span className="article-compare-rating article-compare-rating--partial">
                Partial
              </span>
            </td>
            <td>
              <span className="article-compare-rating article-compare-rating--bad">
                <X size={14} strokeWidth={2} aria-hidden /> No
              </span>
            </td>
            <td>
              <span className="article-compare-rating article-compare-rating--good">
                <Check size={14} strokeWidth={2} aria-hidden /> Yes
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
