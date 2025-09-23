"use client";
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const useHtmlToPdf = () => {
  const refHtml = useRef<HTMLDivElement>(null);

  const downloadPdf = async (filename: string = "document.pdf"): Promise<string | null> => {
    if (!refHtml.current) {
      return "No se encontró el elemento para convertir a PDF";
    }

    try {
      const canvas = await html2canvas(refHtml.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generar el PDF como base64
      const pdfBase64 = pdf.output("datauristring").split(",")[1];
      
      // Subir a S3 usando la API del servidor
      const response = await fetch("/api/upload-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfBlob: pdfBase64,
          fileName: filename,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // También descargar localmente
        pdf.save(filename);
        return null; // Success
      } else {
        return result.message || "Error al subir el PDF a S3";
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      return error instanceof Error ? error.message : "Error desconocido al generar PDF";
    }
  };

  const generatePdfForS3 = async (filename: string = "document.pdf"): Promise<{ success: boolean; key?: string; error?: string }> => {
    if (!refHtml.current) {
      return { success: false, error: "No se encontró el elemento para convertir a PDF" };
    }

    try {
      const canvas = await html2canvas(refHtml.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generar el PDF como base64
      const pdfBase64 = pdf.output("datauristring").split(",")[1];
      
      // Subir a S3 usando la API del servidor
      const response = await fetch("/api/upload-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfBlob: pdfBase64,
          fileName: filename,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        return { success: true, key: result.s3Key };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Error desconocido al generar PDF" 
      };
    }
  };

  return { downloadPdf, generatePdfForS3, refHtml };
};
