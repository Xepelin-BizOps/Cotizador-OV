import { EditQuoteDto } from "@/schemas/quote/quote.dto";
import { PlainQuotesWithRelations } from "./quote-types";



export const mapQuoteListToFormValues = (quote: PlainQuotesWithRelations): EditQuoteDto => ({
    id: quote.id,
    companyId: quote.companyId,
    clientId: quote.clientId,
    quotationDate: quote.quotationDate,
    quotationValidity: undefined,
    quotationIdentifier: "",
    quotationType: "WITHOUT_IVA",
    currencyId: 1,
    taxRate: 0,
    serviceDescription: "",
    termsOfPayment: "",
    valGuarantees: "",
    paymentMethods: "",
    exclusions: "",
    additionalInfo: "",
    tyc: "",
    status: quote.status as "DRAFT" | "SENT" | "REJECTED" | "CONFIRMED" | "PARTIAL_PAYMENT" | "PAID",
    items: quote.items.map(item => ({
        productName: item.productName,
        productId: item.productId,
        sku: (item as { sku?: string }).sku || "",
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
    })),
    totalAmount: Number(quote.totalAmount),
    note: quote.note || ""
});