"use client";
import TypedInputNumber from "antd/es/input-number";
import { Form, Input, Button, Select } from "antd";
import TextArea from "antd/es/input/TextArea";
import { SaveOutlined } from "@ant-design/icons";
import useToast from "@/app/hooks/useToast";
import { useEffect, useState } from "react";
import { productTypes } from "@/app/constants/optionsSelects";
import { getCategories, getCurrenciesCatalog } from "../../../_actions";
import { type OptionsSelect } from "@/utils/transformToSelectOptions";
import { requiredRule } from "@/utils/formRules";
import { createProduct, editProduct } from "../actions";
import type {
  CreateProductDto,
  EditProductDto,
} from "@/schemas/product/product.dto";
import { useAuthContext } from "@/app/hooks/useAuthContext";

interface Props {
  onCloseModal: () => void;
  isEdit?: boolean;
  dataEdit?: EditProductDto;
}

export default function ProductForm({
  onCloseModal,
  dataEdit,
  isEdit = false,
}: Props) {
  const [form] = Form.useForm();

  const authContext = useAuthContext();

  const [categories, setCategories] =
    useState<{ label: string; value: string }[]>();
  const [optionsCurrencies, setOptionsCurrencies] = useState<
    OptionsSelect[] | []
  >([]);
  const [isLoadingCat, setIsLoadingCat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // GET Categories y currencies
  useEffect(() => {
    (async () => {
      setIsLoadingCat(true);

      const categories = await getCategories();
      setCategories(categories);

      const currencies = await getCurrenciesCatalog();
      setOptionsCurrencies(currencies);

      setIsLoadingCat(false);
    })();
  }, []);

  // Seteo la data para el edit cuando existe
  useEffect(() => {
    if (isEdit && dataEdit) {
      form.setFieldsValue({
        ...dataEdit,
        categoryId: String(dataEdit.categoryId),
        currencyId: String(dataEdit.currencyId),
      });
    }
  }, [dataEdit, isEdit, form]);

  const { contextHolder, showToast } = useToast();

  const onSubmitData = async (dataForm: CreateProductDto | EditProductDto) => {
    setIsLoading(true);

    const response =
      isEdit && dataEdit
        ? await editProduct(dataForm as EditProductDto, dataEdit.id!)
        : await createProduct(dataForm);

    showToast({
      type: response.success ? "success" : "error",
      message: response.message,
    });

    if (response.success) form.resetFields();
    setIsLoading(false);
    if (response.success) onCloseModal();
  };

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        name="login"
        layout="vertical"
        onFinish={onSubmitData}
        initialValues={{
          companyId: authContext.value.companyId,
        }}
      >
        {/* Campo oculto */}
        <Form.Item name="companyId" hidden>
          <Input type="hidden" />
        </Form.Item>
        <div className="shadow-sm rounded-lg p-4 border border-accent-light-hover my-3">
          <p className="mb-3 font-semibold text-lg">Información del ítem</p>
          <div className="flex flex-col items-center md:flex-row md:justify-between md:gap-4">
            <Form.Item
              label="ID/SKU"
              name="sku"
              rules={[requiredRule]}
              className="w-full"
              normalize={(value: string) => value?.toUpperCase()}
            >
              <Input type="text" placeholder="SKU1234" />
            </Form.Item>
            <Form.Item
              label="Nombre"
              name="name"
              rules={[requiredRule]}
              className="w-full"
            >
              <Input placeholder="Nombre del ítem" />
            </Form.Item>

            <Form.Item
              label="Precio"
              name="price"
              rules={[requiredRule]}
              className="w-full"
            >
              <TypedInputNumber
                min={0}
                step={0.01}
                style={{ width: "100%" }}
                formatter={(value) => `$ ${value}`}
                placeholder="0,00"
              />
            </Form.Item>
          </div>

          <div className="flex flex-col items-center md:flex-row md:items-start md:justify-between md:gap-4 mt-5">
            <Form.Item
              label="Categoría"
              name="categoryId"
              rules={[requiredRule]}
              className="w-full"
            >
              <Select
                placeholder="Seleccionar categoría"
                loading={isLoadingCat}
                options={categories}
              />
            </Form.Item>

            <Form.Item
              label="Tipo"
              name="type"
              rules={[requiredRule]}
              className="w-full"
            >
              <Select placeholder="Seleccionar tipo" options={productTypes} />
            </Form.Item>

            <Form.Item
              label="Tipo de moneda"
              name="currencyId"
              rules={[requiredRule]}
              className="w-full"
            >
              <Select
                placeholder="Seleccione la moneda"
                loading={isLoadingCat}
                options={optionsCurrencies}
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Descripción corta"
            name="shortDescription"
            rules={[
              requiredRule,
              { max: 255, message: "Máximo 255 caracteres" },
            ]}
            className="w-full"
          >
            <TextArea rows={2} placeholder="Descripción breve del ítem" />
          </Form.Item>

          <Form.Item label="Descripción larga" name="longDescription">
            <TextArea rows={4} placeholder="Descripción detallada del ítem" />
          </Form.Item>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          icon={<SaveOutlined />}
        >
          {isEdit ? "Guardar cambios" : "Agregar ítem"}
        </Button>
      </Form>
    </>
  );
}
