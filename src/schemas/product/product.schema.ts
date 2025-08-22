import { ProductType } from "@prisma/client";
import { z } from "zod"

// schema CREATE
export const productSchema = z.object({
    sku: z.string().min(1, "El SKU es obligatorio"),
    name: z.string().min(1, "El nombre es obligatorio"),
    price: z.number().refine((val) => !isNaN(Number(val)), {
        message: "Debe ser un número válido",
    }),
    currencyId: z.string().min(1, "Seleccioná una moneda"),
    categoryId: z.string().min(1, "Seleccioná una categoría"),
    companyId: z.number().min(1, "Requerido"),
    shortDescription: z.string().min(1, "Requerido"),
    longDescription: z.string().optional(),
    type: z.enum([ProductType.PRODUCT, ProductType.SERVICE]),
})

// schema EDIT
export const editProductSchema = productSchema.extend({
    id: z.number().optional(),
});