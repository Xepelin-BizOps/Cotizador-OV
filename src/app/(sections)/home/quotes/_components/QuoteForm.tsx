"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Select,
  Switch,
  Table,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { requiredRule } from "@/utils/formRules";
import TextArea from "antd/es/input/TextArea";
import { QuotationStatus } from "@prisma/client";
import useToast from "@/app/hooks/useToast";
import type {
  CreateQuoteDto,
  CreateQuoteItemDto,
  EditQuoteDto,
  EditQuoteItemDto,
} from "@/schemas/quote/quote.dto";
import dayjs from "dayjs";
import {
  quotationTypeTaxRate,
  quoteStatusOptions,
  TabName,
} from "@/app/constants/optionsSelects";
import { useAuthContext } from "@/app/hooks/useAuthContext";
import { useProductItemColumns } from "../../_feature/quote/hooks/useProductItemColumns";
import { getCurrenciesCatalog } from "../../_actions";
import { createQuote, editQuote } from "../../_feature/quote/actions";
import { useRouter } from "next/navigation";
import PreviewPrint from "./PreviewPrint";
import { getClientById } from "../../_feature/client/actions";
import { getCompanyById } from "../../_feature/company/actions";
import type { companyById } from "../../_feature/company/company-types";
import { useWatch } from "rc-field-form";
import debounce from "lodash.debounce";
import { useFetchById } from "@/app/hooks/useFetchById";
import { useCompanyCountry } from "@/app/hooks/useCompanyCountry";
import { useUFValue } from "@/app/hooks/useUFValue";

interface Props {
  isEdit: boolean;
  dataEdit?: EditQuoteDto;
  optionsProducts: { label: string; value: number }[];
  optionsClients: { label: string; value: number }[];
}

// tomar los dto que cree con zod (manejar create y edit) en un solo type
type QuoteItemStateType = CreateQuoteItemDto | EditQuoteItemDto;

export default function QuoteForm({
  isEdit,
  dataEdit,
  optionsProducts,
  optionsClients,
}: Props) {
  const [form] = Form.useForm<CreateQuoteDto | EditQuoteDto>();

  const router = useRouter();
  const authContext = useAuthContext();
  const { showToast, contextHolder } = useToast();
  
  // Hooks para país e impuestos
  const { countryInfo } = useCompanyCountry();
  const { ufValue, loading: ufLoading, refetch: refetchUF } = useUFValue();

  const [items, setItems] = useState<QuoteItemStateType[] | []>(
    dataEdit ? dataEdit.items : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [optionsCurrencies, setOptionsCurrencies] = useState<
    { label: string; value: string }[] | []
  >([]);
  const [isLoadingCat, setIsLoadingCat] = useState(false);
  
  // Estados para los nuevos selectores
  const [taxType, setTaxType] = useState<"WITH_IVA" | "WITHOUT_IVA">("WITHOUT_IVA");
  const [currencyType, setCurrencyType] = useState<"CLP" | "UF" | "USD">("CLP");
  const [customUFValue, setCustomUFValue] = useState<number | null>(null);
  // States data PreviewPrint
  const [formValues, setFormValues] = useState<Partial<CreateQuoteDto>>({});
  const [visible, setVisible] = useState({
    serviceDescription: false,
    termsOfPayment: false,
    valGuarantees: false,
    paymentMethods: false,
    exclusions: false,
    tyc: false,
    additionalInfo: false,
    taxRate: false,
  });

  // GET Categories y currencies
  useEffect(() => {
    (async () => {
      setIsLoadingCat(true);

      const currencies = await getCurrenciesCatalog();
      setOptionsCurrencies(currencies.map(c => ({ ...c, value: String(c.value) })));

      setIsLoadingCat(false);
    })();
  }, []);

  // Cargar valor de UF cuando se seleccione UF y sea Chile
  useEffect(() => {
    if (countryInfo?.supportsUF && currencyType === "UF" && !ufValue) {
      refetchUF();
    }
  }, [countryInfo?.supportsUF, currencyType, ufValue, refetchUF]);

  // Función debounced que actualiza los campos recibidos con calback. todo eso para evitar delay al escribir
  const updatePreview = useMemo(
    () =>
      debounce((changes: Partial<CreateQuoteDto>) => {
        setFormValues((prev) => ({ ...prev, ...changes }));
      }, 160),
    [setFormValues]
  );

  // Actualizar valor UF personalizado cuando se obtenga el valor de la API
  useEffect(() => {
    if (ufValue && currencyType === "UF" && !customUFValue) {
      setCustomUFValue(ufValue.valor);
    }
  }, [ufValue, currencyType, customUFValue]);

  // Actualizar taxRate cuando cambie el país o el tipo de IVA
  useEffect(() => {
    if (countryInfo && !isEdit) {
      const taxRate = taxType === "WITH_IVA" ? countryInfo.taxRate : 0;
      updatePreview({ taxRate });
    }
  }, [countryInfo, taxType, isEdit, updatePreview]);

  // Si llega la data setear para el edit
  useEffect(() => {
    if (isEdit && dataEdit) {
      const { items, ...rest } = dataEdit;

      // // Si hay fecha, convertirla a dayjs
      const preparedValues = {
        ...rest,
        quotationDate: rest.quotationDate
          ? dayjs(rest.quotationDate)
          : undefined,
        quotationValidity: rest.quotationValidity
          ? dayjs(rest.quotationValidity)
          : undefined,
        clientId: rest.clientId,
        currencyId: String(rest.currencyId), // Pasamos a string para que lea el input
        taxRate: quotationTypeTaxRate[dataEdit.quotationType as keyof typeof quotationTypeTaxRate] || 0,
      };

      // saco los items y me quedo con lo otro nomas
      form.setFieldsValue(preparedValues as unknown as Partial<CreateQuoteDto>);
      // Set para el preview
      setFormValues(preparedValues as unknown as Partial<CreateQuoteDto>);

      // construimos dinámicamente el visible en base a lo que viene en rest con !! para convertir a boolean
      const newVisible = {
        serviceDescription: !!rest.serviceDescription,
        termsOfPayment: !!rest.termsOfPayment,
        valGuarantees: !!rest.valGuarantees,
        paymentMethods: !!rest.paymentMethods,
        exclusions: !!rest.exclusions,
        tyc: !!rest.tyc,
        additionalInfo: !!rest.additionalInfo,
        taxRate:
          rest.quotationType === "WITH_IVA" ||
          rest.quotationType === "UF",
      };

      setVisible(newVisible);
    } else {
      form.resetFields();
      // Para nueva cotización, establecer fecha de hoy
      const today = new Date();
      form.setFieldsValue({
        quotationDate: dayjs(today),
      });
      // Actualizar el preview con la fecha de hoy y taxRate inicial
      updatePreview({ 
        quotationDate: today,
        taxRate: countryInfo ? (taxType === "WITH_IVA" ? countryInfo.taxRate : 0) : 0
      });
    }
  }, [dataEdit, isEdit, form, updatePreview, countryInfo, taxType]);

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
            sku: productFound.sku,
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
      sku: sku,
    };
  });

  const onSubmitData = async (dataForm: CreateQuoteDto | EditQuoteDto) => {
    setIsLoading(true);

    // Format Data send
    const dataSend = {
      ...dataForm,
      items: items, // Agregamos los items del state
      clientId: Number(dataForm.clientId),
      currencyId: currencyType === "UF" || currencyType === "USD" ? 1 : Number(dataForm.currencyId), // Usar ID 1 como default para UF/USD
      quotationType: taxType,
      taxRate: countryInfo ? (taxType === "WITH_IVA" ? countryInfo.taxRate : 0) : 0,
      ufValue: currencyType === "UF" ? customUFValue : null,
    };

    const response =
      isEdit && dataEdit
        ? await editQuote(dataSend as EditQuoteDto, dataEdit!.id!)
        : await createQuote(dataSend);

    showToast({
      type: response.success ? "success" : "error",
      message: response.message,
      onClose: () =>
        response.success && router.push(`/home?tab=${TabName.quote}`),
      duration: 1.5,
    });

    setIsLoading(false);
    if (response.success) form.resetFields();
  };

  // Toggle Switch para campos adicionales
  const toggleField = (field: keyof typeof visible, checked: boolean) => {
    if (!checked) {
      // form.setFieldValue(field, "");
      // Limpiar estado para preview
      setFormValues((prev) => ({ ...prev, [field]: "" }));
    }

    setVisible((prev) => ({ ...prev, [field]: checked }));
  };


  // onValuesChange del form
  const onValuesChange = (changedValues: Partial<CreateQuoteDto>) => {
    updatePreview(changedValues); // solo pasamos los campos que cambiaron
  };

  // Escuchar cuando cambie el clientId
  const clientIdWatch = useWatch(["clientId"], form);
  const taxRate = form.getFieldValue("taxRate");

  // GET data client - PreviewPrint
  const fetchClient = useCallback(
    (clientId: number) => getClientById(clientId),
    []
  );
  
  const { data: clientFound, loading: clientLoading } = useFetchById(
    clientIdWatch,
    fetchClient
  );

  // GET data company - PreviewPrint
  const fetchCompany = useCallback(
    (companyId: number) => getCompanyById(companyId),
    []
  );
  
  const { data: companyFound } = useFetchById(
    authContext.value.companyId,
    fetchCompany
  );

  // Debug logs
  console.log("🏢 Debug QuoteForm company:", {
    companyId: authContext.value.companyId,
    companyFound: companyFound
  });

  return (
    <>
      {contextHolder}
      <div className="pr-4 w-full mx-auto md:w-5/12 ">
        <div className="flex flex-col gap-4 items-center md:flex-row md:justify-between md:items-start mb-7 border-gray-200 bg-accent-light p-4 rounded-lg">
          <Button
            icon={<ArrowLeftOutlined className="cursor-pointer" />}
            variant="solid"
            color="primary"
            onClick={() => router.back()}
          >
            Volver
          </Button>
          <h2 className="text-xl font-semibold text-indigo-600">
            {isEdit ? "Editar cotización" : "Nueva cotización"}
          </h2>
        </div>
        <Form
          form={form}
          key={isEdit ? "edit-quote-form" : "create-quote-form"}
          layout="vertical"
          onFinish={onSubmitData}
          onValuesChange={onValuesChange}
          initialValues={{
            status: QuotationStatus.DRAFT,
            companyId: authContext.value.companyId,
            quotationDate: dayjs(), // Fecha actual por defecto
            quotationValidity: null,
            quotationIdentifier: "",
          }}
          scrollToFirstError={{
            behavior: "smooth",
            block: "center",
          }}
        >
          <Form.Item name="status" hidden>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="companyId" hidden>
            <Input type="hidden" />
          </Form.Item>
          <div className="flex flex-col gap-10 md:flex-col md:overflow-x-auto  md:justify-start">
            <div className="w-full">
              <p className="text-lg font-semibold mb-3">Datos</p>
              <div className="w-full space-y-4">
                {/* Selector de Impuesto */}
                <Form.Item
                  label="Impuesto"
                  name="quotationType"
                  rules={[requiredRule]}
                  className="w-full"
                >
                  <Select
                    placeholder="Seleccione el tipo de impuesto"
                    value={taxType}
                    onChange={(value) => {
                      setTaxType(value);
                      form.setFieldValue("quotationType", value);
                      // Actualizar taxRate basado en el país
                      if (countryInfo) {
                        const taxRate = value === "WITH_IVA" ? countryInfo.taxRate : 0;
                        form.setFieldValue("taxRate", taxRate);
                        updatePreview({ 
                          quotationType: value,
                          taxRate: taxRate 
                        });
                      }
                    }}
                    options={[
                      { label: "Sin IVA", value: "WITHOUT_IVA" },
                      { label: "Con IVA", value: "WITH_IVA" },
                    ]}
                  />
                </Form.Item>


                {/* Campo de Valor UF (solo para Chile con UF) */}
                {countryInfo?.supportsUF && currencyType === "UF" && (
                  <Form.Item
                    label="Valor UF"
                    name="ufValue"
                    rules={[requiredRule]}
                    className="w-full"
                  >
                    <Input
                      type="number"
                      placeholder="Valor de la UF"
                      value={customUFValue || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setCustomUFValue(value);
                        form.setFieldValue("ufValue", value);
                      }}
                      suffix={
                        ufLoading ? (
                          <span className="text-gray-400">Cargando...</span>
                        ) : (
                          <span className="text-gray-400">CLP</span>
                        )
                      }
                    />
                  </Form.Item>
                )}

              </div>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between lg:gap-4">
                <Form.Item
                  label="Tipo de divisa"
                  name="currencyId"
                  rules={[requiredRule]}
                  className="w-full"
                >
                  <Select
                    placeholder="Seleccione de divisa"
                    loading={isLoadingCat}
                    onChange={(value) => {
                      // Si es UF, establecer currencyType
                      if (value === "UF") {
                        setCurrencyType("UF");
                      } else if (value === "USD") {
                        setCurrencyType("USD");
                      } else {
                        setCurrencyType("CLP");
                      }
                    }}
                    options={[
                      ...optionsCurrencies,
                      // Agregar UF solo para Chile
                      ...(countryInfo?.supportsUF ? [{ label: "UF", value: "UF" }] : [])
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  label="ID Cotización"
                  name="quotationIdentifier"
                  className="w-full"
                  normalize={(value: string) => value?.toUpperCase()}
                >
                  <Input placeholder="ID Cotización" />
                </Form.Item>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-4">
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
                  label="Fecha de emisión"
                  name="quotationDate"
                  className="w-full"
                  rules={[requiredRule]}
                >
                  <DatePicker
                    placeholder="Selecciona una fecha"
                    className="w-full"
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item
                  label="Válida hasta"
                  name="quotationValidity"
                  className="w-full"
                >
                  <DatePicker
                    placeholder="Cotización válida hasta"
                    className="w-full"
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </div>

              <div className="flex flex-col">
                <Form.Item
                  label={<span className="text-lg font-semibold">Cliente</span>}
                  name="clientId"
                  rules={[requiredRule]}
                >
                  <Select
                    placeholder="Selecciona un cliente: Busca por Nombre o RFC"
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
                <Form.Item
                  label={
                    <span className="text-lg font-semibold ">Productos</span>
                  }
                  className="mb-3 w-full"
                >
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
              <div className="mt-5 space-y-4">
                <div className="bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between p-3">
                    <span className="font-medium">
                      Descripción del servicio
                    </span>
                    <Switch
                      checked={visible.serviceDescription}
                      onChange={(checked) =>
                        toggleField("serviceDescription", checked)
                      }
                    />
                  </div>

                  <Form.Item
                    name="serviceDescription"
                    key={`serviceDescription-${visible.serviceDescription}`}
                    style={{
                      margin: 4,
                      padding: 4,
                    }}
                    hidden={!visible.serviceDescription}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Ingrese la descripción del servicio"
                    />
                  </Form.Item>
                </div>

                <div className="bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between p-3">
                    <span className="font-medium">Condiciones de pago</span>
                    <Switch
                      checked={visible.termsOfPayment}
                      onChange={(checked) =>
                        toggleField("termsOfPayment", checked)
                      }
                    />
                  </div>

                  <Form.Item
                    name="termsOfPayment"
                    style={{ margin: 4, padding: 4 }}
                    hidden={!visible.termsOfPayment}
                    key={`termsOfPayment-${visible.serviceDescription}`}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Ingrese las condiciones de pago"
                    />
                  </Form.Item>
                </div>

                <div className="bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between p-3">
                    <span className="font-medium">Validez y garantías</span>
                    <Switch
                      checked={visible.valGuarantees}
                      onChange={(checked) =>
                        toggleField("valGuarantees", checked)
                      }
                    />
                  </div>
                  <Form.Item
                    name="valGuarantees"
                    style={{ margin: 4, padding: 4 }}
                    hidden={!visible.valGuarantees}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Ingrese la validez y garantías"
                      className="mt-3"
                    />
                  </Form.Item>
                </div>

                <div className="bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between p-3">
                    <span className="font-medium">Métodos de pago</span>
                    <Switch
                      checked={visible.paymentMethods}
                      onChange={(checked) =>
                        toggleField("paymentMethods", checked)
                      }
                    />
                  </div>
                  <Form.Item
                    name="paymentMethods"
                    style={{ margin: 4, padding: 4 }}
                    hidden={!visible.paymentMethods}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Ingrese los métodos de pago"
                      className="mt-3"
                    />
                  </Form.Item>
                </div>

                <div className="bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between p-3">
                    <span className="font-medium">Exclusiones</span>
                    <Switch
                      checked={visible.exclusions}
                      onChange={(checked) => toggleField("exclusions", checked)}
                    />
                  </div>
                  <Form.Item
                    name="exclusions"
                    style={{ margin: 4, padding: 4 }}
                    hidden={!visible.exclusions}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Ingrese las exclusiones"
                      className="mt-3"
                    />
                  </Form.Item>
                </div>

                <div className="bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between p-3">
                    <span className="font-medium">Información adicional</span>
                    <Switch
                      checked={visible.additionalInfo}
                      onChange={(checked) =>
                        toggleField("additionalInfo", checked)
                      }
                    />
                  </div>

                  <Form.Item
                    name="additionalInfo"
                    style={{ margin: 4, padding: 4 }}
                    hidden={!visible.additionalInfo}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Ingrese información adicional"
                      className="mt-3"
                    />
                  </Form.Item>
                </div>

                <div className="bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between p-3">
                    <span className="font-medium">Términos y condiciones</span>
                    <Switch
                      checked={visible.tyc || dataEdit?.tyc ? true : false}
                      onChange={(checked) => toggleField("tyc", checked)}
                    />
                  </div>

                  <Form.Item
                    name="tyc"
                    style={{ margin: 4, padding: 4 }}
                    hidden={!visible.tyc}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Ingrese los términos y condiciones"
                      className="mt-3"
                    />
                  </Form.Item>
                </div>

                <Form.Item label="Nota" name="note" className="mb-4 ">
                  <TextArea
                    placeholder="Condiciones comerciales, terminos de pago, etc."
                    maxLength={300}
                    rows={3}
                  />
                </Form.Item>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            type="primary"
            htmlType="submit"
            loading={isLoading}
            icon={<SaveOutlined />}
          >
            {isEdit ? "Guardar cambios" : "Crear cotización"}
          </Button>
        </Form>
      </div>

      <div className="hidden md:block md:border-l-2 md:border-accent-light" />

      <div className="hidden md:block mx-auto">
        <PreviewPrint
          data={formValues}
          taxRate={taxRate}
          client={clientFound}
          clientLoading={clientLoading}
          company={companyFound as unknown as companyById | null}
          items={items}
          optionsCurrencies={optionsCurrencies}
          quoteId={dataEdit?.id}
        />
      </div>
    </>
  );
}
