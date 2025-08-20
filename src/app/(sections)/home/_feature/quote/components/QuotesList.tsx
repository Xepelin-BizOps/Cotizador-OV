"use client";
import TableDynamic from "@/app/components/TableDynamic";
import { useState } from "react";
import type { PlainQuotesWithRelations } from "../quote-types";
import { useQuotesColumns } from "../hooks/useQuoteColumns";
import useToast from "@/app/hooks/useToast";
import debounce from "lodash.debounce";
import { MessageOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, Select, Tooltip } from "antd";
import { ModalCustom } from "@/app/components/ModalCustom";
import QuoteForm from "./QuoteForm";
import { QuotationStatus } from "@prisma/client";
import { EditQuoteDto } from "@/schemas/quote/quote.dto";
import { quoteStatusOptions, TabName } from "@/app/constants/optionsSelects";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  data: PlainQuotesWithRelations[];
  totalItem: number;
  optionsProducts: { label: string; value: number }[];
  optionsClients: { label: string; value: number }[];
}

export default function QuotesList({
  optionsProducts,
  optionsClients,
  totalItem,
  data,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Obtengo de los searchParams para pasarle a la table o asigno por defult
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);

    const [showForm, setShowForm] = useState<{
      data?: EditQuoteDto;
      show: "edit" | null;
    }>({
      data: undefined,
      show: null,
    });
  const [modalState, setModalState] = useState<{
    open: boolean;
    title: string;
    content: React.ReactNode;
  }>({
    open: false,
    title: "",
    content: null,
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

    const featureNewQuote =
      process.env.NEXT_PUBLIC_FEATURE_NUEVA_COTIZACION === "true";

    // Show form Create or edit
    const toggleShowForm = (
      type: "create" | "edit" | null,
      data?: EditQuoteDto
    ) => {
      if (type === "edit") {
        setShowForm({ show: "edit", data });
      } else {
        setShowForm({ show: null, data: undefined });
      }
    };

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

  const { contextHolder, showToast } = useToast();

  const { columns } = useQuotesColumns({
    handleOpenModal,
    toggleShowForm,
    showToast,
  });

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

        {!showForm.show && (
          <>
            <h2 className="text-lg font-semibold">Cotizaciones</h2>
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:w-full">
                <Input
                  allowClear
                  placeholder="Buscar por cliente o Id"
                  className="w-full md:max-w-md"
                  onChange={(e) => {
                    debouncedSearch(e.target.value);
                  }}
                />
                <Select
                  className="w-full md:max-w-[18rem]"
                  placeholder="Estado"
                  allowClear
                  options={quoteStatusOptions}
                  onChange={(value: QuotationStatus) => {
                    if (value) {
                      router.replace(
                        `/home?tab=${TabName.quote}&status=${value}&page=1`
                      );
                    } else {
                      router.replace(`/home?tab=${TabName.quote}&page=1`);
                    }
                  }}
                />
              </div>

              <Tooltip title="Próximamente">
                <Button
                  icon={<MessageOutlined className="cursor-pointer" />}
                  variant="outlined"
                  color="primary"
                  disabled
                >
                  Enviar recordatorios
                </Button>
              </Tooltip>
                {featureNewQuote && (
                  <Button
                    icon={<PlusOutlined className="cursor-pointer" />}
                    variant="solid"
                    color="primary"
                    onClick={() => router.push('/quotes/new')}
                  >
                    Nueva Cotización
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

      {!showForm.show && (
        <div className="mt-8">
          <TableDynamic<PlainQuotesWithRelations>
            columns={columns}
            data={data || []}
            tableParams={{
              pagination: {
                current: page,
                pageSize: pageSize,
              },
            }}
            totalItems={totalItem || 0}
          />
        </div>
      )}

      {showForm.show && (
        <QuoteForm
          toggleForm={toggleShowForm}
          isEdit={showForm.show === "edit" ? true : false}
          dataEdit={showForm.data || undefined}
          optionsProducts={optionsProducts}
          optionsClients={optionsClients}
        />
      )}
    </>
  );
}
