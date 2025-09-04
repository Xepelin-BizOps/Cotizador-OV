"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TabName } from "@/app/constants/optionsSelects";
import { verifyToken } from "@/app/(sections)/auth/_fetures/action";

import type { ResClientList } from "./client-types";
import type { CreateClientDto, EditClientDto } from "@/schemas/client/client.dto";
import { clientSchema, editClientSchema } from "@/schemas/client/client.schema";

/**
 * Lista de clientes paginada y filtrada por texto.
 * Siempre restringida por companyId del usuario autenticado.
 */
export async function getClientsList(
  search?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ResClientList> {
  try {
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Inicia sesión nuevamente",
        data: [],
        total: 0,
      };
    }

    const where = {
      companyId: user.companyId,
      OR: search
        ? [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { rfc: { contains: search, mode: "insensitive" as const } },
            { companyName: { contains: search, mode: "insensitive" as const } },
          ]
        : undefined,
    };

    const total = await prisma.client.count({ where });
    const clients = await prisma.client.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where,
      include: {
        addresses: true,
        contacts: true,
      },
      orderBy: { id: "desc" },
    });

    return { success: true, total, data: clients, message: "Clientes obtenidos correctamente" };
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido",
      data: [],
      total: 0,
    };
  }
}

/**
 * Crea un cliente. companyId SIEMPRE viene del contexto (token/cookie),
 * nunca confiamos en lo que venga del formulario.
 */
export const createClient = async (data: CreateClientDto) => {
  try {
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
      };
    }

    const parsed = clientSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.message || "Datos inválidos",
      };
    }

    const dto = parsed.data;

    await prisma.client.create({
      data: {
        companyId: user.companyId,
        type: dto.type,
        status: dto.status,
        companyName: dto.companyName ?? null,
        industry: dto.industry ?? null,
        fullName: dto.fullName ?? null,
        profession: dto.profession ?? null,
        rfc: dto.rfc,
        taxRegime: dto.taxRegime,
        cfdiUse: dto.cfdiUse,
        billingEmail: dto.billingEmail ?? null,
        phone: dto.phone ?? null,
        notes: dto.notes ?? null,
        // relaciones anidadas
        addresses: dto.addresses ? { create: dto.addresses } : undefined,
        contacts: dto.contacts ? { create: dto.contacts } : undefined,
      },
    });

    revalidatePath(`/home?tab=${TabName.client}`);

    return { success: true, message: "Cliente creado correctamente" };
  } catch (error) {
    console.error("Error al crear cliente:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
};

/**
 * Normaliza payload de edición (upsert/creación para relaciones).
 * No usa `any` y no envía campos fuera del esquema.
 */
export async function adaptClientUpdateData(data: EditClientDto) {
  // Quitamos addresses/contacts/id del DTO y nos quedamos con el resto tipado
  const { addresses, contacts, id: _clientId, ...clientData } = data;

  return {
    ...clientData,
    // Si tiene id hace un upsert, si no lo crea
    addresses: addresses
      ? {
          upsert: addresses
            .filter((a) => a.id !== undefined)
            .map(({ id, ...rest }) => ({
              where: { id: id! },
              update: rest,
              create: rest,
            })),
          create: addresses
            .filter((a) => a.id === undefined)
            .map(({ id, ...rest }) => rest),
        }
      : undefined,

    contacts: contacts
      ? {
          upsert: contacts
            .filter((c) => c.id !== undefined)
            .map(({ id, ...rest }) => ({
              where: { id: id! },
              update: rest,
              create: rest,
            })),
          create: contacts
            .filter((c) => c.id === undefined)
            .map(({ id, ...rest }) => rest),
        }
      : undefined,
  };
}

/**
 * Edita cliente por id (restringido al companyId del usuario).
 */
export const editClient = async (dataUpdate: EditClientDto, id: number) => {
  try {
    const user = await verifyToken();
    if (!user?.companyId) {
      return { success: false, message: "No autorizado" };
    }

    const parsed = editClientSchema.safeParse({ ...dataUpdate, id });
    if (!parsed.success) {
      return { success: false, message: parsed.error.message };
    }

    const updateData = await adaptClientUpdateData(parsed.data);

    await prisma.client.update({
      where: { id },
      data: updateData,
      include: {
        addresses: true,
        contacts: true,
      },
    });

    revalidatePath(`/home?tab=${TabName.client}`);
    return { success: true, message: "Cliente editado correctamente" };
  } catch (error) {
    console.error("Error al editar cliente:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
};

/**
 * Elimina cliente por id (restringido por sesión).
 */
export async function deleteClient(id: number) {
  try {
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
      };
    }

    await prisma.client.delete({ where: { id } });

    revalidatePath(`/home?tab=${TabName.client}`);
    return { success: true, message: "Cliente eliminado" };
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo eliminar el cliente",
    };
  }
}
