"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/app/hooks/useAuthContext";
import { authMe, login } from "../action";

type Currency = { id: number; value: string };
type UserData = { id: number; email: string; companyId: number; currency: Currency };
type ResAuthMe = { success: boolean; message: string; data: UserData | null };

type AuthMessage = {
  type?: string;
  businessIdentifier?: string;
  userEmail?: string;
};

function isAuthMessage(data: unknown): data is AuthMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    ("businessIdentifier" in data || "userEmail" in data)
  );
}

/** Lee NEXT_PUBLIC_ALLOWED_ORIGINS (CSV). Si incluye "*" o está vacío, permite todo (útil en local). */
function getAllowedOrigins() {
  const raw = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS ?? "";
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const allowAll = list.includes("*") || list.length === 0;
  return { list, allowAll };
}

type HookState = {
  isLoading: boolean;
  data: unknown;
  message: string;
  error: boolean;
};

type UseLoginReturn = HookState & {
  setData: React.Dispatch<React.SetStateAction<HookState>>;
};

export default function useLogin(): UseLoginReturn {
  const router = useRouter();
  const { setValue } = useAuthContext();

  const [data, setData] = useState<HookState>({
    isLoading: false,
    data: null,
    message: "",
    error: false,
  });

  useEffect(() => {
    const { list: allowedOrigins, allowAll } = getAllowedOrigins();

    const handleMessage = async (event: MessageEvent<unknown>) => {
      const authMsg = isAuthMessage(event.data) ? event.data : undefined;

      console.log("[useLogin] postMessage recibido", {
        origin: event.origin,
        allowAll,
        allowedOrigins,
        dataType: typeof event.data,
        hasCreds: !!(authMsg?.businessIdentifier && authMsg?.userEmail),
        type: authMsg?.type,
      });

      // Valida origen
      if (!allowAll && !allowedOrigins.includes(event.origin)) {
        console.warn("[useLogin] postMessage bloqueado por origen NO permitido", {
          origin: event.origin,
          allowedOrigins,
        });
        return;
      }

      // Debe traer businessIdentifier y userEmail
      if (!authMsg?.businessIdentifier || !authMsg?.userEmail) return;

      try {
        setData((s) => ({ ...s, isLoading: true, message: "" }));

        // Llama al server action: esto firma y guarda la cookie httpOnly
        const response= await login(authMsg.businessIdentifier, authMsg.userEmail);
        console.log("[useLogin] login response", response);
        // Obtiene al usuario desde la cookie
        const res: ResAuthMe = await authMe();
        if (!res.success || !res.data) throw new Error("AuthMe sin datos");

        // Contexto de usuario (UserData)
        setValue(res.data);

        // Adentro ✅
        router.push("/home");
      } catch (e) {
        setData((s) => ({
          ...s,
          error: true,
          message: "No se pudo autenticar",
          isLoading: false,
        }));
      } finally {
        setData((s) => ({ ...s, isLoading: false }));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router, setValue]);

  return { ...data, setData };
}
