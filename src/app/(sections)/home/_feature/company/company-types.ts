import { Prisma } from "@prisma/client";

export type companyById = Prisma.CompanyGetPayload<{ include: object }>;


export interface ResponseDetails {
    success: boolean;
    data: companyById | null;
    message: string;
}