import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SessionProvider } from "next-auth/react";
import { Pridi, Work_Sans } from "next/font/google";
import "./globals.css";

// Body / UI typeface. Light + regular + medium + semibold covers every
// weight the app uses today. Italic loaded so the editorial opener
// (.digest-opener) renders true italic rather than synthesized.
const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-work-sans",
  display: "swap",
});

// Display typeface — reserved for digest page titles and the askscout
// wordmark/logo. Loads regular through bold so existing logo weights
// (some at 700) render natively rather than being synthesized.
const pridi = Pridi({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pridi",
  display: "swap",
});

export const metadata: Metadata = {
  title: "askscout | The daily digest for vibe coders",
  description:
    "Scout sniffs through your repo and tells you what you built, what changed, and where you left off.",
};

/**
 * Theme is server-rendered via a cookie. The HTML arrives with the
 * correct data-theme attribute already set, so:
 *   - no flash of the wrong theme on first paint
 *   - no inline bootstrap script that can race with hydration
 *   - no localStorage edge cases (private mode, preview-URL
 *     scoping, browser-clears-on-close settings)
 *
 * The toggle (ThemeToggle.tsx) writes the cookie + updates the
 * attribute on the live document. Default: dark, the brand default.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const stored = cookieStore.get("theme")?.value;
  const theme = stored === "light" || stored === "dark" ? stored : "dark";

  return (
    <html lang="en" data-theme={theme} className={`${workSans.variable} ${pridi.variable}`}>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
