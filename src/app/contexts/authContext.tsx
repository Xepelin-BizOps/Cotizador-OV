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
