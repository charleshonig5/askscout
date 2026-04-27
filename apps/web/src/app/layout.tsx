import type { Metadata } from "next";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${workSans.variable} ${pridi.variable}`}>
      <head>
        {/* Pre-hydration theme bootstrap. Validates the stored value
            before applying so a junk localStorage entry can't slip
            through and silently fall back to the :root light styles
            (any value other than "dark"/"light" coerces to "dark").
            Dark is Scout's default — first-time visitors and users
            with cleared storage land in dark mode every time. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='dark'&&t!=='light')t='dark';document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()`,
          }}
        />
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
