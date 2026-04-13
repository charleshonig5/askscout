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
};

export default nextConfig;
