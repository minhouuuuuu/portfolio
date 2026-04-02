import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["gsap", "framer-motion", "three"],
  },
};

export default nextConfig;
