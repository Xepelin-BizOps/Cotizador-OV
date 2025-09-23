import { NextRequest, NextResponse } from "next/server";
import { uploadPdfToS3 } from "@/lib/s3";
import { getQuoteById } from "@/app/(sections)/home/_feature/quote/actions";
import jsPDF from "jspdf";

export async function POST(request: NextRequest) {
  try {
    const { quoteId } = await request.json();
    
    if (!quoteId) {
      return NextResponse.json(
        { success: false, message: "ID de cotización requerido" },
        { status: 400 }
      );
    }

    // Obtener datos de la cotización
    const quoteResult = await getQuoteById(quoteId);
    
    if (!quoteResult.success || !quoteResult.data) {
      return NextResponse.json(
        { success: false, message: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    const quote = quoteResult.data;
    
    // Generar PDF usando jsPDF
    const pdfBuffer = await generatePdfWithJsPDF(quote);
    
    // Generar nombre único para el archivo
    const fileName = `cotizacion-${quoteId}-${Date.now()}.pdf`;
    
    // Subir a S3
    const uploadResult = await uploadPdfToS3(pdfBuffer, fileName);
    
    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, message: uploadResult.error || "Error al subir PDF" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pdfKey: uploadResult.key,
      pdfUrl: uploadResult.url,
    });

  } catch (error) {
    console.error("Error en generate-quote-pdf:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

async function generatePdfWithJsPDF(quote: {
  id: number;
  quotationDate: Date;
  status: string;
  totalAmount: number;
  note?: string | null;
  company: {
    companyName: string;
    address?: string | null;
    email: string;
    phone?: string | null;
    logoUrl?: string | null;
  };
  client?: {
    fullName?: string | null;
    rfc?: string;
    billingEmail?: string | null;
  } | null;
  items: Array<{
    productName: string;
    sku?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}): Promise<Buffer> {
  const doc = new jsPDF();
  
  // Configuración de fuente
  doc.setFont("helvetica");
  
  let yPosition = 20;
  
  // Header con logo y datos de la empresa
  if (quote.company.logoUrl) {
    // Nota: En un entorno real, necesitarías descargar la imagen primero
    // Por ahora, solo agregamos el texto
    doc.setFontSize(16);
    doc.text(quote.company.companyName, 20, yPosition);
  } else {
    doc.setFontSize(16);
    doc.text(quote.company.companyName, 20, yPosition);
  }
  
  yPosition += 10;
  
  // Información de contacto
  doc.setFontSize(10);
  if (quote.company.address) {
    doc.text(quote.company.address, 20, yPosition);
    yPosition += 5;
  }
  doc.text(`Email: ${quote.company.email}`, 20, yPosition);
  yPosition += 5;
  if (quote.company.phone) {
    doc.text(`Tel: ${quote.company.phone}`, 20, yPosition);
    yPosition += 5;
  }
  
  yPosition += 10;
  
  // Información de la cotización (lado derecho)
  doc.setFontSize(14);
  doc.text("COTIZACIÓN", 150, 20);
  doc.setFontSize(10);
  doc.text(`ID: ${quote.id}`, 150, 30);
  doc.text(`Fecha: ${new Date(quote.quotationDate).toLocaleDateString()}`, 150, 35);
  doc.text(`Estado: ${quote.status}`, 150, 40);
  
  yPosition += 20;
  
  // Información del cliente
  if (quote.client) {
    doc.setFontSize(12);
    doc.text("Cliente:", 20, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.text(`Nombre: ${quote.client.fullName || 'N/A'}`, 20, yPosition);
    yPosition += 5;
    doc.text(`RFC: ${quote.client.rfc || 'N/A'}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Email: ${quote.client.billingEmail || 'N/A'}`, 20, yPosition);
    yPosition += 10;
  }
  
  // Tabla de productos
  doc.setFontSize(12);
  doc.text("Productos:", 20, yPosition);
  yPosition += 10;
  
  // Headers de la tabla
  doc.setFontSize(10);
  doc.text("Producto", 20, yPosition);
  doc.text("SKU", 80, yPosition);
  doc.text("Cant.", 120, yPosition);
  doc.text("Precio", 140, yPosition);
  doc.text("Total", 170, yPosition);
  
  yPosition += 5;
  
  // Línea separadora
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 5;
  
  // Items de la cotización
  quote.items.forEach((item) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(item.productName.substring(0, 30), 20, yPosition);
    doc.text(item.sku || '', 80, yPosition);
    doc.text(item.quantity.toString(), 120, yPosition);
    doc.text(`$${item.unitPrice.toFixed(2)}`, 140, yPosition);
    doc.text(`$${item.totalPrice.toFixed(2)}`, 170, yPosition);
    
    yPosition += 6;
  });
  
  yPosition += 10;
  
  // Total
  doc.setFontSize(12);
  doc.text(`Total: $${quote.totalAmount.toFixed(2)}`, 150, yPosition);
  
  // Notas
  if (quote.note) {
    yPosition += 15;
    doc.setFontSize(10);
    doc.text("Notas:", 20, yPosition);
    yPosition += 5;
    doc.text(quote.note, 20, yPosition);
  }
  
  // Convertir a Buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}
