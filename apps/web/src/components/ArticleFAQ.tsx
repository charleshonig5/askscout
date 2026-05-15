import { Fragment } from "react";
import { ChevronDown } from "lucide-react";

interface ArticleFAQItem {
  q: string;
  a: string;
}

/**
 * Article FAQ — Figma 257:4894. A single accordion card of the
 * article's questions, reusing the home/docs FAQ styling (.home-faq-*
 * card, rows, chevron, dividers) so it is visually identical to the
 * site FAQ — minus the segmented tabs, which articles don't need.
 *
 * Native <details> rows so the section works without JS and every
 * answer is in the initial HTML for crawlers. Fed by each article's
 * FAQ_PLAIN data, so the questions stay article-specific.
 */
export function ArticleFAQ({ items }: { items: ArticleFAQItem[] }) {
  return (
    <section className="article-faq">
      <h2 className="home-faq-title">Frequently asked questions</h2>
      <div className="home-faq-card">
        {items.map((item, i) => (
          <Fragment key={item.q}>
            {i > 0 ? <div className="home-faq-divider" aria-hidden /> : null}
            <details className="home-faq-item">
              <summary className="home-faq-question">
                <span>{item.q}</span>
                <ChevronDown
                  size={28}
                  strokeWidth={1.25}
                  className="home-faq-chevron"
                  aria-hidden
                />
              </summary>
              <div className="home-faq-answer">
                <p>{item.a}</p>
              </div>
            </details>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
