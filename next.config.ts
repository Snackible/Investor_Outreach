import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The hub reads private sheets and the hashmap on every request; never prerender it.
  poweredByHeader: false,
  serverExternalPackages: ["mongodb"],
};

export default nextConfig;
