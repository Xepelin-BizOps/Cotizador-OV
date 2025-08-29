import { QuotationStatus } from "@prisma/client";
import { z } from "zod";

// export const QuotationStatusEnum = z.enum(["DRAFT",
//     "SENT",
//     "REJECTED",
//     "CONFIRMED",
//     "PARTIAL_PAYMENT",
//     "PAID",
// ]);

// export interface ProductItem {
//     productId: number;
//     name: string;
//     quantity: number;
//     unitPrice: number;
// }

export const createQuotationItem = z.object({
    productId: z.number().int().positive(),
    productName: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.string().or(z.number())
        .transform(val => Number(val))
        .refine(val => !isNaN(val) && val >= 0, { message: "Debe ser un número válido" }),
    totalPrice: z.string().or(z.number())
        .transform(val => Number(val))
        .refine(val => !isNaN(val), { message: "Debe ser un número válido" })
        .optional(),
});

export const editQuotationItem = createQuotationItem.extend({
    id: z.number().optional(),
});

export const createQuotationSchema = z.object({
    note: z.string().optional(),
    totalAmount: z
        .string()
        .or(z.number())
        .optional()
        .transform(val => (val === undefined ? 0 : Number(val)))
        .refine(val => !isNaN(val), { message: "Debe ser un número válido" }),

    items: z.array(createQuotationItem),

    status: z.enum(QuotationStatus).default(QuotationStatus.DRAFT),
    // z.nativeEnum(QuotationStatus)
    quotationDate: z
        .string()
        .refine(val => !isNaN(Date.parse(val)), { message: "Fecha inválida" })
        .transform(val => new Date(val)),

    companyId: z.number().int().positive(), // relación implícita
    clientId: z.number().int().positive().nullable().optional(), // porque puede ser null
});


export const editQuotationSchema = createQuotationSchema.extend({
    id: z.number().optional(),
    items: z.array(editQuotationItem),
});


