"use server"
import { prisma } from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";
import { config } from "@/lib/config";

const JWT_SECRET = config.JWT_SECRET;

export const login = async (businessIdentifier: string, userEmail: string) => {
  // Buscar empresa con usuarios
  const company = await prisma.company.findUnique({
    where: { businessIdentifier },
    include: { users: true, currency: true },
  });

  if (!company) {
    return { error: true, message: "No existe esta compañía" };
  }

  const user = company.users.find((u) => u.email === userEmail);
  if (!user) {
    return { error: true, message: "Usuario no registrado en esta compañía" };
  }

  // Crear payload JWT
  const payload = {
    sub: user.id,
    userEmail: user.email,
    companyId: company.id,
    currency: company.currency,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

  // ✅ Secure sólo si NO es localhost (headers() es async en tu build)
  const hdrs = await headers();
  const host = hdrs.get("host") || "";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const secureCookie = process.env.NODE_ENV === "production" && !isLocalhost;

  // Guardar cookie HTTP-only
  const cookieStore = await cookies();
  cookieStore.set({
    name: "access_token",
    value: token,
    httpOnly: true,
    path: "/",
    maxAge: 3600 * 2,
    sameSite: "lax",
    secure: secureCookie,
  });

  // Log útil
  console.log("[login] cookie set", {
    host,
    nodeEnv: process.env.NODE_ENV,
    secure: secureCookie,
  });

  return { error: false, message: "¡Login exitoso!" };
};

export interface PayloadData {
  sub: number;
  userEmail: string;
  companyId: number;
  currency: { id: number; value: string };
}

export interface ResAuthMe {
  id: number;
  email: string;
  companyId: number;
  currency: { id: number; value: string };
}

export interface ResVerify extends PayloadData {
  iat: number;
  exp: number;
}

export async function verifyToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) {
    throw new Error("No autorizado - token no encontrado. Válida tu sesión nuevamente");
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as ResVerify;
    return decoded;
  } catch {
    throw new Error("No autorizado - token inválido");
  }
}

export async function authMe() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { success: false, message: "No autorizado - token no encontrado", data: null };
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as PayloadData;
    return {
      success: true,
      message: "Datos obtenidos",
      data: {
        id: payload.sub,
        email: payload.userEmail,
        companyId: payload.companyId,
        currency: payload.currency,
      },
    };
  } catch {
    return { success: false, message: "No autorizado - token inválido", data: null };
  }
}
