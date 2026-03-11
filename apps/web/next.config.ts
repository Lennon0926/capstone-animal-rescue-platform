import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
    ],
  },
};

export default nextConfig;