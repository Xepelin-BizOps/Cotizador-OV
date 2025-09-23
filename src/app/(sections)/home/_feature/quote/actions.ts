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
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
        data: [],
        total: 0,
      };
    }

    const whereClause: Prisma.QuotationWhereInput = {
      companyId: user.companyId,
    };

    if (status && Object.values(QuotationStatus).includes(status)) {
      whereClause.status = status;
    }

    if (search?.trim()) {
      whereClause.OR = [
        { client: { is: { rfc: { contains: search, mode: "insensitive" } } } },
        { client: { is: { fullName: { contains: search, mode: "insensitive" } } } },
        { company: { is: { companyName: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const totalQuote = await prisma.quotation.count({ where: whereClause });

    const quotes = await prisma.quotation.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: whereClause,
      orderBy: { id: "desc" },
      select: {
        id: true,
        companyId: true,
        clientId: true,
        note: true,
        totalAmount: true,
        status: true,
        quotationDate: true,
        pdfS3Key: true,
        createdAt: true,
        updatedAt: true,
        client: true,
        items: true,
      },
    });

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
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
        data: null,
      };
    }

    const quotation = await prisma.quotation.findFirst({
      where: { id, companyId: user.companyId },
      select: {
        id: true,
        companyId: true,
        clientId: true,
        note: true,
        totalAmount: true,
        status: true,
        quotationDate: true,
        currencyId: true,
        quotationIdentifier: true,
        quotationType: true,
        quotationValidity: true,
        taxRate: true,
        ufValue: true,
        additionalInfo: true,
        exclusions: true,
        pdfS3Key: true,
        createdAt: true,
        updatedAt: true,
        client: true,
        company: true,
        items: { include: { product: true } },
      },
    });

    if (!quotation) {
      return { success: false, message: "Cotización no encontrada", data: null };
    }

    const plainQuotation = {
      ...quotation,
      totalAmount: quotation.totalAmount.toNumber(),
      taxRate: quotation.taxRate?.toNumber() ?? null,
      ufValue: quotation.ufValue?.toNumber() ?? null,
      items: quotation.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
        totalPrice: item.totalPrice.toNumber(),
        product: {
          ...item.product,
          price: item.product.price.toNumber(),
        },
      })),
    };

    return { success: true, data: plainQuotation };
  } catch (error) {
    console.error("Error al obtener la cotización:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al obtener la cotización",
      data: null,
    };
  }
}

export const createQuote = async (data: CreateQuoteDto) => {
  try {
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
      };
    }

    // Forzar companyId desde sesión ANTES de validar
    const payload: CreateQuoteDto = { ...data, companyId: user.companyId };

    const parsed = createQuotationSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        message: "Datos inválidos",
        errors: parsed.error.message,
      };
    }

    // Normalizar quotationDate a Date sin usar `any`
    const rawDate = (parsed.data as { quotationDate: unknown }).quotationDate;
    const quotationDate: Date =
      rawDate instanceof Date ? rawDate : new Date(String(rawDate));

    // Calcular totales
    const itemsWithTotal = parsed.data.items.map((item) => ({
      ...item,
      totalPrice: item.unitPrice * item.quantity,
    }));
    const totalAmount = itemsWithTotal.reduce((acc, item) => acc + item.totalPrice, 0);

    await prisma.quotation.create({
      data: {
        companyId: user.companyId,
        clientId: parsed.data.clientId,
        status: parsed.data.status,
        note: parsed.data.note ?? null,
        quotationDate,
        totalAmount,
        currencyId: parsed.data.currencyId ?? null,
        quotationIdentifier: parsed.data.quotationIdentifier ?? null,
        quotationType: (parsed.data.quotationType as "WITH_IVA" | "WITHOUT_IVA") ?? "WITHOUT_IVA",
        quotationValidity: parsed.data.quotationValidity ? new Date(parsed.data.quotationValidity) : null,
        taxRate: parsed.data.taxRate ?? null,
        ufValue: parsed.data.ufValue ?? null,
        additionalInfo: parsed.data.additionalInfo ?? null,
        exclusions: parsed.data.exclusions ?? null,
        items: {
          create: parsed.data.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    revalidatePath(`/home?tab=${TabName.quote}`);
    revalidatePath(`/home/quotes/create`);
    revalidatePath(`/home/quotes/edit`);
    return { success: true, message: "Cotización creada correctamente" };
  } catch (error) {
    console.error("Error al crear cotización:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
};

export const editQuote = async (data: EditQuoteDto, quoteId: number) => {
  try {
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
      };
    }

    const existingQuote = await prisma.quotation.findFirst({
      where: { id: quoteId, companyId: user.companyId },
      include: { items: true },
    });
    if (!existingQuote) {
      return { success: false, message: "Cotización no encontrada" };
    }

    // Forzar companyId
    const payload: EditQuoteDto = { ...data, companyId: user.companyId };

    // Normalizar fecha sin `any`
    const normalizedDate =
      payload.quotationDate instanceof Date
        ? payload.quotationDate
        : new Date(String(payload.quotationDate));

    const updatedItemIds = payload.items.filter((i) => i.id !== undefined).map((i) => i.id!);
    const existingItemIds = existingQuote.items.map((i) => i.id);
    const itemsToDelete = existingItemIds.filter((id) => !updatedItemIds.includes(id));

    await prisma.quotation.update({
      where: { id: quoteId },
      data: {
        note: payload.note,
        status: payload.status,
        quotationDate: normalizedDate,
        clientId: payload.clientId,
        companyId: user.companyId,
        totalAmount: payload.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0),
        currencyId: payload.currencyId ?? null,
        quotationIdentifier: payload.quotationIdentifier ?? null,
              quotationType: (payload.quotationType as "WITH_IVA" | "WITHOUT_IVA") ?? "WITHOUT_IVA",
        quotationValidity: payload.quotationValidity ? new Date(payload.quotationValidity) : null,
        taxRate: payload.taxRate ?? null,
        ufValue: payload.ufValue ?? null,
        additionalInfo: payload.additionalInfo ?? null,
        exclusions: payload.exclusions ?? null,
        items: {
          deleteMany: itemsToDelete.length > 0 ? { id: { in: itemsToDelete } } : undefined,
        },
      },
    });

    for (const item of payload.items.filter((i) => i.id !== undefined)) {
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

    for (const item of payload.items.filter((i) => i.id === undefined)) {
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

    revalidatePath(`/home?tab=${TabName.quote}`);
    revalidatePath(`/home/quotes/create`);
    revalidatePath(`/home/quotes/edit`);
    return { success: true, message: "Cotización editada correctamente" };
  } catch (error) {
    console.error("Error al editar cotización:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
};

export const updateQuotePdfKey = async (quoteId: number, pdfS3Key: string) => {
  try {
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
      };
    }

    const existing = await prisma.quotation.findFirst({
      where: { id: quoteId, companyId: user.companyId },
    });
    if (!existing) {
      return { success: false, message: "La cotización no existe" };
    }

    await prisma.quotation.update({
      where: { id: quoteId },
      data: { pdfS3Key },
    });

    revalidatePath(`/home?tab=${TabName.quote}`);
    revalidatePath(`/home/quotes/create`);
    revalidatePath(`/home/quotes/edit`);
    return { success: true, message: "PDF guardado correctamente" };
  } catch (error) {
    console.error("Error actualizando PDF:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
};

export const deleteQuote = async (quoteId: number) => {
  try {
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
      };
    }

    const existing = await prisma.quotation.findFirst({
      where: { id: quoteId, companyId: user.companyId },
    });
    if (!existing) {
      return { success: false, message: "La cotización no existe" };
    }

    await prisma.quotation.delete({ where: { id: quoteId } });

    revalidatePath(`/home?tab=${TabName.quote}`);
    revalidatePath(`/home/quotes/create`);
    revalidatePath(`/home/quotes/edit`);
    return { success: true, message: "Cotización eliminada correctamente" };
  } catch (error) {
    console.error("Error eliminando cotización:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
};

export const updateQuoteStatus = async (quoteId: number, status: QuotationStatus) => {
  try {
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
      };
    }

    const existing = await prisma.quotation.findFirst({
      where: { id: quoteId, companyId: user.companyId },
    });
    if (!existing) {
      return { success: false, message: "La cotización no existe" };
    }

    await prisma.quotation.update({
      where: { id: quoteId },
      data: { status },
    });

    revalidatePath(`/home?tab=${TabName.quote}`);
    return { success: true, message: `Estado actualizado a ${status}` };
  } catch (error) {
    console.error("Error actualizando estado:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
};

export const registerPayment = async (
  quoteId: number,
  amount: number,
  paymentMethod: string,
  paymentDate: Date,
  notes?: string
) => {
  try {
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
      };
    }

    const quotation = await prisma.quotation.findFirst({
      where: { id: quoteId, companyId: user.companyId },
      include: { payments: true },
    });
    if (!quotation) {
      return { success: false, message: "La cotización no existe" };
    }

    // Calcular el total pagado sumando todos los pagos existentes
    const currentTotalPaid = quotation.payments.reduce((sum, payment) => sum + payment.amount.toNumber(), 0);
    const newTotalPaid = currentTotalPaid + amount;
    const totalAmount = quotation.totalAmount.toNumber();

    if (newTotalPaid > totalAmount) {
      return {
        success: false,
        message: `El pago excede el monto total. Monto restante: $${(totalAmount - currentTotalPaid).toFixed(2)}`,
      };
    }

    // Crear el pago y actualizar el estado en una transacción
    await prisma.$transaction(async (tx) => {
      // Crear el registro de pago
      await tx.payment.create({
        data: {
          quotationId: quoteId,
          amount,
          paymentMethod,
          paymentDate,
          notes,
        },
      });

      // Actualizar el estado de la cotización
      const newStatus = newTotalPaid === totalAmount ? QuotationStatus.PAID : QuotationStatus.PARTIAL_PAYMENT;
      
      await tx.quotation.update({
        where: { id: quoteId },
        data: {
          status: newStatus,
        },
      });
    });

    revalidatePath(`/home?tab=${TabName.quote}`);
    return { success: true, message: "Pago registrado correctamente" };
  } catch (error) {
    console.error("Error registrando pago:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
};

export const checkQuoteHasPayments = async (quoteId: number) => {
  try {
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
        hasPayments: false,
      };
    }

    const paymentCount = await prisma.payment.count({
      where: {
        quotationId: quoteId,
        quotation: {
          companyId: user.companyId,
        },
      },
    });

    return {
      success: true,
      hasPayments: paymentCount > 0,
      message: paymentCount > 0 ? "La cotización tiene pagos registrados" : "La cotización no tiene pagos",
    };
  } catch (error) {
    console.error("Error verificando pagos:", error);
    return {
      success: false,
      hasPayments: false,
      message: error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
};

export const getQuotePayments = async (quoteId: number) => {
  try {
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
        data: [],
        totalPaid: 0,
      };
    }

    const payments = await prisma.payment.findMany({
      where: {
        quotationId: quoteId,
        quotation: {
          companyId: user.companyId,
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount.toNumber(), 0);

    return {
      success: true,
      data: payments,
      totalPaid,
      message: "Pagos obtenidos correctamente",
    };
  } catch (error) {
    console.error("Error obteniendo pagos:", error);
    return {
      success: false,
      data: [],
      totalPaid: 0,
      message: error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
};

/**
 * Genera un PDF de la cotización y lo sube a S3
 */
export async function generateQuotePdf(quoteId: number) {
  try {
    const response = await fetch('/api/generate-quote-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quoteId }),
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        message: result.message || "Error al generar PDF",
      };
    }

    // Actualizar la cotización con la clave del PDF
    await prisma.quotation.update({
      where: { id: quoteId },
      data: { pdfS3Key: result.pdfKey },
    });

    return {
      success: true,
      pdfKey: result.pdfKey,
      pdfUrl: result.pdfUrl,
      message: "PDF generado correctamente",
    };
  } catch (error) {
    console.error("Error generating quote PDF:", error);
    return {
      success: false,
      message: "Error al generar el PDF de la cotización",
    };
  }
}