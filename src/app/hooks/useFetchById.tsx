"use client";
import { useEffect, useState } from "react";

interface UseFetchByIdResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetchById<T>(
  id: number | string | null | undefined,
  fetchFunction: (id: number) => Promise<{ success: boolean; data?: T; message?: string }>
): UseFetchByIdResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchFunction(Number(id));
        
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.message || "Error al cargar los datos");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, fetchFunction]);

  return { data, loading, error };
}
