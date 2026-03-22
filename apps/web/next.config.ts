import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "casptone-nonprofit-animal-rescue.e9854bbcc609dd65ea35ce4fbb7b83ad.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "pub-9bda3c8e4200423ca4ec2b9ee4d6d5d3.r2.dev",
      },
      // Facebook CDN — post images served from scontent subdomains
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "**.fbsbx.com",
      },
    ],
  },
};

export default nextConfig;