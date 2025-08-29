"use client";
import React, { useState } from "react";
import { ModalCustom } from "@/app/components/ModalCustom";
import useToast from "@/app/hooks/useToast";
import { Button, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import ClientForm from "./ClientForm";
import TableDynamic from "@/app/components/TableDynamic";
import debounce from "lodash.debounce";
import { useSearchParams, useRouter } from "next/navigation";
import useClientColumns from "../hooks/useClientColumns";
import type { ClientsList, ClientWithRelations } from "../client-types";

interface Props {
  data: ClientsList;
  totalItems: number;
}

export default function ClientList({ data, totalItems }: Props) {
  const router = useRouter();
  // Obtengo de los searchParams para pasarle a la table o asigno por defult
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);

  const { showToast, contextHolder } = useToast();

  const [modalState, setModalState] = useState<{
    open: boolean;
    title: string;
    content: React.ReactNode;
  }>({
    open: false,
    title: "",
    content: null,
  });

  const handleOpenModal = (title: string, content: React.ReactNode) => {
    setModalState({
      open: true,
      title,
      content,
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({
      ...prev,
      open: false,
      content: null,
    }));
  };

  const { columns } = useClientColumns({
    handleOpenModal,
    handleCloseModal,
    showToast,
  });

  const debouncedSearch = debounce((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    params.set("page", "1"); // resetear página

    router.replace(`?${params.toString()}`);
  }, 500);

  return (
    <>
      {contextHolder}
      <div className="p-4 space-y-3">
        <ModalCustom
          modalState={{
            content: modalState.content,
            open: modalState.open,
            title: modalState.title,
          }}
          onCancel={handleCloseModal}
        />

        <h2 className="text-lg font-semibold">Lista de clientes</h2>

        <div className="flex justify-between items-center gap-2 ">
          <div className="flex justify-start items-center gap-2 w-full">
            <Input
              allowClear
              placeholder="Buscar empresa por RFC, Empresa, Nombre"
              className="max-w-md"
              onChange={(e) => {
                debouncedSearch(e.target.value);
              }}
            />
          </div>

          <Button
            icon={<PlusOutlined className="cursor-pointer" />}
            variant="solid"
            color="primary"
            onClick={() =>
              handleOpenModal(
                "Crear cliente",
                <ClientForm onCloseModal={handleCloseModal} />
              )
            }
          >
            Crear Cliente
          </Button>
        </div>

        <div className="mt-8">
          <TableDynamic<ClientWithRelations>
            columns={columns}
            data={data || []}
            tableParams={{
              pagination: {
                pageSize: pageSize,
                current: page,
              },
            }}
            totalItems={totalItems || 0}
          />
        </div>
      </div>
    </>
  );
}
