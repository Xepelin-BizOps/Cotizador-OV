import type { NextConfig } from "next";

// feature flag for full-screen quote module
const NEXT_PUBLIC_FEATURE_NUEVA_COTIZACION =
  process.env.NEXT_PUBLIC_FEATURE_NUEVA_COTIZACION ??
  (process.env.NODE_ENV === "development" ? "true" : "false");

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_FEATURE_NUEVA_COTIZACION,
  },
};

export default nextConfig;
