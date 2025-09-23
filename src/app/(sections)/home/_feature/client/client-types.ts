import { Prisma } from "@prisma/client";

// tipo utilitario de Prisma que te permite obtener automáticamente el tipo ts
export type ClientWithRelations = Prisma.ClientGetPayload<{
    include: {
        addresses: true;
        contacts: true;
    };
}>;

export type ClientsList = ClientWithRelations[];


export interface ResClientList {
    success: boolean | null;
    message: string;
    data: ClientWithRelations[];
    total: number;
}