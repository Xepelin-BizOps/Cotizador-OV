"use server";
import { prisma } from "@/lib/prisma";
import type { CreateClientDto, EditClientDto } from "@/schemas/client/client.dto";
import { clientSchema, editClientSchema } from "@/schemas/client/client.schema";
import { revalidatePath } from "next/cache";
import type { ResClientList } from "./client-types";
import { TabName } from "@/app/constants/optionsSelects";
import { verifyToken } from "@/app/(sections)/auth/_fetures/action";

export async function getClientsList(
    search?: string,
    page: number = 1,
    pageSize: number = 10
): Promise<ResClientList> {
    try {

        // validar que tenga un token para poder traer los datos
        const user = await verifyToken();

        if (!user) {
            return {
                success: false,
                message: "No autorizado - token no encontrado. Inicia sesión nuevamente",
                data: [],
                total: 0,
            };
        }


        const total = await prisma.client.count({
            where: {
                OR: [
                    { fullName: { contains: search, mode: "insensitive" } },
                    { rfc: { contains: search, mode: "insensitive" } },
                ],
            },
        });

        const clients = await prisma.client.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            where: {
                OR: [
                    { fullName: { contains: search, mode: "insensitive" } },
                    { rfc: { contains: search, mode: "insensitive" } },
                ],
            },
            include: {
                addresses: true,
                contacts: true,
            },
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

export const createClient = async (data: CreateClientDto) => {

    try {

        // validar que tenga un token para poder traer los datos
        const user = await verifyToken();

        if (!user) {
            return {
                success: false,
                message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
            };
        }

        const parsed = clientSchema.safeParse(data)


        if (!parsed.success) {
            return {
                success: false,
                message: parsed.error.message || 'Datos inválidos',
            }
        }

        await prisma.client.create({
            data: {
                ...data,
                addresses: data.addresses
                    ? {
                        create: data.addresses,
                    }
                    : undefined,
                contacts: data.contacts
                    ? {
                        create: data.contacts,
                    }
                    : undefined,
                companyId: Number(parsed.data.companyId)
            },
        });

        // Revalidar la ruta que muestra todos los client, asi actuliza la lista
        revalidatePath(`/home?tab=${TabName.client}`)

        return {
            success: true,
            message: 'Cliente creado correctamente',
        }
    } catch (error) {
        // console.error('Error al crear producto:', error)
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error interno del servidor',
        }
    }

};

export async function adaptClientUpdateData(data: EditClientDto) {
    const {
        addresses,
        contacts,
        id: _clientId,
        ...clientData
    } = data;

    return {
        ...clientData,
        // Si tiene id hace un upsert sino lo crea
        addresses: addresses
            ? {
                upsert: addresses
                    .filter((address) => address.id !== undefined)
                    .map(({ id, ...rest }) => ({
                        where: { id },
                        update: rest,
                        create: rest,
                    })),
                create: addresses
                    .filter((address) => address.id === undefined)
                    .map(({ id, ...rest }) => rest),
            }
            : undefined,

        contacts: contacts
            ? {
                upsert: contacts
                    .filter((contact) => contact.id !== undefined)
                    .map(({ id, ...rest }) => ({
                        where: { id },
                        update: rest,
                        create: rest,
                    })),
                create: contacts
                    .filter((contact) => contact.id === undefined)
                    .map(({ id, ...rest }) => rest),
            }
            : undefined,
    };
}



export const editClient = async (dataUpdate: EditClientDto, id: number) => {
    try {

        // validar que tenga un token para poder traer los datos
        await verifyToken();

        const parsed = editClientSchema.safeParse({ ...dataUpdate, id });

        if (!parsed.success) {
            return {
                success: false,
                message: parsed.error.message,
            }
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
        // Revalidar la ruta que muestra los productos, asi actuliza los datos
        revalidatePath(`/home?tab=${TabName.client}`)

        return {
            success: true,
            message: 'Cliente editado correctamente',
        }
    } catch (error) {
        // console.error('Error al crear cleinte:', error)
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error interno del servidor',
        }
    }
};



export async function deleteClient(id: number) {
    try {

        // validar que tenga un token para poder traer los datos
        const user = await verifyToken();

        if (!user) {
            return {
                success: false,
                message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
            };
        }

        await prisma.client.delete({
            where: { id },
        });

        // Revalidar la página donde se muestra la lista
        revalidatePath(`/home?tab=${TabName.client}`);

        return { success: true, message: "Cliente eliminado" };
    } catch (error) {
        console.error("Error al eliminar cliente:", error);
        return { success: false, message: error instanceof Error ? error.message : "No se pudo eliminar el cliente" };
    }
}
