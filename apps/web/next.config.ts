import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@askscout/core"],
  eslint: {
    ignoreDuringBuilds: true,
  },
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
