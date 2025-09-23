"use server";

import { editProductSchema, productSchema } from "@/schemas/product/product.schema";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { CreateProductDto, EditProductDto } from "@/schemas/product/product.dto";
import { Prisma } from "@prisma/client";
import type { ResProductList } from "./product-types";
import { TabName } from "@/app/constants/optionsSelects";
import { verifyToken } from "@/app/(sections)/auth/_fetures/action";

/**
 * Lista de productos paginada y filtrada por texto.
 * SIEMPRE restringida por companyId del usuario autenticado.
 */
export async function getProductsList(
  search?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ResProductList> {
  try {
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
        data: [],
        total: 0,
      };
    }

    // where siempre limitado a la empresa del usuario
    const where: Prisma.ProductWhereInput = {
      companyId: user.companyId,
      OR: search && search.trim()
        ? [
            { name: { contains: search, mode: "insensitive" as const } },
            { sku: { contains: search, mode: "insensitive" as const } },
          ]
        : undefined,
    };

    const total = await prisma.product.count({ where });

    const data = await prisma.product.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where,
      include: { currency: true, category: true },
      orderBy: { id: "desc" },
    });

    // Convertir Decimal a number para el cliente
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

/**
 * Crea un producto.
 * companyId SIEMPRE viene del contexto (token/cookie), nunca del formulario.
 * Para evitar el error de validación (companyId >= 1), inyectamos el companyId del usuario ANTES de validar.
 */
export const createProduct = async (data: CreateProductDto) => {
  try {
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
      };
    }

    // Validamos con el companyId del token, ignorando el del formulario si vino
    const toValidate = { ...data, companyId: user.companyId };
    const parsed = productSchema.safeParse(toValidate);

    if (!parsed.success) {
      return {
        success: false,
        message: "Datos inválidos",
        errors: parsed.error.message,
      };
    }

    const dto = parsed.data;

    await prisma.product.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        // Prisma.Decimal acepta number; hacemos cast explícito
        price: Number(dto.price),
        shortDescription: dto.shortDescription,
        longDescription: dto.longDescription ?? null,
        type: dto.type,
        currencyId: Number(dto.currencyId),
        categoryId: Number(dto.categoryId),
        // fuerza empresa desde sesión
        companyId: user.companyId,
      },
    });

    // Revalidar la ruta que muestra los productos, así actualiza la lista
    revalidatePath(`/home?tab=${TabName.product}`);

    return {
      success: true,
      message: "Producto creado correctamente",
    };
  } catch (error) {
    // console.error('Error al crear producto:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
};

/**
 * Edita producto por id.
 * No permitimos cambiar companyId desde el formulario.
 * (Opcionalmente, podrías comprobar que el producto pertenezca al companyId de sesión.)
 */
export const editProduct = async (dataUpdate: EditProductDto, id: number) => {
  try {
    const user = await verifyToken();
    if (!user?.companyId) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
      };
    }

    const parsed = editProductSchema.safeParse(dataUpdate);
    if (!parsed.success) {
      throw new Error("Datos inválidos");
    }

    const dto = parsed.data;

    // (Opcional) Validar propiedad del producto antes de actualizar
    // const current = await prisma.product.findUnique({ where: { id } });
    // if (!current || current.companyId !== user.companyId) {
    //   return { success: false, message: "No autorizado" };
    // }

    // Ejecutar el update en Prisma (sin tocar companyId)
    await prisma.product.update({
      where: { id },
      data: {
        sku: dto.sku,
        name: dto.name,
        price: Number(dto.price),
        shortDescription: dto.shortDescription,
        longDescription: dto.longDescription ?? null,
        type: dto.type,
        currencyId: Number(dto.currencyId),
        categoryId: Number(dto.categoryId),
        // NO escribimos companyId aquí para evitar reasignaciones indeseadas
      },
      include: {
        currency: true,
        category: true,
        company: true,
      },
    });

    // Revalidar la ruta que muestra los productos, asi actuliza los datos
    revalidatePath(`/home?tab=${TabName.product}`);

    return {
      success: true,
      message: "Producto editado correctamente",
    };
  } catch (error) {
    console.error("Error al editar producto:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
};

export async function deleteProduct(id: number) {
  try {
    const user = await verifyToken();

    if (!user) {
      return {
        success: false,
        message: "No autorizado - token no encontrado. Válida tu sesión nuevamente",
      };
    }

    await prisma.product.delete({
      where: { id },
    });

    // Revalidar la página donde se muestra la lista
    revalidatePath(`/home?tab=${TabName.product}`);

    return { success: true, message: "Producto eliminado" };
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo eliminar el producto",
    };
  }
}
