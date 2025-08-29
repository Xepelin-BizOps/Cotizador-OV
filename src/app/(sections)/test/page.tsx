"use client";
import { useEffect, useState } from "react";
import { testDB } from "./action";

interface Res {
  message: string;
  data: number | null;
  success: boolean;
}

export default function Page() {
  const [response, setResponse] = useState<Res | null>(null);

  useEffect(() => {
    (async () => {
      const res = await testDB();

      setResponse(res);
    })();
  }, []);

  return (
    <>
      <div className="flex flex-col justify-center items-center mt-5">
        <h1 className="font-semibold">
          DB: {JSON.stringify(response?.success)} - {response?.message}
        </h1>
        <p>
          Empresas en la base: <strong>{response?.data}</strong>
        </p>
      </div>
    </>
  );
}
