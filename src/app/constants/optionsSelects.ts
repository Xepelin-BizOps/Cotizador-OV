// Importamos Enums que genera prisma aptos para ts, asi hay una unica fuente de la verdad
import { AddressType, ClientType, ClientStatus, ProductType, QuotationStatus } from '@prisma/client';

// Nombre de los tabs keys
export const TabName = {
    product: 'catalogs',
    client: 'clients',
    quote: 'quotes'
}

export const productTypes = [
    { label: 'Producto', value: ProductType.PRODUCT },
    { label: 'Servicio', value: ProductType.SERVICE },
];

// MAPPERS
export const productTypesMap = {
    "PRODUCT": 'Producto',
    "SERVICE": 'Servicio'
}


export const clientOptions = [
    { label: "Persona Física", value: ClientType.PERSON },
    { label: "Empresa", value: ClientType.COMPANY },
];

export const clientStatusOptions = [
    { label: 'Prospecto', value: ClientStatus.PROSPECT },
    { label: 'Activo', value: ClientStatus.ACTIVE },
];

export const addressOptions = [
    { label: 'Principal', value: AddressType.PRIMARY },
    { label: 'Facturación', value: AddressType.FACTURATION },
    { label: 'Envío', value: AddressType.SHIPPING },
];

export const quoteStatusOptions = [
    { label: 'Confirmado', value: QuotationStatus.CONFIRMED },
    { label: 'Borrador', value: QuotationStatus.DRAFT },
    { label: 'Pagado', value: QuotationStatus.PAID },
    { label: 'Pago Parcial', value: QuotationStatus.PARTIAL_PAYMENT },
    { label: 'Rechazada', value: QuotationStatus.REJECTED },
    { label: 'Enviado', value: QuotationStatus.SENT },
];








