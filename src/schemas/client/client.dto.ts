import z from "zod";
import {
    clientSchema,
    contactSchema,
    addressSchema,
    editClientSchema,
    editContactSchema,
    editAddressSchema,
} from "./client.schema";

// Para crear DTO
export type CreateClientDto = z.infer<typeof clientSchema>;
export type ContactDto = z.infer<typeof contactSchema>;
export type AddressDto = z.infer<typeof addressSchema>;

// Editar DTO
export type EditClientDto = z.infer<typeof editClientSchema>;
export type EditContactDto = z.infer<typeof editContactSchema>;
export type EditAddressDto = z.infer<typeof editAddressSchema>;
