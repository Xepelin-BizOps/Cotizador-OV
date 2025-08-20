import z from "zod";
import { createQuotationItem, createQuotationSchema, editQuotationItem, editQuotationSchema } from "./quote.schema";

export type CreateQuoteDto = z.infer<typeof createQuotationSchema>;
export type EditQuoteDto = z.infer<typeof editQuotationSchema>;

export type CreateQuoteItemDto = z.infer<typeof createQuotationItem>;
export type EditQuoteItemDto = z.infer<typeof editQuotationItem>;
