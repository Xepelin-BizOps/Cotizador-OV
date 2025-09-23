"use client";
import {
  createContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import type { ResAuthMe } from "../(sections)/auth/_fetures/action";

// Crear un tipo y tenerlo por ahí
const initialValues: ResAuthMe = {
  id: 0,
  companyId: 0,
  email: "",
  currency: {
    id: 0,
    value: "",
  },
};

interface MyContextType {
  value: ResAuthMe;
  setValue: React.Dispatch<React.SetStateAction<ResAuthMe>>;
}

export const AuthContext = createContext<MyContextType | undefined>(undefined);

export default function AuthContextProvider({ children }: PropsWithChildren) {
  // Cargar datos del sessionStorage al iniciar/recargar page
  const [value, setValue] = useState<ResAuthMe>(() => {
    const stored =
      typeof window !== "undefined" && sessionStorage.getItem("authUser");
    return stored ? JSON.parse(stored) : initialValues;
  });

  // Cargar datos actualizados de la API al inicializar
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        console.log("🔍 AuthContext: Loading auth data from API...");
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (data.success && data.user) {
          console.log("🔍 AuthContext: API response:", data);
          setValue(prev => ({
            ...prev,
            isLoggedIn: true,
            user: data.user,
            companyId: data.user.companyId || 0,
            id: data.user.id || 0,
            email: data.user.email || "",
            currency: data.user.currency || { id: 0, value: "" },
            company: data.user.company || null,
          }));
        }
      } catch (error) {
        console.error("🔍 AuthContext: Error loading auth data:", error);
        // Si hay error, intentar corregir companyId desde cookies
        if (value.companyId === 0) {
          const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return null;
          };
          
          const cookieCompanyId = getCookie('companyId');
          const companyId = cookieCompanyId ? parseInt(cookieCompanyId, 10) : 4;
          
          console.log("🔧 AuthContext: Corrigiendo companyId de 0 a", companyId);
          setValue(prev => ({ ...prev, companyId }));
        }
      }
    };

    loadAuthData();
  }, []); // Solo ejecutar una vez al montar

  // Guardar en sessionStorage cada vez que cambia
  useEffect(() => {
    if (value.id) sessionStorage.setItem("authUser", JSON.stringify(value));
  }, [value]);

  return (
    <AuthContext.Provider value={{ value, setValue }}>
      {children}
    </AuthContext.Provider>
  );
}
