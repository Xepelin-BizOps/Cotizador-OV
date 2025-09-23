"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "./useAuthContext";

export interface CompanyCountryInfo {
  country: string;
  taxRate: number;
  supportsUF: boolean;
}

export function useCompanyCountry(): {
  countryInfo: CompanyCountryInfo | null;
  loading: boolean;
  error: string | null;
} {
  const [countryInfo, setCountryInfo] = useState<CompanyCountryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authContext = useAuthContext();

  useEffect(() => {
    const processCompanyCountry = () => {
      const company = authContext.value.company as { country?: string } | null;
      
      if (!company) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("🔍 Debug useCompanyCountry:", {
          companyId: authContext.value.companyId,
          company: company
        });
        
        const country = company.country || "MEXICO";
        console.log("🌍 Country detected from auth context:", country);
        
        // Definir impuestos por país
        const taxRates: Record<string, number> = {
          MEXICO: 0.16, // 16%
          CHILE: 0.19,  // 19%
        };

        const countryInfo: CompanyCountryInfo = {
          country,
          taxRate: taxRates[country] || 0,
          supportsUF: country === "CHILE",
        };

        setCountryInfo(countryInfo);
      } catch (err) {
        setError("Error al procesar la información de la empresa");
        console.error("Error processing company country:", err);
      } finally {
        setLoading(false);
      }
    };

    processCompanyCountry();
  }, [authContext.value.company, authContext.value.companyId]);

  return { countryInfo, loading, error };
}
