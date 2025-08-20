"use client";
import { Alert, Button, Spin } from "antd";
import useLogin from "./_fetures/hooks/useLogin";

export default function Page() {
  // Login - PostMessage
  const { data } = useLogin();

  // En localhost:5173
  const OpenPage = () => {
    window.open("http://localhost:5173", "_blank", "width=600,height=600");
  };

  return (
    <div className="flex-1 flex flex-col items-center">
      <h2 className="m-4 text-2xl text-accent font-bold">Validar la sesión</h2>

      {process.env.NODE_ENV === "development" && (
        <Button onClick={() => OpenPage()}>Abrir pestaña</Button>
      )}

      {data.isLoading && (
        <Spin tip="Validando sesión..." size="large" fullscreen />
      )}

      {data?.error && (
        <Alert
          showIcon
          type="error"
          message={"Error"}
          description={data.message}
        />
      )}
    </div>
  );
}
