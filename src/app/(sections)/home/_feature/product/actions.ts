"use server";
import { editProductSchema, productSchema } from "@/schemas/product/product.schema"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache";
import type { CreateProductDto, EditProductDto } from "@/schemas/product/product.dto";
import { Prisma } from "@prisma/client";
import type { ResProductList } from "./product-types";
import { TabName } from "@/app/constants/optionsSelects";
import { verifyToken } from "@/app/(sections)/auth/_fetures/action";


export async function getProductsList(
    search?: string,
    page: number = 1,
    pageSize: number = 10
): Promise<ResProductList> {
    try {

        // validar que tenga un token para poder traer los datos
        const user = await verifyToken();

        if (!user) {
            return {
                success: false,
                message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
                data: [],
                total: 0
            };
        }

        let where: Prisma.ProductWhereInput = {};

        if (search && search.trim()) {
            where = {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { sku: { contains: search, mode: "insensitive" } },
                ],
            };
        }



        const total = await prisma.product.count({ where });

        const data = await prisma.product.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            where,
            include: { currency: true, category: true },
        });

        // convertí los valor decimal a number 
        const plainData = data.map((product) => ({
            ...product,
            price: product.price.toNumber(),
        }));

        return { success: true, total, data: plainData, message: "Productos obtenenidos correctamente" };
    } catch (error) {
        console.error("Error al obtener productos:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error desconocido",
            data: [],
            total: 0,
        };
    }
}


export const createProduct = async (data: CreateProductDto) => {
    try {

        // validar que tenga un token para poder traer los datos
        const user = await verifyToken();

        if (!user) {
            return {
                success: false,
                message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
            };
        }

        const parsed = productSchema.safeParse(data)

        if (!parsed.success) {
            return {
                success: false,
                message: 'Datos inválidos',
                errors: parsed.error.message,
            }
        }

        await prisma.product.create({
            data: {
                ...parsed.data,
                price: Number(parsed.data.price),
                currencyId: Number(parsed.data.currencyId),
                categoryId: Number(parsed.data.categoryId),
                companyId: Number(parsed.data.companyId),
            },
        })


        // Revalidar la ruta que muestra los productos, asi actuliza la lista
        revalidatePath(`/home?tab=${TabName.product}`)

        return {
            success: true,
            message: 'Producto creado correctamente',
        }
    } catch (error) {
        // console.error('Error al crear producto:', error)
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error interno del servidor',
        }
    }
}

export const editProduct = async (dataUpdate: EditProductDto, id: number) => {
    try {

        // validar que tenga un token para poder traer los datos
        const user = await verifyToken();

        if (!user) {
            return {
                success: false,
                message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
            };
        }

        const parsed = editProductSchema.safeParse(dataUpdate)

        if (!parsed.success) {
            throw new Error("Datos inválidos")
        }

        const data = parsed.data

        // Ejecutar el update en Prisma
        await prisma.product.update({
            where: { id },
            data: {
                sku: data.sku,
                name: data.name,
                price: Number(data.price),
                shortDescription: data.shortDescription,
                longDescription: data.longDescription,
                type: data.type,
                currencyId: Number(data.currencyId),
                categoryId: Number(data.categoryId),
                companyId: Number(data.companyId)
            },
            include: {
                currency: true,
                category: true,
                company: true
            },
        })

        // Revalidar la ruta que muestra los productos, asi actuliza los datos
        revalidatePath(`/home?tab=${TabName.product}`)

        return {
            success: true,
            message: 'Producto editado correctamente',
        }
    } catch (error) {
        console.error('Error al crear producto:', error)
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error interno del servidor',
        }
    }
}


export async function deleteProduct(id: number) {
    try {

        // validar que tenga un token para poder traer los datos
        const user = await verifyToken();

        if (!user) {
            return {
                success: false,
                message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
            };
        }

        await prisma.product.delete({
            where: { id },
        })

        //Revalidar la página donde se muestra la lista
        revalidatePath(`/home?tab=${TabName.product}`)

        return { success: true, message: "Producto eliminado" }
    } catch (error) {
        console.error("Error al eliminar producto:", error)
        return { success: false, message: error instanceof Error ? error.message : "No se pudo eliminar el producto" }
    }
}