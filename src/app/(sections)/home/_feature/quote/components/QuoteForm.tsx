import React, { useEffect, useState } from "react";
import { Button, DatePicker, Form, Input, Select, Table } from "antd";
import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { requiredRule } from "@/utils/formRules";
import TextArea from "antd/es/input/TextArea";
import { QuotationStatus } from "@prisma/client";
import useToast from "@/app/hooks/useToast";
import { useProductItemColumns } from "../hooks/useProductItemColumns";
import { calculateTotals } from "@/utils/functions";
import type {
  CreateQuoteDto,
  CreateQuoteItemDto,
  EditQuoteDto,
  EditQuoteItemDto,
} from "@/schemas/quote/quote.dto";
import { createQuote, editQuote } from "../actions";
import dayjs from "dayjs";
import { quoteStatusOptions } from "@/app/constants/optionsSelects";
import { useAuthContext } from "@/app/hooks/useAuthContext";

interface Props {
  toggleForm: (type: "create" | "edit" | null, data?: EditQuoteDto) => void;
  isEdit: boolean;
  dataEdit?: EditQuoteDto;
  optionsProducts: { label: string; value: number }[];
  optionsClients: { label: string; value: number }[];
}

// tomar los dto que cree con zod (manejar create y edit) en un solo type
type QuoteItemStateType = CreateQuoteItemDto | EditQuoteItemDto;

export default function QuoteForm({
  isEdit,
  toggleForm,
  dataEdit,
  optionsProducts,
  optionsClients,
}: Props) {
  const authContext = useAuthContext();
  const [form] = Form.useForm<CreateQuoteDto>();
  const { showToast, contextHolder } = useToast();

  // <ProductItem[] | []>
  const [items, setItems] = useState<QuoteItemStateType[] | []>(
    dataEdit ? dataEdit.items : []
  );
  const [isLoading, setIsLoading] = useState(false);

  // Si llega la data setear para el edit
  useEffect(() => {
    if (isEdit && dataEdit) {
      const { items, ...rest } = dataEdit;

      // Si hay fecha, convertirla a dayjs
      const preparedValues = {
        ...rest,
        quotationDate: dayjs(rest.quotationDate),
        clientId: rest.clientId,
      };

      // saco los items y me quedo con lo otro nomas
      form.setFieldsValue(preparedValues);
    } else {
      form.resetFields();
    }
  }, [dataEdit, isEdit, form]);

  const addProduct = (productId: number) => {
    setItems((oldItems) => {
      const exists = oldItems.find((item) => item.productId === productId);

      if (exists) {
        // Sumar en 1 la cantidad
        return oldItems.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // lo buscamos a partir de su id
        const productFound = optionsProductsFormat.find(
          (product) => product.value === productId
        );

        if (!productFound) return oldItems;

        // Agregagamos el producto
        return [
          ...oldItems,
          {
            productName: productFound.name,
            productId: Number(productId),
            quantity: 1,
            unitPrice: Number(productFound.price),
          },
        ];
      }
    });
  };

  const updateItem = (
    productId: number,
    key: "quantity" | "unitPrice",
    value: number
  ) => {
    setItems((oldItems) =>
      oldItems.map((item) =>
        item.productId === productId ? { ...item, [key]: value } : item
      )
    );
  };

  const removeItem = (productId: number) => {
    setItems((oldItems) =>
      oldItems.filter((item) => item.productId !== productId)
    );
  };

  const productItemColumns = useProductItemColumns(updateItem, removeItem);

  // Funcion para calcular totales
  const { ivaAmount, subtotal, total } = calculateTotals(items, 16);

  // Render options Select
  const optionsProductsFormat = optionsProducts.map((product) => {
    const [name, sku, price] = (product.label as string).split(" - ");

    return {
      value: product.value, // Solo el ID como value
      label: (
        <div className="flex justify-between items-center">
          <div>
            <div className="font-semibold">{name}</div>
            <div className="text-xs text-gray-500">{sku}</div>
          </div>
          <div className="text-sm font-medium pr-2">${price}</div>
        </div>
      ),
      searchValue: `${name} ${sku}`, // campo se usa solo para la búsqueda
      price: price,
      name: name,
    };
  });

  const onSubmitData = async (dataForm: CreateQuoteDto | EditQuoteDto) => {
    setIsLoading(true);

    const dataSend: CreateQuoteDto = {
      ...dataForm,
      items: items, // Agregamos los items del state
      clientId: Number(dataForm.clientId),
    };

    const response =
      isEdit && dataEdit
        ? await editQuote(dataSend as EditQuoteDto, dataEdit.id!)
        : await createQuote(dataSend);

    showToast({
      type: response.success ? "success" : "error",
      message: response.message,
      onClose: () => response.success && toggleForm(null),
      duration: 1,
    });

    setIsLoading(false);
    if (response.success) form.resetFields();
  };

  return (
    <>
      {contextHolder}
      <div className="min-h-[60vh] p-4">
        <div className="flex justify-between items-start w-full mb-7">
          <h2 className="text-lg font-semibold ">Nueva cotización</h2>

          <Button
            icon={<CloseOutlined className="cursor-pointer" />}
            variant="outlined"
            color="primary"
            onClick={() => toggleForm(null, undefined)}
          >
            Cerrar
          </Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          className="mt-10"
          initialValues={{
            status: QuotationStatus.DRAFT,
            companyId: authContext.value.companyId,
          }}
          onFinish={onSubmitData}
        >
          <Form.Item name="status" hidden>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="companyId" hidden>
            <Input type="hidden" />
          </Form.Item>
          <div className="flex flex-col gap-10 md:flex-row md:overflow-x-auto  md:justify-start">
            <div className="w-full lg:w-[60%] xl:w-[70%]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-4">
                <Form.Item
                  label="Clientes"
                  name="clientId"
                  className="mb-3 w-full"
                  rules={[requiredRule]}
                >
                  <Select
                    placeholder="Selecciona un cliente"
                    options={optionsClients}
                    notFoundContent="No hay resultados."
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    allowClear
                  />
                </Form.Item>
                {isEdit && (
                  <Form.Item
                    label="Estado"
                    name="status"
                    className="mb-3 md:w-[28rem]"
                    rules={[requiredRule]}
                  >
                    <Select
                      placeholder={"Selecciona el estado"}
                      options={quoteStatusOptions}
                      notFoundContent="No hay resultados."
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      allowClear
                    />
                  </Form.Item>
                )}
                <Form.Item
                  label="Fecha"
                  name="quotationDate"
                  className="mb-3 md:w-[26rem]"
                  rules={[requiredRule]}
                >
                  <DatePicker
                    placeholder="Selecciona una fecha"
                    className="w-full"
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </div>

              <div className="flex flex-col">
                <Form.Item label="Productos" className="mb-3 w-full">
                  <Select
                    showSearch
                    placeholder="Selecciona los productos: Búsca por Nombre o SKU"
                    filterOption={(input, option) =>
                      typeof option?.searchValue === "string" &&
                      option.searchValue
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={optionsProductsFormat}
                    onSelect={(value) => {
                      addProduct(Number(value));
                    }}
                    value={null}
                  />
                </Form.Item>

                <div>
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">
                      Productos seleccionados
                    </h3>

                    <div className="border rounded-lg z-10 border-gray-200">
                      <Table
                        rowKey="productId"
                        className=" rounded-lg"
                        columns={productItemColumns}
                        dataSource={items}
                        pagination={false}
                        rowHoverable={false}
                        locale={{
                          emptyText: "No hay productos seleccionados todavía",
                        }}
                        scroll={{ x: "max-content" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:min-w-[18rem] lg:w-[40%] xl:w-[30%] border-l border-gray-200 bg-accent-light p-5 rounded-lg md:h-full">
              <h3 className="font-semibold text-gray-900 mb-4">
                Resumen Financiero
              </h3>
              <div className="flex flex-col gap-2 my-2">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Subtotal:</p>
                  <p className="font-medium">${subtotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">IVA (16%):</p>
                  <p className="font-medium">${ivaAmount.toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 my-2 pt-2">
                  <h3 className="font-semibold text-gray-900">Total:</h3>
                  <p className="font-bold text-lg text-gray-900">
                    ${total.toFixed(2)}
                  </p>
                </div>
              </div>

              <Form.Item label="Nota" name="note" className="mb-4 ">
                <TextArea
                  placeholder="Condiciones comerciales, terminos de pago, etc."
                  maxLength={300}
                  rows={3}
                />
              </Form.Item>

              <Button
                className="w-full"
                type="primary"
                htmlType="submit"
                loading={isLoading}
                icon={<SaveOutlined />}
              >
                {isEdit ? "Guardar cambios" : "Crear cotización"}
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </>
  );
}
