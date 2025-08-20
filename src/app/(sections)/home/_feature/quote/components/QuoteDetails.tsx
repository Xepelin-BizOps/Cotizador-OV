import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Table, Divider, Button, Tooltip, Spin } from "antd";
import { getQuoteById } from "../actions";
import type { PlainQuotesDetails } from "../quote-types";

interface Props {
  quoteId: number;
}

export default function QuoteDetails({ quoteId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<PlainQuotesDetails | null>(null);

  // Get detalles de la cotización
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const res = await getQuoteById(quoteId);

      if (res.success) {
        setData(res.data);
      }

      setIsLoading(false);
    })();
  }, [quoteId]);

  const subtotal =
    data?.items.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0
    ) || 0;

  const IVA_PERCENT = 0.16;
  const iva = subtotal * IVA_PERCENT;
  const total = subtotal + iva;

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Spin tip="Cargando datos..." size="large">
          <p className="p-52"></p>
        </Spin>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Empresa */}
      <div className="p-4 rounded-lg shadow-sm border border-accent-light-hover">
        <h2 className="text-lg font-semibold mb-3">Empresa</h2>
        <p className="text-sm text-neutral-strong font-medium">
          Nombre: {data?.company.companyName} - {data?.company.country}
        </p>
        <p className="text-sm">
          <span className="text-sm font-medium text-neutral-mild">RFC:</span>{" "}
          {data?.company.rfc}
        </p>
        <Divider style={{ margin: 8 }} />
        <p className="text-sm">
          <span className="text-sm font-medium text-neutral-mild">Email:</span>{" "}
          {data?.company.email}
        </p>
        <p className="text-sm">
          <span className="text-sm font-medium text-neutral-mild">
            Teléfono:
          </span>{" "}
          {data?.company.phone}
        </p>
      </div>

      {/* Cliente y cotización */}
      <div className="p-4 rounded-lg shadow-sm border border-accent-light-hover space-y-2">
        <h2 className="text-lg font-semibold mb-3">Cliente</h2>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <p className="text-sm font-medium text-neutral-strong">Nombre</p>
            <p className="text-sm">
              {data?.client?.type === "COMPANY"
                ? data?.client?.companyName
                : data?.client?.fullName}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-strong">RFC</p>
            <p className="text-sm">{data?.client?.rfc}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-strong">Fecha</p>
            <p className="text-sm">
              {dayjs(data?.quotationDate).format("DD/MM/YYYY")}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <p className="text-sm font-medium text-neutral-strong">Estado</p>
            <p className="text-sm">{data?.status}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-strong">
              Total de productos
            </p>
            <p className="text-sm">{data?.items.length}</p>
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="p-4 rounded-lg shadow-sm border border-accent-light-hover">
        <h4 className="text-lg font-semibold mb-2">Productos</h4>
        <div className="rounded-lg overflow-hidden border border-neutral-light">
          <Table
            className="text-sm"
            dataSource={data?.items.map((item) => ({
              key: item.id,
              name: item.productName,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              total: Number(item.unitPrice) * item.quantity,
            }))}
            columns={[
              { title: "Producto", dataIndex: "name" },
              { title: "Cantidad", dataIndex: "quantity" },
              {
                title: "Precio Unit.",
                dataIndex: "unitPrice",
                render: (val) => `$${val.toFixed(2)}`,
              },
              {
                title: "Total",
                dataIndex: "total",
                render: (val) => `$${val.toFixed(2)}`,
              },
            ]}
            rowHoverable={false}
            pagination={false}
            size="small"
            scroll={{ x: "max-content" }}
          />
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="bg-accent-light-m p-4 rounded-lg shadow-inner">
        <div className="text-right space-y-1">
          <div className="flex justify-between items-center">
            <p className="text-neutral-strong">Subtotal</p>
            <p className="text-neutral-strong">${subtotal.toFixed(2)}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-neutral-strong">IVA (16%)</p>
            <p className="text-neutral-strong">${iva.toFixed(2)}</p>
          </div>
          <Divider />
          <div className="flex justify-between items-center">
            <p className="text-xl font-bold">Total:</p>
            <p className="text-xl font-bold">${total.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Acción */}
      <div className="text-right">
        <Tooltip title="Próximamente">
          <Button
            className="bg-accent text-white hover:bg-accent-hover"
            disabled
          >
            Descargar PDF
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
