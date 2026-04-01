import type { Digest } from "@askscout/core";

export const MOCK_REPOS = [
  "charleshonig5/askscout",
  "charleshonig5/portfolio",
  "charleshonig5/weather-app",
];

export const MOCK_DIGEST: Digest = {
  vibeCheck:
    "You're building fast \u2014 shipped OAuth and a settings page in one session, and the checkout flow is almost there. Just that Stripe handler needs some love.",
  shipped: [
    { summary: "Google OAuth login flow \u2014 users can now sign in with Google" },
    { summary: "Settings page with dark mode toggle" },
  ],
  changed: [
    { summary: "Pricing page got a new layout with better copy" },
    { summary: "Nav bar now links to settings" },
    { summary: "API rate limiting logic was tightened" },
  ],
  unstable: [
    {
      summary: "Stripe webhook handler",
      changeCount: 4,
    },
  ],
  leftOff: [
    { summary: "Checkout flow \u2014 cart works but payment submission isn't wired up yet" },
  ],
  stats: {
    commits: 34,
    filesChanged: 47,
    linesAdded: 1204,
    linesRemoved: 389,
    timeSpan: {
      from: new Date(Date.now() - 8 * 60 * 60 * 1000),
      to: new Date(),
    },
  },
  health: [
    {
      label: "Momentum",
      level: "Strong",
      score: 8,
      detail: "3 new features this week",
    },
    {
      label: "Stability",
      level: "Okay",
      score: 6,
      detail: "Stripe handler still churning",
    },
    {
      label: "Focus",
      level: "Strong",
      score: 9,
      detail: "mostly checkout flow work",
    },
  ],
};

export const MOCK_RESUME =
  "Recently shipped: Google OAuth login flow; Settings page with dark mode toggle. Recent changes: Pricing page layout; Nav bar links; API rate limiting. Potentially unstable areas: Stripe webhook handler. Continue working on: Checkout flow payment submission.";

export const MOCK_STANDUP = {
  done: [
    "Google OAuth login flow \u2014 users can sign in with Google",
    "Settings page with dark mode toggle",
  ],
  inProgress: ["Checkout flow \u2014 cart works but payment not wired"],
  blockers: ["Stripe webhook handler \u2014 changed 4 times, still unstable"],
};

/** Simulates what a streaming digest looks like as raw text before parsing */
export const MOCK_STREAMING_TEXT = `\ud83d\udcac Vibe Check
You're building fast \u2014 shipped OAuth and a settings page in one session, and the checkout flow is almost there. Just that Stripe handler needs some love.

\ud83d\ude80 Shipped
Scout dug up 2 new things you got working:
  \u2022 Google OAuth login flow \u2014 users can now sign in with Google
  \u2022 Settings page with dark mode toggle

\ud83d\udd27 Changed
Scout noticed you were poking around in 3 spots:
  \u2022 Pricing page got a new layout with better copy
  \u2022 Nav bar now links to settings
  \u2022 API rate limiting logic was tightened

\u26a0\ufe0f Unstable
Scout keeps tripping over this one:
  \u2022 Stripe webhook handler \u2014 changed 4 times, still wobbly

\ud83d\udccd Left Off
Here's where you left your bone:
  \u2022 Checkout flow \u2014 cart works but payment submission isn't wired up yet

\ud83d\udcca 1,204 lines added \u00b7 389 removed`;
