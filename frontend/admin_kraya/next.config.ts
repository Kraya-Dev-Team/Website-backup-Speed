import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "example.com" },
    ],
  },
  serverExternalPackages: ["tailwindcss", "@tailwindcss/postcss", "lightningcss"],
  experimental: {
    // turbopack: { root: ".." } is causing type errors in this version, 
    // and we've removed the workspace requirement.
  },
};

export default nextConfig;
