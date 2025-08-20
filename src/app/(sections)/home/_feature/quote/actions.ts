"use server";
import { TabName } from "@/app/constants/optionsSelects";
import { prisma } from "@/lib/prisma";
import { CreateQuoteDto, EditQuoteDto } from "@/schemas/quote/quote.dto";
import { createQuotationSchema } from "@/schemas/quote/quote.schema";
import { Prisma, QuotationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { ResQuoteList } from "./quote-types";
import { verifyToken } from "@/app/(sections)/auth/_fetures/action";

export async function getQuotesList(
    search?: string,
    page: number = 1,
    pageSize: number = 10,
    status?: QuotationStatus
): Promise<ResQuoteList> {
    try {
        // validar que tenga un token para poder traer los datos
        const user = await verifyToken();

        if (!user) {
            return {
                success: false,
                message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
                data: [],
                total: 0,
            };
        }

        const whereClause: Prisma.QuotationWhereInput = {};

        if (
            status &&
            Object.values(QuotationStatus).includes(status as QuotationStatus)
        ) {
            whereClause.status = status as QuotationStatus;
        }

        if (search?.trim()) {
            whereClause.OR = [
                { client: { is: { rfc: { contains: search, mode: "insensitive" } } } },
                {
                    client: { is: { fullName: { contains: search, mode: "insensitive" } } },
                },
                {
                    company: {
                        is: { companyName: { contains: search, mode: "insensitive" } },
                    },
                },
            ];
        }

        //  Total de cotizaciones coincida con lo que estás filtrando
        const totalQuote = await prisma.quotation.count({
            where: whereClause,
        });

        const quotes = await prisma.quotation.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            where: whereClause,
            include: {
                client: true,
                items: true,
            },
        });

        // Convertí los valores `Decimal` a `number`
        const plainQuotes = quotes.map((quote) => ({
            ...quote,
            totalAmount: quote.totalAmount.toNumber(),
            items: quote.items.map((item) => ({
                ...item,
                totalPrice: item.totalPrice.toNumber(),
                unitPrice: item.unitPrice.toNumber(),
            })),
        }));

        return {
            success: true,
            message: "Cotizaciones obtenidas correctamente",
            data: plainQuotes,
            total: totalQuote,
        };
    } catch (error) {
        console.error("Error al obtener cotizaciones:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error desconocido",
            data: [],
            total: 0,
        };
    }
}

export async function getQuoteById(id: number) {
    try {
        // validar que tenga token para poder traer los datos
        const user = await verifyToken();

        if (!user) {
            return {
                success: false,
                message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
                data: null
            };
        }

        const quotation = await prisma.quotation.findUnique({
            where: { id },
            include: {
                client: true,
                company: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!quotation) {
            return { success: false, message: "Cotización no encontrada", data: null };
        }

        // Convertir Decimals a number
        const plainQuotation = {
            ...quotation,
            totalAmount: quotation.totalAmount.toNumber(),
            items: quotation.items.map((item) => ({
                ...item,
                unitPrice: item.unitPrice.toNumber(),
                totalPrice: item.totalPrice.toNumber(),
            })),
        };

        return { success: true, data: plainQuotation };
    } catch (error) {
        console.error("Error al obtener la cotización:", error);
        return { success: false, message: error instanceof Error ? error.message : "Error al obtener la cotización", data: null };
    }
}



export const createQuote = async (data: CreateQuoteDto) => {
    try {
        // validar que tenga un token para poder traer los datos
        const user = await verifyToken();

        if (!user) {
            return {
                success: false,
                message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
            };
        }

        const parsed = createQuotationSchema.safeParse(data)

        if (!parsed.success) {
            return {
                success: false,
                message: 'Datos inválidos',
                errors: parsed.error.message,
            }
        }

        // Calcular el total de la cotización con todos los productos agregados
        const itemsWithTotal = parsed.data.items.map(item => {
            const totalPrice = item.unitPrice * item.quantity;
            return {
                ...item,
                totalPrice,
            };
        });

        const totalAmount = itemsWithTotal.reduce((acc, item) => acc + item.totalPrice, 0);

        await prisma.quotation.create({
            data: {
                ...parsed.data,
                totalAmount, // Sin el iva
                items: {
                    create: parsed.data.items.map(item => ({
                        productId: item.productId,
                        productName: item.productName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.unitPrice * item.quantity
                    }))
                }
            },
            include: { items: true },
        })

        revalidatePath(`/home?tab=${TabName.quote}`)

        return {
            success: true,
            message: 'Cotización creada correctamente',
            // data: response,
        }
    } catch (error) {
        console.error('Error al crear cotización:', error)
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error interno del servidor',
        }
    }
}

export const editQuote = async (data: EditQuoteDto, quoteId: number) => {
    try {

        // validar que tenga un token para poder traer los datos
        const user = await verifyToken();

        if (!user) {
            return {
                success: false,
                message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
            };
        }

        const existingQuote = await prisma.quotation.findUnique({
            where: { id: quoteId },
            include: { items: true },
        });

        if (!existingQuote) {
            return {
                success: false,
                message: 'Cotización no encontrada',
            };
        }

        // IDs de items enviados en el update (los que se quedan o modifican)
        const updatedItemIds = data.items
            .filter((i) => i.id !== undefined)
            .map((i) => i.id!);

        // IDs de items actuales en DB
        const existingItemIds = existingQuote.items.map((i) => i.id);

        // Items a eliminar: los que están en DB pero no vienen en update
        const itemsToDelete = existingItemIds.filter(
            (id) => !updatedItemIds.includes(id)
        );

        // upserts tenemos que hacer un array distinto para updates y creates
        const itemsUpdate = data.items.filter((item) => item.id !== undefined);
        const itemsCreate = data.items.filter((item) => item.id === undefined);

        // Update de la cotización
        await prisma.quotation.update({
            where: { id: quoteId },
            data: {
                note: data.note,
                status: data.status,
                quotationDate: data.quotationDate,
                clientId: data.clientId,
                companyId: data.companyId,
                totalAmount: data.items.reduce(
                    (acc, i) => acc + i.quantity * i.unitPrice,
                    0
                ),

                items: {
                    deleteMany: itemsToDelete.length > 0 ? { id: { in: itemsToDelete } } : undefined,
                    // Dato:
                    // Prisma no soporta array de upserts directamente en items
                    // Se hacen separados abajo
                },
            },
        });

        // Hacer updates y creates en items separados porque prisma no permite en un solo update
        for (const item of itemsUpdate) {
            await prisma.quotationItem.update({
                where: { id: item.id! },
                data: {
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.quantity * item.unitPrice,
                },
            });
        }

        for (const item of itemsCreate) {
            await prisma.quotationItem.create({
                data: {
                    quotationId: quoteId,
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.quantity * item.unitPrice,
                },
            });
        }

        revalidatePath(`/home?tab=${TabName.quote}`)


        return {
            success: true,
            message: 'Cotización editada correctamente',
        };
    } catch (error) {
        console.error('Error al editar cotización:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error interno del servidor',
        };
    }
};


export const deleteQuote = async (quoteId: number) => {
    try {

        // validar que tenga un token para poder traer los datos
        const user = await verifyToken();

        if (!user) {
            return {
                success: false,
                message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
            };
        }

        // Primero podrías validar que exista
        const existing = await prisma.quotation.findUnique({
            where: { id: quoteId },
        });

        if (!existing) {
            return {
                success: false,
                message: "La cotización no existe",
            };
        }

        await prisma.quotation.delete({
            where: { id: quoteId },
        });

        revalidatePath(`/home?tab=${TabName.quote}`)

        return {
            success: true,
            message: "Cotización eliminada correctamente",
        };
    } catch (error) {
        console.error("Error eliminando cotización:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error interno del servidor",
            error,
        };
    }
};