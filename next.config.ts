import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    FEATURE_NUEVA_COTIZACION:
      process.env.FEATURE_NUEVA_COTIZACION ??
      (process.env.NODE_ENV === "development" ? "true" : "false"),
  },
};

export default nextConfig;
