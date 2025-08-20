"use client";
import { useEffect, useState } from "react";
import TextArea from "antd/es/input/TextArea";
import { Form, Input, Select, Radio, Button } from "antd";
import {
  DatabaseOutlined,
  FileTextOutlined,
  PushpinOutlined,
  UsergroupAddOutlined,
  UserOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { emailRule, phoneRule, requiredRule } from "@/utils/formRules";
import useToast from "@/app/hooks/useToast";
import {
  addressOptions,
  clientStatusOptions,
} from "@/app/constants/optionsSelects";
import { createClient, editClient } from "../actions";
import type {
  CreateClientDto,
  EditClientDto,
} from "@/schemas/client/client.dto";
import { ClientType } from "@prisma/client";
import type { ClientWithRelations } from "../client-types";
import { useAuthContext } from "@/app/hooks/useAuthContext";

interface Props {
  onCloseModal: () => void;
  isEdit?: boolean;
  data?: ClientWithRelations;
}

export default function ClientForm({ onCloseModal, isEdit, data }: Props) {
  const [form] = Form.useForm();
  const { Item, List } = Form;
  const selectedClientType = Form.useWatch("type", form);

  const [isLoading, setIsLoading] = useState(false);

  const { contextHolder, showToast } = useToast();
  const authContext = useAuthContext();

  // Si llega la data lo seteo para el edit sino reset porque es un create
  useEffect(() => {
    if (isEdit && data) {
      form.setFieldsValue(data);
    } else {
      form.resetFields();
    }
  }, [data, isEdit, form]);

  const onSubmitData = async (dataForm: CreateClientDto | EditClientDto) => {
    setIsLoading(true);

    const response =
      isEdit && data
        ? await editClient(dataForm as EditClientDto, data.id!)
        : await createClient(dataForm);

    showToast({
      type: response.success ? "success" : "error",
      message: response.message,
    });

    if (response.success) form.resetFields();
    setIsLoading(false);
    onCloseModal();
  };

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmitData}
        initialValues={{
          addresses: [],
          contacts: [],
          companyId: authContext.value.companyId,
        }}
      >
        <Form.Item name="companyId" hidden>
          <Input type="hidden" />
        </Form.Item>
        {/* Tipo de cliente */}
        <div className="shadow-sm rounded-lg p-4 border border-accent-light-hover">
          <p className="flex items-center gap-2 mb-3 font-semibold text-lg">
            <UserOutlined /> Tipo
          </p>
          <Item name="type" rules={[requiredRule]} style={{ margin: 0 }}>
            <Radio.Group>
              <Radio value={ClientType.PERSON}>Persona Física</Radio>
              <Radio value={ClientType.COMPANY}>Persona Moral (Empresa)</Radio>
            </Radio.Group>
          </Item>
        </div>

        {/* Info General */}
        <div className="shadow-sm rounded-lg border border-accent-light-hover p-4 mt-3">
          <p className="flex items-center gap-2 mb-4 font-semibold text-lg">
            <DatabaseOutlined /> Información general
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {selectedClientType === ClientType.COMPANY && (
              <>
                <Item
                  label="Nombre de la empresa"
                  name="companyName"
                  rules={[requiredRule]}
                >
                  <Input placeholder="Ej: Innovación Digital S.A. de C.V." />
                </Item>
                <Item label="Industria" name="industry" rules={[requiredRule]}>
                  <Input placeholder="Ej: Tecnología" />
                </Item>
              </>
            )}
            {selectedClientType === ClientType.PERSON && (
              <>
                <Item
                  label="Nombre Completo"
                  name="fullName"
                  rules={[requiredRule]}
                >
                  <Input placeholder="Ej: Juan Martin" />
                </Item>
                <Item
                  label="Actividad/Profesión"
                  name="profession"
                  rules={[requiredRule]}
                >
                  <Input placeholder="Ej: Contador, Médico..." />
                </Item>
              </>
            )}

            <Item label="Estado" name="status" rules={[requiredRule]}>
              <Select
                placeholder="Seleccionar el estado"
                options={clientStatusOptions}
              />
            </Item>
          </div>
        </div>

        {/* Facturación */}
        <div className="shadow-sm rounded-lg p-4 border border-accent-light-hover mt-3">
          <p className="flex items-center gap-2 mb-4 font-semibold text-lg">
            <FileTextOutlined /> Datos de facturación
          </p>
          <Item label="Régimen Fiscal" name="taxRegime" rules={[requiredRule]}>
            <Input placeholder="Régimen Fiscal" />
          </Item>
          <div className="grid md:grid-cols-2 gap-4">
            <Item label="RFC" name="rfc" rules={[{ required: true }]}>
              <Input placeholder="Ej: XEO1232321" />
            </Item>
            <Item label="Uso de CFDI" name="cfdiUse" rules={[requiredRule]}>
              <Input placeholder="Ej: G03 - Gastos generales" />
            </Item>
            <Item
              label="Email de Facturación"
              name="billingEmail"
              rules={[requiredRule, emailRule]}
            >
              <Input type="email" placeholder="ejemplo@correo.com" />
            </Item>
            <Item
              label="Teléfono"
              name="phone"
              rules={[requiredRule, phoneRule]}
            >
              <Input placeholder="Ej: 5512345678" maxLength={10} />
            </Item>
          </div>
        </div>

        {/* Direcciones */}
        <div className="shadow-sm rounded-lg p-4 border border-accent-light-hover mt-3">
          <p className="flex items-center gap-2 mb-3 font-semibold text-lg">
            <PushpinOutlined />
            Direcciones
          </p>
          <List name="addresses">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => {
                  const currentAddress = form.getFieldValue([
                    "addresses",
                    name,
                  ]);

                  return (
                    <div
                      key={key}
                      className="relative border border-gray-100 p-3 mb-4 rounded-md"
                    >
                      <div className="grid md:grid-cols-3 gap-4">
                        <Item
                          {...rest}
                          label="Tipo"
                          name={[name, "type"]}
                          rules={[requiredRule]}
                        >
                          <Select
                            placeholder="Tipo de dirección"
                            options={addressOptions}
                          />
                        </Item>
                        <Item
                          {...rest}
                          label="Calle y número"
                          name={[name, "street"]}
                          rules={isEdit ? [requiredRule] : undefined}
                        >
                          <Input />
                        </Item>
                        <Item
                          {...rest}
                          label="Ciudad"
                          name={[name, "city"]}
                          rules={isEdit ? [requiredRule] : undefined}
                        >
                          <Input />
                        </Item>
                        <Item
                          {...rest}
                          label="Estado"
                          name={[name, "state"]}
                          rules={isEdit ? [requiredRule] : undefined}
                        >
                          <Input />
                        </Item>
                        <Item
                          {...rest}
                          label="Código Postal"
                          name={[name, "zip"]}
                          rules={isEdit ? [requiredRule] : undefined}
                        >
                          <Input />
                        </Item>
                      </div>

                      {/** Solo mostrar si no tiene ID */}
                      {(!currentAddress || !currentAddress.id) && (
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        >
                          Eliminar dirección
                        </Button>
                      )}
                    </div>
                  );
                })}
                {fields.length < 3 && (
                  <Button icon={<PlusOutlined />} onClick={() => add()}>
                    Agregar dirección
                  </Button>
                )}
              </>
            )}
          </List>
        </div>

        {/* Contactos */}
        <div className="shadow-sm rounded-lg p-4 border border-accent-light-hover mt-3">
          <p className="flex items-center gap-2 mb-3 font-semibold text-lg">
            <UsergroupAddOutlined />
            Contactos
          </p>
          <List name="contacts">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => {
                  const currentContact = form.getFieldValue(["contacts", name]);

                  return (
                    <div
                      key={key}
                      className="relative border border-gray-100 p-3 mb-4 rounded-md"
                    >
                      <div className="grid md:grid-cols-3 gap-4">
                        <Item
                          {...rest}
                          label="Nombre completo"
                          name={[name, "fullName"]}
                          rules={[requiredRule]}
                        >
                          <Input />
                        </Item>
                        <Item
                          {...rest}
                          label="Puesto"
                          name={[name, "role"]}
                          rules={[requiredRule]}
                        >
                          <Input />
                        </Item>
                        <Item
                          {...rest}
                          label="Email"
                          name={[name, "email"]}
                          rules={[requiredRule, emailRule]}
                        >
                          <Input />
                        </Item>
                        <Item
                          {...rest}
                          label="Teléfono"
                          name={[name, "phone"]}
                          rules={[requiredRule]}
                        >
                          <Input maxLength={10} />
                        </Item>
                        <Item
                          {...rest}
                          label="WhatsApp"
                          name={[name, "whatsapp"]}
                        >
                          <Input />
                        </Item>
                      </div>
                      {(!currentContact || !currentContact.id) && (
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        >
                          Eliminar contacto
                        </Button>
                      )}
                    </div>
                  );
                })}
                {fields.length < 3 && (
                  <Button icon={<PlusOutlined />} onClick={() => add()}>
                    Agregar contacto
                  </Button>
                )}
              </>
            )}
          </List>
        </div>

        <div className="shadow-sm rounded-lg p-4 border border-accent-light-hover mt-3">
          <p className="font-semibold text-lg mb-3">Notas</p>
          <Form.Item label="" name="notes">
            <TextArea rows={4} placeholder="Descripción de la nota" />
          </Form.Item>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          className="mt-5"
          loading={isLoading}
          icon={<SaveOutlined />}
        >
          {isEdit ? "Guardar cambios" : "Agregar cliente"}
        </Button>
      </Form>
    </>
  );
}
