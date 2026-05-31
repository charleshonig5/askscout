/**
 * askScout brand logo (icon + wordmark lockup).
 *
 * Renders both color variants and shows the right one based on the
 * current theme via CSS rules keyed off `[data-theme="dark"]` on the
 * <html> element. The theme attribute is set server-side in
 * `apps/web/src/app/layout.tsx` before any client JS runs (read from
 * the user's theme cookie), so swapping happens cleanly at SSR with
 * no flash of wrong logo.
 *
 * Two source SVGs live in the public folder:
 *   - /logo-black.svg → light mode (dark logo on light bg)
 *   - /logo-white.svg → dark mode (light logo on dark bg)
 *
 * Both are vector outlines (no embedded fonts) so they render
 * identically across browsers and OSes.
 *
 * Size by passing `height` in pixels. Width is computed from the
 * source viewBox aspect ratio (1358 × 243 ≈ 5.59:1) so the lockup
 * never distorts and there's no layout shift while the SVG loads.
 */

const VIEWBOX_WIDTH = 1355;
const VIEWBOX_HEIGHT = 243;
const ASPECT_RATIO = VIEWBOX_WIDTH / VIEWBOX_HEIGHT;

export interface LogoProps {
  /** Logo height in pixels. Width is computed from the lockup's
   *  aspect ratio. Defaults to 20px which fits the marketing nav
   *  rhythm. */
  height?: number;
  /** Optional class on the wrapper span — useful for fluid sizing
   *  (e.g. the giant footer wordmark) where height comes from CSS
   *  rather than a fixed pixel value. */
  className?: string;
  /** Override the alt text. Defaults to "askScout" since this is
   *  the brand wordmark. Pass an empty string when the logo sits
   *  next to a redundant brand label and screen readers should
   *  ignore it. */
  alt?: string;
}

export function Logo({ height = 20, className, alt = "askScout" }: LogoProps) {
  const width = Math.round(height * ASPECT_RATIO);
  const cls = ["brand-logo", className].filter(Boolean).join(" ");
  return (
    <span className={cls}>
      {/* Light-mode variant — visible by default, hidden when
          [data-theme="dark"] is set on <html>. */}
      <img
        src="/logo-black.svg"
        alt={alt}
        width={width}
        height={height}
        className="brand-logo-light"
        draggable={false}
      />
      {/* Dark-mode variant — hidden by default, shown via the
          theme rule. aria-hidden so screen readers only announce
          the logo once across both <img> elements. */}
      <img
        src="/logo-white.svg"
        alt=""
        aria-hidden
        width={width}
        height={height}
        className="brand-logo-dark"
        draggable={false}
      />
    </span>
  );
}
