import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  serverExternalPackages: ["@databricks/sql"],
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      }
    ],
  },
};

export default nextConfig;