import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@askscout/core"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  // Convention-name redirects so feed readers and people typing
  // /feed.xml or /atom land on the canonical /dispatch URL.
  async redirects() {
    return [
      { source: "/feed.xml", destination: "/dispatch", permanent: true },
      { source: "/atom", destination: "/dispatch", permanent: true },
      { source: "/rss", destination: "/dispatch", permanent: true },
      { source: "/rss.xml", destination: "/dispatch", permanent: true },
    ];
  },
  /* Security headers applied to every response.
   *
   * - Strict-Transport-Security: forces HTTPS for 2 years and
   *   includes subdomains, with the `preload` directive so the
   *   apex can be submitted to https://hstspreload.org for browsers
   *   to enforce HTTPS on the very first visit.
   * - X-Frame-Options: prevents the site from being iframed, which
   *   would otherwise allow click-jacking against destructive
   *   actions like the account-delete endpoint.
   * - X-Content-Type-Options: blocks MIME-type sniffing.
   * - Referrer-Policy: stops the full URL (which can include repo
   *   names) from leaking to third parties; keeps origin-only for
   *   cross-site.
   * - Permissions-Policy: turns off browser features the app
   *   never uses, so a future XSS can't enumerate them either.
   *
   * Content-Security-Policy:
   *   The session payload (and the GitHub OAuth access_token NextAuth
   *   currently attaches to it) is reachable from any client-side
   *   script via /api/auth/session. The defense against XSS or a
   *   rogue script exfiltrating it is the CSP below — by restricting
   *   what can execute and where it can talk, an attacker can't run
   *   their own script in the page nor send data to an attacker-
   *   controlled origin even if they did.
   *
   *   Inline scripts/styles use 'unsafe-inline' because Next.js
   *   emits both: inline RSC bootstrap scripts and inline styles
   *   for streaming server components / CSS-in-JS. Replacing
   *   'unsafe-inline' with per-request nonces is a future step
   *   (requires middleware integration).
   *
   *   img-src includes https://avatars.githubusercontent.com so any
   *   future direct <img> usage works (next/image already proxies
   *   through /_next/image on same-origin; this is defensive).
   *
   *   form-action includes https://github.com for the NextAuth
   *   OAuth signin flow which redirects there.
   *
   *   frame-ancestors 'none' is the modern replacement for
   *   X-Frame-Options: DENY; kept both for browser coverage.
   *
   *   connect-src is 'self' only — the app makes no direct
   *   third-party fetches from the browser (all GitHub/LLM/
   *   Supabase calls happen server-side via API routes).
   */
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      // jsdelivr is needed for the Microsoft Fluent Emoji assets
      // pulled by <Emoji /> on the marketing hero, sidebar, and FAQ.
      "img-src 'self' data: https://avatars.githubusercontent.com https://cdn.jsdelivr.net",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://github.com",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
