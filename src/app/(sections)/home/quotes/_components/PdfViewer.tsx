"use client";
import { useEffect, useState } from "react";
import { Spin, Alert, Button } from "antd";
import { DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import { downloadPdfFromS3, getPdfUrl } from "@/lib/s3";

interface Props {
  pdfKey: string;
  fileName?: string;
}

export default function PdfViewer({ pdfKey, fileName = "cotizacion.pdf" }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Intentar cargar directamente desde S3
        const directUrl = getPdfUrl(pdfKey);
        setPdfUrl(directUrl);
        setLoading(false);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError("Error al cargar el PDF");
        setLoading(false);
      }
    };

    if (pdfKey) {
      loadPdf();
    }
  }, [pdfKey]);

  const handleDownload = async () => {
    try {
      const result = await downloadPdfFromS3(pdfKey);
      
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Error downloading PDF:", result.error);
      }
    } catch (err) {
      console.error("Error downloading PDF:", err);
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
        <span className="ml-2">Cargando PDF...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold">Vista previa del PDF</h3>
        <div className="space-x-2">
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            type="primary"
          >
            Descargar
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
          >
            Imprimir
          </Button>
        </div>
      </div>
      
      <div className="w-full h-[600px] border rounded-lg overflow-hidden">
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            width="100%"
            height="100%"
            style={{ border: "none" }}
            title="PDF Viewer"
          />
        )}
      </div>
    </div>
  );
}
