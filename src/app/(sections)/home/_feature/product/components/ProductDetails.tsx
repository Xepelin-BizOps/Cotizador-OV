import { Button } from "antd";
import ProductForm from "./ProductForm";
import { EditFilled } from "@ant-design/icons";
import type { PlainProductWithRelations } from "../product-types";
import { productTypesMap } from "@/app/constants/optionsSelects";
import { calculateIVA } from "@/utils/functions";
import { mapProductToFormValues } from "../product-mappers";

interface Props {
  data: PlainProductWithRelations;
  handleOpenModal: (title: string, content: React.ReactNode) => void;
  onCloseModal: () => void;
}

export function ProductDetails({ data, handleOpenModal, onCloseModal }: Props) {
  return (
    <>
      <div className="space-y-6 mt-3 shadow-sm rounded-lg p-4 border border-accent-light-hover">
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Tipo</p>
            <p className="font-medium text-lg">
              {productTypesMap[(data.type as "PRODUCT") || "SERVICE"]}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nombre</p>
            <p className="font-medium text-lg">{data.name}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">Descripción corta</p>
          <p className="text-base">{data.shortDescription}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Descripción larga</p>
          <p className="text-base">
            {data.longDescription?.trim() || "No tiene"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Categoría</p>
          <p className="text-base">{data.category.name}</p>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Moneda</p>
            <p className="text-base font-semibold">{data.currency.value}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Precio</p>
            <p className="text-base font-semibold">${data.price}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Con IVA incluido</p>
            <p className="text-base font-semibold">
              {calculateIVA(data.price, "MXN")}
            </p>
          </div>
        </div>
      </div>
      <Button
        type="primary"
        className="mt-3"
        onClick={() =>
          handleOpenModal(
            "Editar ítem",
            <ProductForm
              isEdit
              dataEdit={mapProductToFormValues(data)}
              onCloseModal={onCloseModal}
            />
          )
        }
        icon={<EditFilled />}
      >
        Editar
      </Button>
    </>
  );
}
