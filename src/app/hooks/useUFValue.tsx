"use client";

import { useEffect, useState } from "react";

export interface UFValue {
  valor: number;
  fecha: string;
}

export function useUFValue(): {
  ufValue: UFValue | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [ufValue, setUfValue] = useState<UFValue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUFValue = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/uf-value');
      const result = await response.json();

      if (result.success) {
        setUfValue(result.data);
      } else {
        setError(result.message || "Error al obtener el valor de la UF");
      }
    } catch (err) {
      setError("Error de conexión al obtener el valor de la UF");
      console.error("Error fetching UF value:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchUFValue();
  };

  useEffect(() => {
    // No cargar automáticamente, solo cuando se necesite
  }, []);

  return { ufValue, loading, error, refetch };
}
