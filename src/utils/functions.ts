import { CreateQuoteItemDto, EditQuoteItemDto } from "@/schemas/quote/quote.dto";

export function calculateIVA(subtotal: number, currency: "MXN" | "CLP"): string {
    const ivaRates: Record<string, number> = {
        MXN: 0.16,
        CLP: 0.19,
    };

    const rate = ivaRates[currency];

    if (!rate) {
        return `$${subtotal}`
    }

    const iva = +(subtotal * rate).toFixed(2);
    const total = +(subtotal + iva).toFixed(2);

    return `$${total}`;
}

type QuoteItemStateType = CreateQuoteItemDto | EditQuoteItemDto;


export function calculateTotals(items: QuoteItemStateType[], iva: number) {
    const subtotal = items.reduce(
        (acc, item) => acc + item.quantity * item.unitPrice,
        0
    );

    const ivaAmount = subtotal * (iva / 100);
    const total = subtotal + ivaAmount;

    return {
        subtotal,
        ivaAmount,
        total,
    };
}