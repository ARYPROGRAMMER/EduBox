import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["pdf-parse"],
  //   experimental: {
  //   serverComponentsExternalPackages: ["pdf-parse"],
  // },
};

export default nextConfig;
