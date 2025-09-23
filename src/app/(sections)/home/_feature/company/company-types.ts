export interface CompanyData {
    companyName: string;
    address: string;
    rfc: string;
    email: string;
    phone: string;
    logoBase64: string;
    country?: string;
}

export type companyById = CompanyData;

export interface ResponseDetails {
    success: boolean;
    data: companyById | null;
    message: string;
}