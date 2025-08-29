"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import type { EditCompanyDto } from "@/schemas/company/company.dto";

/** Lee companyId de cookie (server-side). */
async function readCompanyIdFromCookie(): Promise<number | null> {
  const c = await cookies();
  const raw = c.get("companyId")?.value;
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

/** Normaliza / valida un id numérico. */
function normalizeId(id: unknown): number | null {
  if (typeof id === "number" && Number.isFinite(id) && id > 0) return id;
  if (typeof id === "string" && /^\d+$/.test(id)) return Number(id);
  return null;
}

/**
 * Obtiene la empresa por ID devolviendo exactamente
 * los campos que consume el formulario.
 */
export async function getCompanyById(companyId?: number) {
  const fromParam = normalizeId(companyId as unknown);
  const id = fromParam ?? (await readCompanyIdFromCookie());

  if (!id) {
    return { success: false, message: "companyId inválido" };
  }

  const company = await prisma.company.findUnique({
    where: { id },
    select: {
      companyName: true,
      address: true,
      rfc: true,
      email: true,
      phone: true,
    },
  });

  if (!company) {
    return { success: false, message: "Empresa no encontrada" };
  }

  return {
    success: true,
    data: {
      companyName: company.companyName ?? "",
      address: company.address ?? "",
      rfc: company.rfc ?? "",
      email: company.email ?? "",
      phone: company.phone ?? "",
    },
    message: "OK",
  };
}

/**
 * Actualiza la empresa con los mismos campos del formulario.
 */
export async function editCompany(data: EditCompanyDto, companyId?: number) {
  const fromParam = normalizeId(companyId as unknown);
  const id = fromParam ?? (await readCompanyIdFromCookie());

  if (!id) {
    return { success: false, message: "companyId inválido" };
  }

  await prisma.company.update({
    where: { id },
    data: {
      companyName: data.companyName ?? null,
      address: data.address ?? null,
      rfc: data.rfc ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
    },
  });

  return { success: true, message: "Datos de empresa actualizados" };
}
