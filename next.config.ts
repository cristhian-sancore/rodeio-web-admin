import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: ["rodeio.cristhiansancore.com.br", "localhost:3000"]
    }
  },
  // Ensure development through proxy works
  allowedDevOrigins: ["rodeio.cristhiansancore.com.br"]
};

export default nextConfig;
