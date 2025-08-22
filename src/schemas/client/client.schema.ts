import { z } from "zod";

// Enums
export const clientTypeEnum = z.enum(["PERSON", "COMPANY"]);
export const clientStatusEnum = z.enum(["PROSPECT", "ACTIVE"]);
export const addressTypeEnum = z.enum(["PRIMARY", "FACTURATION", "SHIPPING"]);

// Contact
export const contactSchema = z.object({
    fullName: z.string().min(1, "Nombre completo requerido"),
    role: z.string().min(1, "Rol requerido"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(1, "Teléfono requerido"),
    whatsapp: z.string().optional(),
});

// Address
export const addressSchema = z.object({
    type: addressTypeEnum,
    street: z.string().min(1, "Calle requerida"),
    city: z.string().min(1, "Ciudad requerida"),
    state: z.string().min(1, "Estado requerido"),
    zip: z.string().min(1, "Código postal requerido"),
});

// Client
export const clientSchema = z.object({
    type: clientTypeEnum,
    status: clientStatusEnum.default("PROSPECT"),

    companyId: z.number(),

    companyName: z.string().optional(),
    industry: z.string().optional(),

    fullName: z.string().optional(),
    profession: z.string().optional(),

    rfc: z.string().min(1, "RFC requerido"),
    taxRegime: z.string().min(1, "Régimen fiscal requerido"),
    cfdiUse: z.string().min(1, "Uso de CFDI requerido"),
    billingEmail: z.string().email("Email de facturación inválido"),
    phone: z.string().optional(),

    notes: z.string().optional(),

    contacts: z.array(contactSchema).max(3, "Máximo 3 contactos").optional(),
    addresses: z.array(addressSchema).max(3, "Máximo 3 direcciones").optional(),
});


// Para editar Client, contacto , address
export const editAddressSchema = addressSchema.extend({
    id: z.number().optional(),
});
export const editContactSchema = contactSchema.extend({
    id: z.number().optional(),
});
export const editClientSchema = clientSchema.extend({
    id: z.number(),
    addresses: z.array(editAddressSchema).optional(),
    contacts: z.array(editContactSchema).optional(),
});