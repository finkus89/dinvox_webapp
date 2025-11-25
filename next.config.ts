import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ⚡ Necesario para que las server actions puedan establecer cookies correctamente
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
