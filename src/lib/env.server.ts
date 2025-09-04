import "server-only";

export const isProd = () => process.env.NODE_ENV === "production";

export function getJwtSecret(): string {
  const val = process.env.JWT_SECRET ?? "";
  if (!val && isProd()) {
    console.warn("JWT_SECRET ausente en PROD (ver APP_SECRETS).");
  }
  return val;
}

export function getAllowedOrigins() {
  const raw = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS ?? "";
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const hasStar = list.includes("*");
  const allowAll = isProd() ? false : (hasStar || list.length === 0);
  return { list, allowAll };
}
