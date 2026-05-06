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
};

export default nextConfig;
