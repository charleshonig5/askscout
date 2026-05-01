/**
 * Small mock surface kept ONLY for the marketing landing page demo.
 *
 * Production paths (dashboard, history, repo picker) read from
 * `/api/digest/stream`, `/api/history`, and `/api/repos` respectively —
 * nothing in this file drives live product behavior.
 *
 * `HistoryEntry` also lives here because the Sidebar + dashboard share it
 * as the render-time row shape for history items. Consider moving it to
 * `@/types` on a future pass.
 */

export interface HistoryEntry {
  id: string;
  date: string;
  vibeCheck: string;
  commits: number;
  filesChanged: number;
  /** Total lines added across the day. Rendered as "+N" in the sidebar. */
  linesAdded: number;
  /** Total lines removed across the day. Rendered as "-N" in the sidebar. */
  linesRemoved: number;
  /** ISO timestamp the digest was inserted into the DB. The Sidebar uses this
   *  to decide whether an entry is "fresh" (created during this session, so
   *  it deserves the slide-in + glow reveal) vs pre-existing (already there
   *  when the user landed, render silently). */
  createdAt: string;
}

/** Raw streaming-text sample used by the landing page to demo a digest. */
export const MOCK_STREAMING_TEXT = `\ud83d\udcac Vibe Check
You're building fast. Shipped OAuth and a settings page in one session, and the checkout flow is almost there. Just that Stripe handler needs some love.

\ud83d\ude80 Shipped
Scout dug up 2 new things you got working:
  \u2022 Google OAuth login flow, users can now sign in with Google
  \u2022 Settings page with dark mode toggle

\ud83d\udd27 Changed
Scout noticed you were poking around in 3 spots:
  \u2022 Pricing page got a new layout with better copy
  \u2022 Nav bar now links to settings
  \u2022 API rate limiting logic was tightened

\u26a0\ufe0f Unstable
Scout keeps tripping over this one:
  \u2022 Stripe webhook handler, changed 4 times and still wobbly

\ud83d\udccd Left Off
Here's where you left your bone:
  \u2022 Checkout flow. Cart works but payment submission isn't wired up yet

\ud83d\udcca 1,204 lines added \u00b7 389 removed`;
