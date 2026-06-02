import type { Metadata } from "next";
import InsightsClient from "./InsightsClient";

/* Server-component wrapper for the insights route.
   See dashboard/page.tsx for the why behind this pattern. */
export const metadata: Metadata = {
  title: "Insights | askScout",
  description: "Your askScout habits over time. Streak, repos, and the patterns in how you ship.",
  robots: { index: false, follow: false },
};

export default function InsightsPage() {
  return <InsightsClient />;
}
