import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { XIcon, CheckCircleIcon, DownloadIcon, ClockIcon } from "lucide-react";
import { jsPDF } from "jspdf";

interface DetalleMovimientoProps {
  movimiento: {
    id: string;
    fecha: string;
    tipo: 'envio' | 'recibo' | 'pago' | 'financiamiento' | 'conversion';
    descripcion: string;
    destinatario: string;
    monto: number;
    hora: string;
    internacional?: boolean;
    pendiente?: boolean;
    enProceso?: boolean;
    rechazado?: boolean;
    montoOriginal?: number;
    monedaOriginal?: 'USD' | 'MXN';
    tipoCambio?: number;
    concepto?: string;
    cuentaDestino?: {
      nombre?: string;
      banco?: string;
      numeroCuenta?: string;
      tipo?: string;
      pais?: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
}

export const DetalleMovimiento = ({ movimiento, isOpen, onClose }: DetalleMovimientoProps): React.JSX.Element => {
  if (!isOpen) return <></>;

  // Generar datos específicos para transferencia internacional
  const montoFormateado = Math.abs(movimiento.monto).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const fechaCompleta = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }) + ` • ${movimiento.hora}`;

  // Datos específicos para transferencia internacional
  const detallesTransferencia = {
    numeroReferencia: `TR${Date.now().toString().slice(-6)}`,
    claveRastreo: `XEPELINbc${Date.now().toString().slice(-8)}e4`,
    folioInterno: `C${Date.now().toString().slice(-8)}5`,
    destinatario: {
      nombre: movimiento.cuentaDestino?.nombre || "John Doe",
      banco: movimiento.cuentaDestino?.banco || "Bank of America",
      clabe: movimiento.cuentaDestino?.numeroCuenta || "324 555 8462988652 1"
    },
    emisor: {
      nombre: "TU EMPRESA S.A. DE C.V.",
      rfc: "TUE880720BM6", 
      banco: "BBVA Bancomer, S.A.",
      clabe: "012 555 8462988652 3"
    }
  };

  const esCompleta = !movimiento.pendiente && !movimiento.enProceso;

  const handleDescargarComprobante = async () => {
    const doc = new jsPDF();
    
    // Configurar fuentes y colores
    const primaryColor = [85, 94, 238]; // #555EEE
    const textColor = [51, 51, 51];
    const lightGray = [128, 128, 128];
    
    // Header con logo y título Xepelin
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 25, 'F');
    
    // Título del comprobante
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('xepelin', 20, 17);
    
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprobante de transferencia', 20, 45);
    
    // Monto principal
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${montoFormateado} MXN`, 20, 65);
    
    // Información principal en dos columnas
    let y = 85;
    const leftCol = 20;
    const rightCol = 120;
    
    // Función para agregar fila de información
    const addRow = (label: string, value: string, isLeft = true) => {
      const x = isLeft ? leftCol : rightCol;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(label, x, y);
      
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(10);
      doc.text(value, x, y + 5);
      
      if (!isLeft) y += 15;
    };
    
    // Información básica
    addRow('Iniciado por', 'Usuario Empresa', true);
    addRow('Fecha de inicio', fechaCompleta, false);
    
    addRow('Tipo', 'Transferencia Internacional', true);
    addRow('Entrega estimada', '07 - 13 Agosto, 2025', false);
    
    addRow('Número de referencia', detallesTransferencia.numeroReferencia, true);
    addRow('UETR', `${detallesTransferencia.claveRastreo}`, false);
    
    // Sección DETALLES
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('DETALLES', 20, y);
    y += 15;
    
    addRow('Código SWIFT / BIC', 'CHASUS33', true);
    addRow('IBAN / Número de cuenta', detallesTransferencia.destinatario.clabe || '1234567890', false);
    
    addRow('País del banco', 'Estados Unidos', true);
    addRow('Dirección', `${detallesTransferencia.destinatario.banco}`, false);
    
    addRow('Instrucciones / Propósito del pago', 'TRANSFERENCIA INTERNACIONAL', true);
    addRow('', '', false);
    
    // Sección RESUMEN DE CUENTA
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RESUMEN DE CUENTA', 20, y);
    y += 15;
    
    addRow('Empresa', `${detallesTransferencia.emisor.nombre}`, true);
    addRow('Dirección', '2727 Ponce De Leon Blvd', false);
    
    addRow('', 'Coral Gables, FL 33134', true);
    addRow('Tipo de cuenta', 'Cuenta Corriente', false);
    
    addRow('', '', true);
    addRow('', '', false);
    
    // Footer con información de la operadora
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(
      'Operadora Falcon, S.A.P.I. de C.V., SOFOM, E.N.R. Campos Elíseos No. 403, Int. Piso 7, Polanco, Polanco II Secc, Miguel Hidalgo, C.P. 11530',
      20,
      pageHeight - 20
    );
    doc.text('Ciudad de México, México. +52 55 5351 8313.', 20, pageHeight - 15);
    
    // Guardar el PDF
    doc.save(`comprobante-transferencia-${detallesTransferencia.numeroReferencia}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg mx-auto bg-white shadow-xl rounded-3xl relative max-h-[90vh] overflow-y-auto">
        {/* Botón X para cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          data-testid="button-close-detalle"
        >
          <XIcon className="w-6 h-6" />
        </button>

        <CardContent className="p-8 pt-12">
          {/* Monto y estado */}
          <div className="text-center mb-8">
            <div className={`text-4xl font-bold mb-2 ${
              movimiento.monto < 0 ? 'text-gray-900' : 'text-green-600'
            }`}>
              {movimiento.monto < 0 ? '- ' : '+ '}$ {montoFormateado}
            </div>
            <div className="flex items-center justify-center gap-2">
              {esCompleta ? (
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Completada</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full whitespace-nowrap">
                  <ClockIcon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">En proceso</span>
                </div>
              )}
            </div>
          </div>

          {/* Detalles del envío */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                {movimiento.tipo === 'recibo' ? 'Recibiste dinero de:' : 'Enviaste dinero a:'}
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Alias o nombre</span>
                  <span className="text-sm font-medium text-right">
                    {movimiento.tipo === 'recibo' 
                      ? detallesTransferencia.emisor.nombre 
                      : detallesTransferencia.destinatario.nombre}
                  </span>
                </div>
                
                {movimiento.tipo === 'recibo' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">RFC</span>
                      <span className="text-sm font-medium">{detallesTransferencia.emisor.rfc}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Banco emisor</span>
                      <span className="text-sm font-medium text-right">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                            A
                          </div>
                          {detallesTransferencia.emisor.banco}
                        </div>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">CLABE</span>
                      <span className="text-sm font-medium">{detallesTransferencia.emisor.clabe}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Información de la transferencia */}
            <div className="border-t pt-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Concepto</span>
                  <span className="text-sm font-medium">{movimiento.concepto || 'Envío internacional'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Número de referencia</span>
                  <span className="text-sm font-medium">{detallesTransferencia.numeroReferencia}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Clave de rastreo</span>
                  <span className="text-sm font-medium">{detallesTransferencia.claveRastreo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Folio interno</span>
                  <span className="text-sm font-medium">{detallesTransferencia.folioInterno}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fecha</span>
                  <span className="text-sm font-medium">{fechaCompleta}</span>
                </div>
              </div>
            </div>

            {/* Banco receptor (solo para envíos) */}
            {movimiento.tipo === 'envio' && (
              <div className="border-t pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Banco receptor</span>
                    <span className="text-sm font-medium text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                          S
                        </div>
                        {detallesTransferencia.destinatario.banco}
                      </div>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">CLABE</span>
                    <span className="text-sm font-medium">{detallesTransferencia.destinatario.clabe}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 mt-8 pt-6 border-t">
            <Button
              variant="outline"
              className="flex-1 text-[#555EEE] border-[#555EEE] hover:bg-[#555EEE]/5"
              onClick={() => window.open('mailto:soporte@xepelin.com?subject=Consulta sobre transferencia ' + detallesTransferencia.numeroReferencia)}
            >
              ¿Necesitas ayuda?
            </Button>
            <Button
              onClick={handleDescargarComprobante}
              className="flex-1 bg-[#555EEE] hover:bg-[#555EEE]/90 text-white"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Descargar comprobante
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
