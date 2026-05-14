import type { MetadataRoute } from "next";

/* Robots source. Next compiles this into the live /robots.txt at
   build time. Crawlers are allowed everywhere by default, with
   explicit Disallow on auth-gated surfaces and API/internal routes
   so they never leak into search results. The Sitemap line points
   crawlers directly at the URL index emitted by sitemap.ts. */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/settings",
          "/settings/",
          "/insights",
          "/dev/",
        ],
      },
    ],
    sitemap: "https://askscout.dev/sitemap.xml",
    host: "https://askscout.dev",
  };
}
