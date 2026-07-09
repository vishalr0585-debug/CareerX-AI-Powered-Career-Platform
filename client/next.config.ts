import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  reactCompiler: !isDev, // only run in production — too slow in dev
  // Standalone output for containerized/self-hosted deployments (Render, Railway, Docker)
  // Vercel ignores this and uses its own optimized build
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  // Speed up dev by skipping type-check on each compile
  typescript: { ignoreBuildErrors: false },
  // Reduce excessive logging noise
  logging: { fetches: { fullUrl: false } },
};

export default nextConfig;
