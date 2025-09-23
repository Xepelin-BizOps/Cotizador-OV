"use client";
import { useMemo, useState } from "react";
import { Button } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { BankOutlined, PrinterFilled } from "@ant-design/icons";
import {
  addressMap,
  quotationTypeMapLabels,
} from "@/app/constants/optionsSelects";
import { calculateTotals } from "@/utils/functions";
import type { ClientWithRelations } from "../../_feature/client/client-types";
import type { companyById } from "../../_feature/company/company-types";
import type {
  CreateQuoteDto,
  CreateQuoteItemDto,
  EditQuoteItemDto,
} from "@/schemas/quote/quote.dto";
import { useHtmlToPdf } from "../../../../hooks/useHtmlToPdf";
import useToast from "@/app/hooks/useToast";
import { updateQuotePdfKey } from "../../_feature/quote/actions";

// tomar los dto que cree con zod (manejar create y edit) en un solo type
type QuoteItemStateType = CreateQuoteItemDto | EditQuoteItemDto;

interface Props {
  data: Partial<CreateQuoteDto>;
  items: QuoteItemStateType[] | [];
  company: companyById | null;
  client: ClientWithRelations | null;
  clientLoading?: boolean;
  optionsCurrencies: { label: string; value: string }[];
  taxRate: number | undefined | null;
  quoteId?: number; // ID de la cotización para guardar la clave del PDF
}

export default function PreviewPrint({
  data,
  optionsCurrencies,
  clientLoading,
  client,
  company,
  items,
  taxRate,
  quoteId,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  // Buscar el label en base al id que llega
  const foundCurrenciLabel = (id: string) => {
    return optionsCurrencies.find((item) => item.value === id)?.label || "";
  };

  // Funcion para calcular totales
  const { ivaAmount, subtotal, total } = useMemo(
    () => calculateTotals(items || [], taxRate || 0),
    [items, taxRate]
  );

  const { downloadPdf, generatePdfForS3, refHtml } = useHtmlToPdf();
  const { showToast, contextHolder } = useToast();

  const onDowloadPDFClick = async () => {
    setIsLoading(true);
    const filename = `Cotización-${client?.companyName || client?.fullName}-${data?.quotationIdentifier || 'N/A'}.pdf`;
    
    try {
      // Generar PDF y subir a S3
      const result = await generatePdfForS3(filename);
      
      if (result.success && result.key) {
        // Si tenemos un quoteId, guardar la clave en la base de datos
        if (quoteId) {
          const updateResult = await updateQuotePdfKey(quoteId, result.key);
          if (!updateResult.success) {
            showToast({
              type: "error",
              message: "PDF generado pero no se pudo guardar la referencia en la base de datos",
            });
          }
        }
        
        // También descargar localmente
        await downloadPdf(filename);
        
        showToast({
          type: "success",
          message: "PDF generado y guardado en S3 correctamente",
        });
      } else {
        showToast({
          type: "error",
          message: result.error || "Error al generar el PDF",
        });
      }
    } catch {
      showToast({
        type: "error",
        message: "Error inesperado al generar el PDF",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full h-full px-4">
      {contextHolder}
      <div className="w-full flex justify-between items-start px-4 border-gray-200 bg-accent-light p-4 rounded-lg">
        <h2 className="text-xl font-semibold text-indigo-600">
          Previsualización del PDF
        </h2>
        <Button
          onClick={onDowloadPDFClick}
          icon={<PrinterFilled />}
          variant="solid"
          color="primary"
          loading={isLoading}
        >
          Descarga PDF
        </Button>
      </div>
      <div ref={refHtml} className="w-[21cm] bg-[#ffff] p-4 text-sm">
        <div className="flex justify-between items-start border-b pb-4">
          <div className={`flex space-x-3`}>
            {company?.logoBase64 ? (
              <img 
                src={company.logoBase64} 
                alt="Logo de la empresa" 
                className="w-16 h-16 object-contain"
              />
            ) : (
              <BankOutlined className="text-5xl text-[#364153]" />
            )}
            <div>
              <h1 className="font-bold text-lg">{company?.companyName}</h1>
              <p className="text-[#4a5565] text-xs">
                {company?.address && company?.country 
                  ? `${company.address} - ${company.country}`
                  : company?.address || company?.country || ""
                }
              </p>
              <div className="mt-1 space-y-0.5">
                {company?.email && (
                  <p className="text-[#4a5565] text-xs">
                    {company.email}
                  </p>
                )}
                {company?.phone && (
                  <p className="text-[#4a5565] text-xs">
                    {company.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-[#494bd4] font-bold">COTIZACIÓN</h2>
            <p>
              <span className="font-semibold">ID:</span>{" "}
              {data?.quotationIdentifier || "Sin información"}
            </p>
            <p>
              <span className="font-semibold">Fecha:</span>{" "}
              {data.quotationDate
                ? dayjs(data.quotationDate)
                    .locale("es")
                    .format("D [de] MMMM [de] YYYY")
                : "Sin información"}
            </p>
            <p className="text-[#494bd4] font-semibold">
              Válida hasta:{" "}
              {data.quotationValidity
                ? dayjs(data.quotationValidity)
                    .locale("es")
                    .format("D [de] MMMM [de] YYYY")
                : "Sin información"}
            </p>
            {/* <div className=" ml-auto mt-2 border border-[#99a1af] w-20 h-20 flex items-center justify-center rounded">
              <p>QR</p>
            </div> */}
          </div>
        </div>

        <div className={`mt-3 ${clientLoading ? "animate-pulse" : ""}`}>
          <h3 className="font-bold mb-2 text-lg">Datos del Cliente</h3>
          <div className="grid grid-cols-2 gap-2 bg-[#f9fafb] p-3 rounded-lg">
            <p>
              <span className="font-semibold">
                {client?.type === "COMPANY" ? "Empresa:" : "Cliente:"}
              </span>{" "}
              {client?.type === "COMPANY"
                ? client.companyName
                : client?.fullName}
            </p>
            <p>
              <span className="font-semibold">Email:</span>{" "}
              {client?.billingEmail}
            </p>
            <p>
              <span className="font-semibold">Teléfono:</span>{" "}
              {client?.phone || "Sin información"}
            </p>
            <p>
              <span className="font-bold">
                {" "}
                {client?.type === "COMPANY" ? "Industria:" : "Profesión:"}
              </span>{" "}
              {client?.type === "COMPANY"
                ? client.industry
                : client?.profession}
            </p>
          </div>
          <div className="mt-2">
            <h3 className="font-bold text-lg mb-2 text-[#1f2937]">
              Direcciones
            </h3>

            {client && client.addresses.length > 0 ? (
              <div className="grid gap-2">
                {client.addresses.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#f9fafb] rounded-md p-2 text-sm"
                  >
                    <p className="font-semibold mb-1 text-[#111827]">
                      {addressMap[item.type]}
                    </p>
                    <p className="text-[#374151]">
                      {item.street} - {item.city} - {item.state} - {item.zip}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="italic text-[#6b7280]">Sin información</p>
            )}
          </div>

          <div className="mt-2">
            <h3 className="font-bold text-lg mb-2">Contactos</h3>

            {client && client.contacts.length > 0 ? (
              <div className="grid gap-2">
                {client.contacts.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#f9fafb] rounded-md p-2 text-sm"
                  >
                    <p className="font-semibold text-[#1e2939]">
                      {item.fullName}
                    </p>
                    <p className="text-[#364153]">
                      {item.role} - {item.email}
                    </p>
                    <p className="text-[#36415">
                      Tel: {item.phone} | WhatsApp: {item.whatsapp}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#6a7282] italic">Sin información</p>
            )}
          </div>
        </div>

        <div className="my-3">
          <h3 className="font-bold mb-3 text-lg">Productos y Servicios</h3>
          <table className="w-full text-center text-xs rounded-lg overflow-hidden">
            <thead className="bg-[#f3f4f6]">
              <tr>
                <th className="px-3 py-2 border-b border-[#e5e7eb]">Código</th>
                <th className="px-3 py-2 border-b border-[#e5e7eb]">Nombre</th>
                <th className="px-3 py-2 border-b border-[#e5e7eb]">Cant.</th>
                <th className="px-3 py-2 border-b border-[#e5e7eb]">
                  Precio Unit.
                </th>
                <th className="px-3 py-2 border-b border-[#e5e7eb]">Total</th>
              </tr>
            </thead>
            <tbody>
              {items && items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.productId} className="hover:bg-[#f9fafb]">
                    <td className="px-3 py-2 border-b border-[#e5e7eb]">
                      {item.sku}
                    </td>
                    <td className="px-3 py-2 border-b border-[#e5e7eb]">
                      {item.productName}
                    </td>
                    <td className="px-3 py-2 border-b border-[#e5e7eb]">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 border-b border-[#e5e7eb]">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 border-b border-[#e5e7eb]">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="hover:bg-[#f9fafb]">
                  <td
                    colSpan={5}
                    className="px-3 py-2 border-b border-[#e5e7eb]"
                  >
                    Sin productos o servicios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="my-4 flex justify-end">
            <div className="w-1/2 space-y-1 text-lg px-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>
                  {foundCurrenciLabel(data.currencyId as unknown as string)} $
                  {subtotal.toFixed(2)}
                </span>
              </div>
              {data.quotationType === "WITH_IVA" && (
                <div className="flex justify-between">
                  <span>
                    {quotationTypeMapLabels[data.quotationType! as keyof typeof quotationTypeMapLabels]}:
                    {data.quotationType === "WITH_IVA"
                      ? ` ${data?.taxRate ? (data.taxRate * 100).toFixed(0) : "X"}%`
                      : ""}
                  </span>
                  <span>
                    {" "}
                    {foundCurrenciLabel(data.currencyId as unknown as string)} $
                    {ivaAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#555eee] border-t mt-4">
                <span>Total:</span>
                <span>
                  {" "}
                  {foundCurrenciLabel(data.currencyId as unknown as string)} $
                  {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          {data.serviceDescription && (
            <div className="mb-4">
              <h3 className="font-bold mb-2 text-lg">
                Descripción del servicio
              </h3>
              <p className="bg-[#f9fafb] p-3 rounded-lg">
                {data.serviceDescription}
              </p>
            </div>
          )}
          {data.termsOfPayment && (
            <div className="mb-4">
              <h3 className="font-bold mb-2 text-lg">Condiciones de pago</h3>
              <p className="bg-[#f9fafb] p-3 rounded-lg">
                {data.termsOfPayment}
              </p>
            </div>
          )}
          {data.valGuarantees && (
            <div className="mb-4 ">
              <h3 className="font-bold mb-2 text-lg">Validez y garantías</h3>
              <p className="bg-[#f9fafb] p-3 rounded-lg">
                {data.valGuarantees}
              </p>
            </div>
          )}
          {data.paymentMethods && (
            <div className="mb-4">
              <h3 className="font-bold mb-2 text-lg">Métodos de pago</h3>
              <p className="bg-[#f9fafb] p-3 rounded-lg">
                {data.paymentMethods}
              </p>
            </div>
          )}
          {data.exclusions && (
            <div className="mb-4">
              <h3 className="font-bold mb-2 text-lg">Exclusiones</h3>
              <p className="bg-[#f9fafb] p-3 rounded-lg">{data.exclusions}</p>
            </div>
          )}
          {data.additionalInfo && (
            <div className="mb-4">
              <h3 className="font-bold mb-2 text-lg">Información adicional</h3>
              <p className="bg-[#f9fafb] p-3 rounded-lg">
                {data.additionalInfo}
              </p>
            </div>
          )}
          {data.tyc && (
            <div className="mb-4">
              <h3 className="font-bold mb-2 text-lg">Términos y condiciones</h3>
              <p className="bg-[#f9fafb] p-3 rounded-lg">{data.tyc}</p>
            </div>
          )}
        </div>

        <div className="mt-5">
          <h3 className="font-bold mb-2 text-lg">Aceptación de Cotización</h3>
          <div className="grid grid-cols-2 gap-6 border p-3 rounded ">
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Nombre: </span>
                {client?.type === "COMPANY"
                  ? client.companyName
                  : client?.fullName}
              </p>
              <p>
                <span className="font-semibold">Cargo: </span>{" "}
                ____________________
              </p>
              <p>
                <span className="font-semibold">Firma:</span>{" "}
                ____________________
              </p>
            </div>
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Empresa: </span>{" "}
                {client?.type === "COMPANY"
                  ? client.companyName
                  : client?.fullName}
              </p>
              <p>
                <span className="font-semibold">Fecha:</span>{" "}
                ____________________
              </p>
              <p>
                <span className="font-semibold">Sello:</span>{" "}
                ____________________
              </p>
            </div>
          </div>
          <p className="text-xs text-[#6a7282] mt-2">
            <span className="font-semibold">Nota:</span> {data.note}
          </p>
        </div>
      </div>
    </div>
  );
}
