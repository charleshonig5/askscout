import type { Metadata } from "next";
import SettingsClient from "./SettingsClient";

/* Server-component wrapper for the settings route.
   See dashboard/page.tsx for the why behind this pattern. */
export const metadata: Metadata = {
  title: "Settings | askScout",
  description: "Manage your askScout account, theme, and notification preferences.",
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return <SettingsClient />;
}
