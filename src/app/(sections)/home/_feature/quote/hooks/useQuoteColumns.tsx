import { Dropdown, Button, Tooltip, Tag, Space, Popconfirm, message } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  SendOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import QuoteSend from "../components/QuoteSend";
import PdfViewer from "../../../quotes/_components/PdfViewer";
import { ToastOptions } from "@/app/hooks/useToast";
import dayjs from "dayjs";
import type { PlainQuotesWithRelations } from "../quote-types";
import { QuotationStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteQuote, createQuote, updateQuoteStatus, checkQuoteHasPayments, generateQuotePdf } from "../actions";
import { CreateQuoteDto } from "@/schemas/quote/quote.dto";
import { formatNumberWithCommas } from "@/utils/functions";
import { TabName } from "@/app/constants/optionsSelects";

interface Props {
  handleOpenModal: (title: string, content: React.ReactNode) => void;
  showToast: (options: ToastOptions) => void;
}

export function useQuotesColumns({
  handleOpenModal,
  showToast,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<PlainQuotesWithRelations | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<QuotationStatus | undefined>(undefined);
  const [quotesWithPayments, setQuotesWithPayments] = useState<Set<number>>(new Set());
  const router = useRouter();

  // DELETE quote
  const handleDeleteQuote = async (id: number) => {
    setIsLoading(true);
    
    // Verificar si la cotización tiene pagos
    const paymentCheck = await checkQuoteHasPayments(id);
    if (paymentCheck.success && paymentCheck.hasPayments) {
      showToast({
        type: "error",
        message: "No se puede eliminar la cotización porque tiene pagos registrados",
      });
      setIsLoading(false);
      return;
    }

    const response = await deleteQuote(id);

    showToast({
      type: response.success ? "success" : "error",
      message: response.message,
    });

    router.replace(`/home?tab=${TabName.quote}`);
    setIsLoading(false);
  };


  // Handle payment registration
  const handlePaymentRegistration = (quote: PlainQuotesWithRelations) => {
    setSelectedQuote(quote);
    setPaymentModalOpen(true);
  };

  // Handle PDF generation
  const handleGeneratePdf = async (quote: PlainQuotesWithRelations) => {
    try {
      setIsLoading(true);
      const response = await generateQuotePdf(quote.id);
      
      if (response.success) {
        message.success("PDF generado correctamente");
        // Refrescar la lista para mostrar el PDF
        router.replace(`/home?tab=${TabName.quote}`);
      } else {
        message.error(response.message);
      }
    } catch {
      message.error("Error al generar el PDF");
    } finally {
      setIsLoading(false);
    }
  };

  // Close modals
  const handleCloseStatusModal = () => {
    setStatusModalOpen(false);
    setSelectedQuote(null);
    setSelectedStatus(undefined);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false);
    setSelectedQuote(null);
  };

  // Handle success callbacks
  const handleStatusSuccess = () => {
    handleCloseStatusModal();
    router.replace(`/home?tab=${TabName.quote}`);
  };

  const handlePaymentSuccess = () => {
    handleClosePaymentModal();
    router.replace(`/home?tab=${TabName.quote}`);
  };

  const handleConfirmQuote = async (record: PlainQuotesWithRelations) => {
    try {
      const response = await updateQuoteStatus(record.id, QuotationStatus.CONFIRMED);
      if (response.success) {
        message.success("Cotización confirmada correctamente");
        router.replace(`/home?tab=${TabName.quote}`);
      } else {
        message.error(response.message);
      }
    } catch {
      message.error("Error al confirmar la cotización");
    }
  };

  const handleRejectQuote = async (record: PlainQuotesWithRelations) => {
    try {
      const response = await updateQuoteStatus(record.id, QuotationStatus.REJECTED);
      if (response.success) {
        message.success("Cotización rechazada correctamente");
        router.replace(`/home?tab=${TabName.quote}`);
      } else {
        message.error(response.message);
      }
    } catch {
      message.error("Error al rechazar la cotización");
    }
  };


  const checkIfQuoteHasPayments = async (quoteId: number) => {
    try {
      const response = await checkQuoteHasPayments(quoteId);
      if (response.success && response.hasPayments) {
        setQuotesWithPayments(prev => new Set([...prev, quoteId]));
        return true;
      }
      return false;
    } catch {
      console.error("Error verificando pagos");
      return false;
    }
  };

  const handleDuplicateQuote = async (record: PlainQuotesWithRelations) => {
    try {
      // Crear una nueva cotización con los mismos datos pero en estado DRAFT
      const duplicateData = {
        companyId: record.companyId,
        clientId: record.clientId,
        note: record.note || undefined,
        quotationDate: new Date().toISOString(),
        quotationValidity: undefined,
        currencyId: 1,
        totalAmount: record.totalAmount,
        status: QuotationStatus.DRAFT,
        items: record.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sku: "",
          totalPrice: item.unitPrice * item.quantity,
        })),
      };

      const response = await createQuote(duplicateData as unknown as CreateQuoteDto);
      if (response.success) {
        message.success("Cotización duplicada correctamente");
        router.replace(`/home?tab=${TabName.quote}`);
      } else {
        message.error(response.message);
      }
    } catch {
      message.error("Error al duplicar la cotización");
    }
  };

  // More options for the dropdown menu
  const getDropdownItems = (record: PlainQuotesWithRelations) => {
    const items = [
      {
        key: "1",
        label: "Duplicar",
        onClick: async () => handleDuplicateQuote(record),
      },
    ];

    // Verificar pagos solo para DRAFT y SENT (donde importa si tiene pagos)
    const hasPayments = quotesWithPayments.has(record.id);
    
    // Mostrar opciones de estado basadas en el estado actual y si tiene pagos
    if (record.status === QuotationStatus.DRAFT || record.status === QuotationStatus.SENT) {
      // Para DRAFT y SENT: mostrar ambas opciones si no tiene pagos
      if (!hasPayments) {
        items.push(
          {
            key: "2",
            label: "Confirmar",
            onClick: async () => {
              await checkIfQuoteHasPayments(record.id);
              handleConfirmQuote(record);
            },
          },
          {
            key: "3",
            label: "Rechazar",
            onClick: async () => {
              await checkIfQuoteHasPayments(record.id);
              handleRejectQuote(record);
            },
          }
        );
      }
    } else if (record.status === QuotationStatus.CONFIRMED) {
      // Para CONFIRMED: mostrar solo Rechazar (incluso con pagos)
      items.push({
        key: "3",
        label: "Rechazar",
        onClick: async () => handleRejectQuote(record),
      });
    } else if (record.status === QuotationStatus.REJECTED) {
      // Para REJECTED: mostrar solo Confirmar (incluso con pagos)
      items.push({
        key: "2",
        label: "Confirmar",
        onClick: async () => handleConfirmQuote(record),
      });
    }

    // Solo mostrar la opción de registrar pago si está confirmada o tiene pago parcial
    if (record.status === QuotationStatus.CONFIRMED || record.status === QuotationStatus.PARTIAL_PAYMENT) {
      items.push({
        key: "4",
        label: "Registrar Pago",
        onClick: async () => handlePaymentRegistration(record),
      });
    }

    return items;
  };

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
      render: (_, record) => <p>${formatNumberWithCommas(record.totalAmount)}</p>,
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
          {record.pdfS3Key ? (
            <Tooltip title="Ver PDF">
              <Button
                color="primary"
                variant="outlined"
                icon={<EyeOutlined />}
                onClick={() => {
                  handleOpenModal(
                    "PDF de la Cotización",
                    <PdfViewer pdfKey={record.pdfS3Key!} fileName={`Cotización-${record.id}.pdf`} />
                  );
                }}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Generar PDF">
              <Button
                color="default"
                variant="outlined"
                icon={<EyeOutlined />}
                onClick={() => handleGeneratePdf(record)}
                loading={isLoading}
              />
            </Tooltip>
          )}
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
              onClick={() => router.push(`/home/quotes/edit/${record.id}`)}
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
              items: getDropdownItems(record),
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

  return { 
    columns,
    statusModalOpen,
    paymentModalOpen,
    selectedQuote,
    selectedStatus,
    handleCloseStatusModal,
    handleClosePaymentModal,
    handleStatusSuccess,
    handlePaymentSuccess,
  };
}
