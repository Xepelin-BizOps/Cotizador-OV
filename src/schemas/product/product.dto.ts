
import z from "zod";
import { editProductSchema, productSchema } from "./product.schema";

// Para crear DTO
export type CreateProductDto = z.infer<typeof productSchema>;
export type EditProductDto = z.infer<typeof editProductSchema>;
