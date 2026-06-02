import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

/* Server-component wrapper for the dashboard route.
   The actual UI lives in DashboardClient.tsx ("use client") so it can
   use hooks, state, and the streaming digest pipeline. This wrapper
   exists solely so we can export route-specific metadata — client
   components cannot export `metadata`, and inheriting the root layout
   metadata advertised the marketing pitch on a signed-in product page.

   robots is set to noindex/nofollow because the page is gated behind
   GitHub OAuth: there is nothing here for an unauthed crawler to see,
   and we don't want the marketing version of "Dashboard | askScout"
   leaking into search results. */
export const metadata: Metadata = {
  title: "Dashboard | askScout",
  description: "Your daily code digest. What you built, what changed, and where you left off.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
