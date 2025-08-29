import { Country } from "@prisma/client";
import z from "zod";

export const createCompanySchema = z.object({
    businessIdentifier: z.string().min(1, "Identificador requerido"),
    country: z.enum(Country, { error: "País requerido" }),

    currencyId: z.number({ error: "Moneda requerida" }),

    companyName: z.string().min(1, "Nombre requerido"),
    address: z.string().optional().nullable(),
    rfc: z.string().optional().nullable(),
    email: z.string().email("Email inválido"),
    phone: z.string().optional().nullable(),
    logoUrl: z.string().url("URL inválida").optional().nullable(),
});


export const editComapanySchema = createCompanySchema.extend({
    id: z.number().optional(),
    currencyId: z.number().optional(),
    businessIdentifier: z.string().min(1).optional(),
    country: z.enum(Country, { error: "País requerido" }).optional()
});