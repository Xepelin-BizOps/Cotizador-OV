import { NextRequest, NextResponse } from "next/server";
import { uploadLogoToS3 } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: "No se proporcionó archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "Solo se permiten archivos de imagen" },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "El archivo no debe superar los 2MB" },
        { status: 400 }
      );
    }

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'png';
    const fileName = `logo-${timestamp}.${extension}`;

    // Subir a S3
    const result = await uploadLogoToS3(
      buffer,
      fileName,
      file.type
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || "Error al subir el logo" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
    });

  } catch (error) {
    console.error("Error en upload-logo:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
