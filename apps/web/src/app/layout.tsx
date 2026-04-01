import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "askscout — The daily digest for vibe coders",
  description:
    "Scout sniffs through your repo and tells you what you built, what changed, and where you left off.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
