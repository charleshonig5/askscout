import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@askscout/core"],
  eslint: {
    // We run ESLint separately via `pnpm lint` — don't fail the build on warnings
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
