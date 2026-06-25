import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next stops inferring the parent
  // ~/pnpm-lock.yaml as the root (it was emitting a warning at build time).
  turbopack: {
    root: __dirname,
  },

  experimental: {
    optimizePackageImports: ["gsap", "framer-motion", "three"],
  },

  images: {
    // AVIF first — significantly smaller than WebP for the heavy project
    // thumbnails in public/photo; WebP is the fallback for non-AVIF browsers.
    formats: ["image/avif", "image/webp"],
    // Optimized variants are content-hashed, so cache them for a year.
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
