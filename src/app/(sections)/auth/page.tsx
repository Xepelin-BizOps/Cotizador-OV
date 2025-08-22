"use client";

import { Spin } from "antd";
import useLogin from "./_fetures/hooks/useLogin";

export default function AuthPage() {
  const { isLoading, error, message } = useLogin();

  return (
    <>
      {isLoading && <Spin tip="Validando sesión..." size="large" fullscreen />}

      {!isLoading && (error || message) && (
        <div className={`p-4 text-sm ${error ? "text-red-600" : "text-slate-600"}`}>
          {message || (error ? "Ocurrió un error al autenticar." : "")}
        </div>
      )}
    </>
  );
}
