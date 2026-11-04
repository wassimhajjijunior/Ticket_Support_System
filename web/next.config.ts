import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const origin = process.env.API_ORIGIN ?? "http://localhost:8080";
    return [{ source: "/api/:path*", destination: `${origin}/:path*` }];
  },
};

export default nextConfig;
