import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "askscout | The daily digest for vibe coders",
  description:
    "Scout sniffs through your repo and tells you what you built, what changed, and where you left off.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
