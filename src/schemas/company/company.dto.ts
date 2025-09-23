import z from "zod";
import { createCompanySchema, editComapanySchema } from "./company.schema";


export type CreateCompanyDto = z.infer<typeof createCompanySchema>;
export type EditCompanyDto = z.infer<typeof editComapanySchema>;