import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Modern formats. Next.js defaults to this set, but pinning it makes the
    // behavior stable across turbopack/webpack and across Next versions.
    formats: ["image/avif", "image/webp"],
    // Next 16 restricts allowed quality values; declare every value used in
    // the codebase so calls like quality={40} (SixSideCube blur layer) and
    // quality={80}/{75} (cube faces, hero hover frames) are accepted.
    qualities: [40, 75, 80],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
