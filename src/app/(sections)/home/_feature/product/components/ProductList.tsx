"use client";
import React, { useState } from "react";
import useProductColumns from "../hooks/useProductColumns";
import TableDynamic from "@/app/components/TableDynamic";
import type { PlainProductWithRelations } from "../product-types";
import ProductForm from "./ProductForm";
import { PlusOutlined } from "@ant-design/icons";
import { ModalCustom } from "@/app/components/ModalCustom";
import { Button, Input } from "antd";
import debounce from "lodash.debounce";
import useToast from "@/app/hooks/useToast";
import { useRouter, useSearchParams } from "next/navigation";
import useKeepScrolling from "@/app/hooks/useKeepScrolling";

interface Props {
  data: PlainProductWithRelations[];
  totalItems: number;
}

export default function ProductList({ data, totalItems }: Props) {
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
    width?: number;
  }>({
    open: false,
    title: "",
    content: null,
    width: 900,
  });

  // Mantener el scroll en el input
  const { elementRef } = useKeepScrolling({
    searchParams: searchParams.get("search"),
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

  const { columns } = useProductColumns({
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
          width={
            modalState.title === "Detalles del ítem" ? 600 : modalState.width
          }
        />

        <h2 className="text-lg font-semibold">Lista de catálogos</h2>

        <div className="flex justify-between items-center gap-2 ">
          <div
            className="flex justify-start items-center gap-2 w-full"
            ref={elementRef}
          >
            <Input
              allowClear
              placeholder="Buscar por Nombre o SKU"
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
                "Agregar Nuevo Producto",
                <ProductForm onCloseModal={handleCloseModal} isEdit={false} />
              )
            }
          >
            Agregar Ítem
          </Button>
        </div>

        <div className="mt-8">
          <TableDynamic<PlainProductWithRelations>
            columns={columns}
            data={data}
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
