"use client";

import { Form, Input, Button } from "antd";
import { useEffect, useState } from "react";
import {
  CloseOutlined,
  MailOutlined,
  SaveOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import useToast from "@/app/hooks/useToast";
import { emailRule } from "@/utils/formRules";
import { editCompany, getCompanyById } from "../actions";
import type { EditCompanyDto } from "@/schemas/company/company.dto";

interface Props {
  companyId?: number;
  onCloseDrawer: () => void;
}

// Lee companyId desde cookie (string → number) para fallback en cliente
function readCompanyIdFromCookie(): number | null {
  try {
    const m = document.cookie.match(/(?:^|;\s*)companyId=([^;]+)/);
    if (!m) return null;
    const raw = decodeURIComponent(m[1]);
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export default function CompanyForm({ companyId, onCloseDrawer }: Props) {
  const [form] = Form.useForm();
  const { contextHolder, showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Carga inicial de datos (Server Action)
  useEffect(() => {
    (async () => {
      // Prioriza prop; si no viene, usa cookie (para no depender del contexto)
      const effectiveCompanyId =
        typeof companyId === "number" ? companyId : readCompanyIdFromCookie();

      const res = await getCompanyById(effectiveCompanyId ?? undefined);

      if (res?.success) {
        form.setFieldsValue(res.data);
      } else if (res) {
        // Si cambiaste de build y ves “Failed to find Server Action …”, haz hard refresh del tab.
        // Este mensaje sale cuando el bundle del browser quedó viejo respecto al build del server.
        showToast({
          type: "error",
          message: res.message ?? "No se pudo cargar la empresa.",
        });
      }
    })();
  }, [companyId, form, showToast]);

  const onSubmitData = async (dataForm: EditCompanyDto) => {
    setIsLoading(true);

    // Usa el mismo fallback para guardar
    const effectiveCompanyId =
      typeof companyId === "number" ? companyId : readCompanyIdFromCookie();

    const response = await editCompany(dataForm, effectiveCompanyId ?? undefined);

    showToast({
      type: response.success ? "success" : "error",
      message: response.message,
    });

    setIsLoading(false);
    if (response.success) onCloseDrawer();
  };

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmitData}
        initialValues={{}}
        className="max-w-xl mx-auto p-6 rounded-lg space-y-4"
      >
        <div className="border border-accent-light-active shadow p-4 rounded-lg">
          <p className="flex items-center gap-2 mb-3 font-semibold text-lg">
            <ShopOutlined /> Datos Básicos
          </p>
          <Form.Item label="Nombre de la empresa - cliente" name="companyName">
            <Input placeholder="Nombre de la empresa" />
          </Form.Item>

          <Form.Item label="RFC" name="rfc">
            <Input placeholder="RFC" />
          </Form.Item>

          <Form.Item label="Dirección" name="address">
            <Input placeholder="Dirección" />
          </Form.Item>
        </div>

        <div className="border border-accent-light-active shadow p-4 rounded-lg">
          <p className="flex items-center gap-2 mb-3 font-semibold text-lg">
            <MailOutlined /> Datos de contacto
          </p>
          <Form.Item label="Correo electrónico" name="email" rules={[emailRule]}>
            <Input placeholder="Correo electrónico" />
          </Form.Item>

          <Form.Item label="Teléfono" name="phone">
            <Input placeholder="Teléfono" />
          </Form.Item>
        </div>

        <div className="flex items-center gap-2 mt-10">
          <Button
            icon={<CloseOutlined />}
            onClick={onCloseDrawer}
            className="w-full"
          >
            Cancelar
          </Button>
          <Button
            icon={<SaveOutlined />}
            className="w-full"
            type="primary"
            htmlType="submit"
            loading={isLoading}
          >
            Guardar
          </Button>
        </div>
      </Form>
    </>
  );
}
