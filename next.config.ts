import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
      allowedOrigins: ["rodeio.cristhiansancore.com.br", "localhost:3000", "192.168.18.55:3000"]
    }
  },
  // Ensure development through proxy works
  allowedDevOrigins: ["rodeio.cristhiansancore.com.br", "192.168.18.55", "192.168.18.55:3000"]
};

export default nextConfig;
