import { Prisma } from "@prisma/client";

export type QuotesWithRelations = Prisma.QuotationGetPayload<{
    include: {
        client: true;
        items: true
    };
}>;

// Nuevo tipo para frontend, donde pasamos Decimal a number
export type PlainQuotationItem = Omit<QuotesWithRelations['items'][number], 'unitPrice' | 'totalPrice'> & {
    unitPrice: number;
    totalPrice: number;
};

export type PlainQuotesWithRelations = {
    id: number;
    companyId: number;
    clientId: number | null;
    note: string | null;
    totalAmount: number;
    status: string;
    quotationDate: Date;
    pdfS3Key: string | null;
    createdAt: Date;
    updatedAt: Date;
    client: {
        id: number;
        companyId: number;
        type: string;
        status: string;
        companyName: string | null;
        industry: string | null;
        fullName: string | null;
        profession: string | null;
        rfc: string;
        taxRegime: string;
        cfdiUse: string;
        billingEmail: string;
        phone: string | null;
        notes: string | null;
    } | null;
    items: PlainQuotationItem[];
};


export interface ResQuoteList {
    success: boolean | null;
    message: string;
    data: PlainQuotesWithRelations[];
    total: number;
}


export type QuotesDetails = Prisma.QuotationGetPayload<{
    include: {
        company: true;
        client: true;
        items: {
            include: {
                product: true
            }
        }
    };
}>;

// V: plana para frontend
// export type PlainQuotesDetails = Omit<
//     QuotesDetails,
//     'totalAmount' | 'items' | 'createdAt' | 'updatedAt'
// > & {
//     totalAmount: number;
//     createdAt: string;
//     updatedAt: string;
//     items: (Omit<
//         QuotesDetails['items'][number],
//         'unitPrice' | 'totalPrice' | 'product'
//     > & {
//         unitPrice: number;
//         totalPrice: number;
//         product: Omit<QuotesDetails['items'][number]['product'], 'price'> & {
//             price: number;
//         };
//     })[];
// };

export type PlainQuotesDetails = {
    id: number;
    companyId: number;
    clientId: number | null;
    note: string | null;
    totalAmount: number;
    status: string;
    quotationDate: Date;
    pdfS3Key: string | null;
    createdAt: Date;
    updatedAt: Date;
    company: {
        id: number;
        businessIdentifier: string;
        country: string;
        currencyId: number;
        companyName: string;
        address: string | null;
        rfc: string | null;
        email: string;
        phone: string | null;
        logoBase64: string | null; // Contiene la URL de S3
        createdAt: Date;
        updatedAt: Date;
    };
    client: {
        id: number;
        companyId: number;
        type: string;
        status: string;
        companyName: string | null;
        industry: string | null;
        fullName: string | null;
        profession: string | null;
        rfc: string;
        taxRegime: string;
        cfdiUse: string;
        billingEmail: string;
        phone: string | null;
        notes: string | null;
    } | null;
    items: {
        id: number;
        productId: number;
        productName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        quotationId: number;
        product: {
            id: number;
            name: string;
            currencyId: number;
            companyId: number;
            type: string;
            sku: string;
            price: number;
            shortDescription: string;
            longDescription: string | null;
            categoryId: number;
        };
    }[];
};

export interface ResponseDetails {
    success: boolean;
    data: PlainQuotesDetails;
    message: string;
}

