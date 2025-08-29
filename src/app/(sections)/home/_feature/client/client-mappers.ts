import { AddressType, ClientStatus, ClientType } from "@prisma/client";


export const clientTypeMapper = {
    [ClientType.COMPANY]: 'Empresa',
    [ClientType.PERSON]: 'Persona'
}

export const clientStatusMapper = {
    [ClientStatus.PROSPECT]: 'Prospecto',
    [ClientStatus.ACTIVE]: 'Activo'
}

export const addressTypesMapper = {
    [AddressType.PRIMARY]: 'Principal',
    [AddressType.SHIPPING]: 'Envío',
    [AddressType.FACTURATION]: 'Facturación',
}