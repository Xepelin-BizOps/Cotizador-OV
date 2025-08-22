"use server";
import { prisma } from "@/lib/prisma";
import { EditCompanyDto } from "@/schemas/company/company.dto";
import { editComapanySchema } from "@/schemas/company/company.schema";
import type { companyById, ResponseDetails } from "./company-types";



export const getCompanyById = async (id: number): Promise<ResponseDetails> => {
    try {

        const response = await prisma.company.findUnique({
            where: {
                id
            },
        })

        return {
            success: true,
            data: response as companyById,
            message: "Compañía obtenida"
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error de servidor",
            data: null,
        };
    }
}


export const editCompany = async (dataUpdate: EditCompanyDto, companyId: number) => {
    try {
        const parsed = editComapanySchema.safeParse(dataUpdate)

        if (!parsed.success) {
            throw new Error("Datos inválidos")
        }

        const data = parsed.data

        // Ejecutar el update en Prisma
        await prisma.company.update({
            where: { id: companyId },
            data: data,
        })


        return {
            success: true,
            message: 'Compañia editada correctamente',
        }
    } catch (error) {
        console.error('Error al editar compañia:', error)
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error interno del servidor',
        }
    }

}