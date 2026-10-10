import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  agentRules: false,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
