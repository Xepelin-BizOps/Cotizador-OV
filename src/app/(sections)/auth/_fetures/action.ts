"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "session";
const COMPANY_COOKIE = "companyId";

// ───────────────────────────────────────────────────────────────────────────────
// Export de tipo que usa el AuthContext (compatibilidad con tu import actual)
export type ResAuthMe = {
  // AHORA opcionales para no romper initialValues en authContext.tsx
  isLoggedIn?: boolean;
  user?: unknown | null;

  // Campos auxiliares del flujo
  session?: string;
  companyId?: number;

  // Permite agregar otros campos sin romper tipos en el futuro
  [key: string]: unknown;
};
// ───────────────────────────────────────────────────────────────────────────────

// Convierte base64url a UTF-8
function base64UrlToUtf8(b64url: string): string {
  const b64 =
    b64url.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (b64url.length % 4)) % 4);
  return Buffer.from(b64, "base64").toString("utf8");
}

// Coerce seguro a number (enteros positivos)
function toNumericId(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val) && val >= 0) {
    return Math.floor(val);
  }
  if (typeof val === "string") {
    const s = val.trim();
    if (/^\d+$/.test(s)) return Number(s);
  }
  return null;
}

/**
 * Verifica que exista la cookie de sesión y devuelve { session, companyId:number }.
 * - companyId primero se intenta por cookie "companyId".
 * - Si no existe, se intenta extraer del payload JWT (companyId | company_id | user.companyId).
 * - Si no es un número válido, falla explícitamente (para que Prisma no reciba string).
 */
export async function verifyToken(): Promise<{ session: string; companyId: number }> {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) {
    throw new Error("No autorizado – token no encontrado");
  }
  const session = sessionCookie.value;

  // 1) CompanyId desde cookie
  const companyCookieRaw = cookieStore.get(COMPANY_COOKIE)?.value;
  const fromCookie = toNumericId(companyCookieRaw);
  if (fromCookie !== null) {
    return { session, companyId: fromCookie };
  }

  // 2) Intentar decodificar payload JWT
  let fromJwt: number | null = null;
  const parts = session.split(".");
  if (parts.length >= 2) {
    try {
      const payloadJson = base64UrlToUtf8(parts[1]);
      const payload = JSON.parse(payloadJson) as Record<string, unknown>;

      fromJwt =
        toNumericId(payload["companyId"]) ??
        toNumericId(payload["company_id"]) ??
        toNumericId(
          (payload["user"] as Record<string, unknown> | undefined)?.["companyId"],
        );
    } catch {
      // Si no es JWT o falla, lo ignoramos
    }
  }

  if (fromJwt !== null) {
    return { session, companyId: fromJwt };
  }

  // 3) Sin companyId numérico válido → error explícito
  throw new Error("No autorizado – companyId ausente o inválido");
}
