import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  // Transpile specific packages
  transpilePackages: ["@tailwindcss/postcss"],
  // Add experimental features
  experimental: {
    // Enable app directory
    appDir: true,
    // Disable server components for now to avoid hydration issues
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
