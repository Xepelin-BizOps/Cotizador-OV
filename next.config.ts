import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Usa la var si viene del entorno; si no, en development queda "true" y en otros "false".
    FEATURE_NUEVA_COTIZACION:
      process.env.FEATURE_NUEVA_COTIZACION ??
      (process.env.NODE_ENV === "development" ? "true" : "false"),
  },
};

export default nextConfig;
