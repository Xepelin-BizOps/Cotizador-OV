"use client";
import { TabName } from "@/app/constants/optionsSelects";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authMe, login } from "../action";
import { useAuthContext } from "@/app/hooks/useAuthContext";

export default function useLogin() {
    const router = useRouter();
    const { setValue } = useAuthContext();

    const [data, setData] = useState({
        isLoading: false,
        data: null,
        message: "",
        error: false,
    });

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            // Validar el origen de donde vienen los datos
            if (!process.env.NEXT_PUBLIC_ALLOWED_ORIGINS!.includes(event.origin)) {
                console.warn("Origen no permitido:", event.origin);
                return;
            }

            setData((prev) => ({ ...prev, isLoading: true }));

            const { businessIdentifier, userEmail } = event.data || {};

            if (!businessIdentifier || !userEmail) {
                setData((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: true,
                    message: "Faltan datos",
                }));
                return;
            }

            try {
                const responseLogin = await login(businessIdentifier, userEmail);
                console.log(responseLogin)

                if (!responseLogin.error) {
                    const responseAuthMe = await authMe();
                    // Seteamos los datos del user en el context
                    if (responseAuthMe.success) {
                        setValue(responseAuthMe.data!);
                    }

                    setData((prev) => ({
                        ...prev,
                        error: false,
                        message: "Login exitoso",
                    }));

                    router.replace(`/home?tab=${TabName.quote}`); // Redireccionar si todo fue bien
                } else {
                    setData((prev) => ({
                        ...prev,
                        error: true,
                        message: responseLogin.message,
                    }));
                }
            } catch {
                setData((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: true,
                    message: "Error interno al validar sesión",
                }));
            } finally {
                setData((prev) => ({ ...prev, isLoading: false }));
            }
        };

        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, [router, setValue]);

    return {
        data,
    };
}
