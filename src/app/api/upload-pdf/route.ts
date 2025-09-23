import { NextRequest, NextResponse } from "next/server";
import { uploadPdfToS3 } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const { pdfBlob, fileName } = await request.json();
    
    if (!pdfBlob || !fileName) {
      return NextResponse.json(
        { success: false, message: "PDF blob y fileName son requeridos" },
        { status: 400 }
      );
    }

    // Convertir el blob base64 a Buffer
    const pdfBuffer = Buffer.from(pdfBlob, 'base64');
    
    // Subir a S3 desde el servidor
    const s3Key = await uploadPdfToS3(pdfBuffer, fileName);
    
    return NextResponse.json({
      success: true,
      s3Key,
      message: "PDF subido exitosamente a S3"
    });
    
  } catch (error) {
    console.error("Error uploading PDF to S3:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Error al subir PDF a S3",
        error: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}
