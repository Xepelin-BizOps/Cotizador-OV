import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// Configuración del cliente S3
const s3Client = new S3Client({
  region: "us-east-1", // Ajusta según tu región
  // No necesitamos credenciales explícitas ya que se usan las de IAM
});

const BUCKET_NAME = "client-application-mx-dev-prototypes-files";

export interface S3UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface S3DownloadResult {
  success: boolean;
  data?: Buffer;
  error?: string;
}

/**
 * Sube un archivo PDF a S3
 */
export async function uploadPdfToS3(
  file: Buffer,
  fileName: string,
  contentType: string = "application/pdf"
): Promise<S3UploadResult> {
  try {
    const key = `quotes/${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ContentDisposition: `attachment; filename="${fileName}"`,
    });

    await s3Client.send(command);

    const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

    return {
      success: true,
      url,
      key,
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al subir a S3",
    };
  }
}

/**
 * Descarga un archivo PDF desde S3
 */
export async function downloadPdfFromS3(key: string): Promise<S3DownloadResult> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return {
        success: false,
        error: "No se encontró el archivo en S3",
      };
    }

    // Convertir el stream a Buffer
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const data = Buffer.concat(chunks);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error downloading from S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al descargar de S3",
    };
  }
}

/**
 * Sube un logo de empresa a S3
 */
export async function uploadLogoToS3(
  file: Buffer,
  fileName: string,
  contentType: string = "image/png"
): Promise<S3UploadResult> {
  try {
    const key = `company-logos/${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ContentDisposition: `inline; filename="${fileName}"`,
    });

    await s3Client.send(command);

    const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

    return {
      success: true,
      url,
      key,
    };
  } catch (error) {
    console.error("Error uploading logo to S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al subir logo a S3",
    };
  }
}

/**
 * Genera una URL firmada para acceso directo al PDF
 */
export function getPdfUrl(key: string): string {
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
}

/**
 * Genera una URL para el logo de empresa
 */
export function getLogoUrl(key: string): string {
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
}
