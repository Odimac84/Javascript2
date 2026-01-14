import type { NextConfig } from "next";
// Whitelist för varje sida vi vill kunna ladda ner bilder från. just nu tillåter vi alla källor.
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
