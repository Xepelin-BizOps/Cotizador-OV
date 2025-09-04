import { EditProductDto } from "@/schemas/product/product.dto";
import type { PlainProductWithRelations } from "./product-types";
import { ProductType } from "@prisma/client";


export const mapProductToFormValues = (product: PlainProductWithRelations): EditProductDto => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    price: Number(product.price),
    currencyId: product.currency.id.toString(),
    categoryId: product.category.id.toString(),
    type: product.type as ProductType,
    shortDescription: product.shortDescription,
    longDescription: product.longDescription ?? "",
    companyId: product.companyId
});