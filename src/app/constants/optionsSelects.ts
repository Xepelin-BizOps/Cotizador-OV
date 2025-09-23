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

// Mapeo de tipos de dirección
export const addressMap = {
    [AddressType.PRIMARY]: 'Dirección Principal',
    [AddressType.FACTURATION]: 'Dirección de Facturación',
    [AddressType.SHIPPING]: 'Dirección de Envío',
};

// Opciones de tipo de cotización
export const quotationTypeOptions = [
    { label: 'Sin IVA', value: 'WITHOUT_IVA' },
    { label: 'Con IVA', value: 'WITH_IVA' },
    { label: 'UF', value: 'UF' },
];

// Mapeo de etiquetas de tipo de cotización
export const quotationTypeMapLabels = {
    'WITHOUT_IVA': 'Sin IVA',
    'WITH_IVA': 'IVA',
    'UF': 'UF',
};

// Tasas de impuestos por tipo de cotización
export const quotationTypeTaxRate = {
    'WITHOUT_IVA': 0,
    'WITH_IVA': 19,
    'UF': 0,
};








