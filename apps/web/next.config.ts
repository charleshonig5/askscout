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
  /* Security headers applied to every response. Intentionally
   * conservative — anything risky (CSP) is deferred until each
   * inline style/script and remote origin is catalogued.
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
   */
  async headers() {
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
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
