import { Prisma } from "@prisma/client";

// tipo utilitario de Prisma que te permite obtener automáticamente el tipo ts
export type ProductWithRelations = Prisma.ProductGetPayload<{
    include: {
        currency: true;
        category: true;
    };
}>;

// Nuevo tipo para frontend, donde pasamos Decimal a number
export type PlainProductWithRelations = Omit<ProductWithRelations, 'price'> & {
    price: number;
};


export interface ResProductList {
    success: boolean | null;
    message: string;
    data: PlainProductWithRelations[];
    total: number;
}

export interface ResponseProducts {
    success: boolean;
    message: string;
    body: Body;
}

export interface ResponseCategories {
    id: number;
    name: string;
    description: string;
}
