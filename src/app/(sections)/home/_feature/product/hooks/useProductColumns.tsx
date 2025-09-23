import type { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Space, Tooltip } from "antd";
import { ToastOptions } from "@/app/hooks/useToast";
import type { PlainProductWithRelations } from "../product-types";
import { ProductDetails } from "../components/ProductDetails";
import ProductForm from "../components/ProductForm";
import { useState } from "react";
import { deleteProduct } from "../actions";
import { useRouter } from "next/navigation";
import { TabName } from "@/app/constants/optionsSelects";
import { mapProductToFormValues } from "../product-mappers";

interface Props {
  handleOpenModal: (title: string, content: React.ReactNode) => void;
  handleCloseModal: () => void;
  showToast: (options: ToastOptions) => void;
}

export default function useProductColumns({
  handleOpenModal,
  handleCloseModal,
  showToast,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDeleteProduct = async (id: number) => {
    setIsLoading(true);
    const response = await deleteProduct(id);

    showToast({
      type: response.success ? "success" : "error",
      message: response.message,
    });

    router.replace(`/home?tab=${TabName.product}`);
    setIsLoading(false);
  };

  const columns: ColumnsType<PlainProductWithRelations> = [
    {
      title: "ID / SKU",
      dataIndex: "sku",
      key: "id",
    },
    {
      title: "Nombre",
      dataIndex: "name",
      key: "nombre",
    },
    {
      title: "Descripción",
      dataIndex: "shortDescription",
      key: "descripcion",
    },
    {
      title: "Precio",
      dataIndex: "price",
      key: "precio",
      render: (precio: string, record) =>
        ` $${precio} - ${record.currency.value}`,
    },
    {
      title: "Categoría",
      dataIndex: "category",
      key: "categoria",
      render: (record) => record.name,
    },
    {
      title: "Acciones",
      key: "action",
      render: (_, data: PlainProductWithRelations) => (
        <Space size="middle">
          <Tooltip title="Ver cotización">
            <Button
              color="primary"
              variant="outlined"
              icon={<EyeOutlined />}
              onClick={() =>
                handleOpenModal(
                  "Detalles del ítem",
                  <ProductDetails
                    data={data}
                    handleOpenModal={handleOpenModal}
                    onCloseModal={handleCloseModal}
                  />
                )
              }
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              color="primary"
              variant="outlined"
              icon={<EditOutlined />}
              onClick={() =>
                handleOpenModal(
                  "Editar ítem",
                  <ProductForm
                    isEdit={true}
                    dataEdit={mapProductToFormValues(data)}
                    onCloseModal={handleCloseModal}
                  />
                )
              }
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Popconfirm
              title="Eliminar"
              description="¿Estás seguro de que deseas eliminar este producto?"
              onConfirm={() => handleDeleteProduct(data.id)}
              cancelText="Cancelar"
              okText="Eliminar"
              okButtonProps={{
                disabled: isLoading,
                loading: isLoading,
              }}
            >
              <Button
                color="primary"
                variant="outlined"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return { columns };
}
