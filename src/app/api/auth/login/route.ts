import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ajusta si tu export es distinto

// Fuerza runtime Node para que el logging vaya a STDOUT del contenedor
export const runtime = "nodejs";

const COOKIE_NAME = "session";
const COMPANY_COOKIE = "companyId";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

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

// Columnas "comunes" para el identificador fiscal/negocio
const COMPANY_BI_COLUMNS = ["businessIdentifier", "rfc", "taxId", "tax_id"] as const;

async function resolveCompanyId(params: {
  businessIdentifier?: string;
  userEmail?: string;
}): Promise<number | null> {
  const { businessIdentifier, userEmail } = params;

  // 1) Buscar por businessIdentifier en Company
  if (businessIdentifier && businessIdentifier.trim()) {
    const bi = businessIdentifier.trim();
    for (const col of COMPANY_BI_COLUMNS) {
      try {
        // Columna controlada por nuestra lista blanca (no viene del usuario)
        const rows =
          (await prisma.$queryRawUnsafe<{ id: number }[]>(
            `SELECT id FROM "Company" WHERE "${col}" = $1 LIMIT 1`,
            bi
          )) ?? [];
        if (Array.isArray(rows) && rows.length && typeof rows[0]?.id === "number") {
          return rows[0].id;
        }
      } catch {
        // si la columna no existe en tu esquema, seguimos probando las otras
      }
    }
  }

  // 2) Buscar por email en User → companyId
  if (userEmail && userEmail.trim()) {
    try {
      const rows =
        (await prisma.$queryRawUnsafe<{ id: number }[]>(
          `SELECT "companyId" AS id FROM "User" WHERE "email" = $1 LIMIT 1`,
          userEmail.trim()
        )) ?? [];
      if (Array.isArray(rows) && rows.length && typeof rows[0]?.id === "number") {
        return rows[0].id;
      }
    } catch {
      // si tu tabla/columna tienen otro nombre, esto no romperá el build
    }
  }

  return null;
}

export async function POST(req: Request) {
  let body: unknown = undefined;
  try {
    body = await req.json();
  } catch {}

  const record = (body ?? {}) as Record<string, unknown>;

  // ⬇️ Log 1: payload recibido (usar error para evitar que lo elimine el build)
  console.error("[auth/login] payload:", record);

  // token (opcional)
  const provided =
    typeof record["token"] === "string" ? (record["token"] as string).trim() : "";
  const token = provided || crypto.randomUUID();

  // companyId directo (si viene)
  let companyIdNum =
    toNumericId(record["companyId"]) ??
    toNumericId(record["company_id"]) ??
    toNumericId((record["user"] as Record<string, unknown> | undefined)?.["companyId"]) ??
    null;

  // Resolver companyId si no vino explícito
  if (companyIdNum === null) {
    const businessIdentifier =
      typeof record["businessIdentifier"] === "string"
        ? (record["businessIdentifier"] as string)
        : undefined;

    const userEmail =
      typeof record["userEmail"] === "string"
        ? (record["userEmail"] as string)
        : undefined;

    companyIdNum = await resolveCompanyId({ businessIdentifier, userEmail });
  }

  // ⬇️ Log 2: companyId resuelto (o null si no se pudo)
  console.error("[auth/login] resolved companyId:", companyIdNum);

  // Heurística de cookie para local HTTPS/HTTP
  const url = new URL(req.url);
  const proto = (req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "")).toLowerCase();
  const isHttps = proto === "https";
  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const secure = isHttps && !isLocalhost;          // HTTPS real ⇒ Secure
  const sameSite: "none" | "lax" = secure ? "none" : "lax"; // SameSite=None solo si Secure

  const cookieStore = await cookies();

  // session
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  // companyId (si se pudo resolver)
  if (companyIdNum !== null) {
    cookieStore.set({
      name: COMPANY_COOKIE,
      value: String(companyIdNum),
      httpOnly: true,
      secure,
      sameSite,
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }

  const res = NextResponse.json({ success: true, message: "¡Login exitoso!" });
  res.headers.set("Access-Control-Allow-Credentials", "true");
  return res;
}
