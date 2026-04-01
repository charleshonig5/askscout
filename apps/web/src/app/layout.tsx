import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "askscout \u2014 The daily digest for vibe coders",
  description:
    "Scout sniffs through your repo and tells you what you built, what changed, and where you left off.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
