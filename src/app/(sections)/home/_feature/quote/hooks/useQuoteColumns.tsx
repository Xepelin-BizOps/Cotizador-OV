import { Dropdown, Button, Tooltip, Tag, Space, Popconfirm } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  SendOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import QuoteSend from "../components/QuoteSend";
import QuoteDetails from "../components/QuoteDetails";
import { ToastOptions } from "@/app/hooks/useToast";
import dayjs from "dayjs";
import { EditQuoteDto } from "@/schemas/quote/quote.dto";
import type { PlainQuotesWithRelations } from "../quote-types";
import { QuotationStatus } from "@prisma/client";
import { mapQuoteListToFormValues } from "../quote-mappers";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteQuote } from "../actions";
import { TabName } from "@/app/constants/optionsSelects";

interface Props {
  handleOpenModal: (title: string, content: React.ReactNode) => void;
  toggleShowForm: (type: "create" | "edit" | null, data?: EditQuoteDto) => void;
  showToast: (options: ToastOptions) => void;
}

export function useQuotesColumns({
  handleOpenModal,
  toggleShowForm,
  showToast,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // DELETE quote
  const handleDeleteQuote = async (id: number) => {
    setIsLoading(true);
    const response = await deleteQuote(id);

    showToast({
      type: response.success ? "success" : "error",
      message: response.message,
    });

    router.replace(`/home?tab=${TabName.quote}`);
    setIsLoading(false);
  };

  // More options for the dropdown menu
  const items = [
    {
      key: "1",
      label: "Duplicar",
      onClick: () => console.log("duplicar"),
    },
  ];

  const columns: ColumnsType<PlainQuotesWithRelations> = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Cliente",
      dataIndex: "client",
      key: "client",
      render: (_, record) => (
        <p>{record.client?.companyName || record.client?.fullName}</p>
      ),
    },
    {
      title: "RFC",
      dataIndex: "rfc",
      key: "rfc",
      render: (_, record) => <p>{record.client?.rfc}</p>,
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      render: (_, record) => (
        <p>{dayjs(record.quotationDate).format("DD-MM-YYYY")}</p>
      ),
    },
    {
      title: "Monto",
      dataIndex: "monto",
      key: "monto",
      render: (_, record) => <p>${record.totalAmount.toFixed(2)}</p>,
    },
    {
      title: "Estado",
      key: "estado",
      dataIndex: "estado",
      render: (_, { status }) => {
        let color = "default";

        switch (status) {
          case QuotationStatus.DRAFT:
            color = "default";
            break;
          case QuotationStatus.SENT:
            color = "blue";
            break;
          case QuotationStatus.REJECTED:
            color = "red";
            break;
          case QuotationStatus.CONFIRMED:
            color = "cyan";
            break;
          case QuotationStatus.PARTIAL_PAYMENT:
            color = "orange";
            break;
          case QuotationStatus.PAID:
            color = "green";
            break;
          default:
            color = "default";
            break;
        }

        return (
          <Tag color={color} style={{ borderRadius: "1rem" }}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Acciones",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Ver Detalles">
            <Button
              color="primary"
              variant="outlined"
              icon={<EyeOutlined />}
              onClick={() =>
                handleOpenModal(
                  "Detalles de la Cotización",
                  <QuoteDetails quoteId={record.id} />
                )
              }
            />
          </Tooltip>
          <Tooltip title="Enviar - próximamente">
            <Button
              color="primary"
              variant="outlined"
              icon={<SendOutlined />}
              onClick={() =>
                handleOpenModal(
                  `Enviar Mensaje - ${
                    record.client?.companyName || record.client?.fullName
                  }`,
                  <QuoteSend />
                )
              }
              disabled
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              color="primary"
              variant="outlined"
              icon={<EditOutlined />}
              onClick={() =>
                toggleShowForm("edit", mapQuoteListToFormValues(record))
              }
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Popconfirm
              title="Eliminar"
              description="¿Estás seguro de que deseas eliminar esta cotización?"
              onConfirm={() => handleDeleteQuote(record.id)}
              cancelText="Cancelar"
              okText="Eliminar"
              okButtonProps={{
                disabled: isLoading,
                loading: isLoading,
              }}
            >
              <Button
                color="primary"
                variant="outlined"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
          <Dropdown
            menu={{
              items,
            }}
          >
            <Button>
              <MoreOutlined />
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  return { columns };
}
