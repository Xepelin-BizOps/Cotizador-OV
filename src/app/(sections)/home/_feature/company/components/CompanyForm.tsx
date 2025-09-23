"use client";

import { Form, Input, Button, Upload, message } from "antd";
import { useEffect, useState } from "react";
import {
  CloseOutlined,
  MailOutlined,
  SaveOutlined,
  ShopOutlined,
  UploadOutlined,
  DeleteOutlined,
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
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Carga inicial de datos (Server Action)
  useEffect(() => {
    (async () => {
      // Prioriza prop; si no viene, usa cookie (para no depender del contexto)
      const effectiveCompanyId =
        typeof companyId === "number" ? companyId : readCompanyIdFromCookie();

      const res = await getCompanyById(effectiveCompanyId ?? undefined);

      if (res?.success && res.data) {
        form.setFieldsValue(res.data);
        setLogoBase64(res.data.logoBase64);
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

  // Función para manejar la subida del logo a S3
  const handleLogoUpload = async (file: File) => {
    try {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        message.error('Solo se permiten archivos de imagen');
        return false;
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        message.error('El archivo no debe superar los 2MB');
        return false;
      }

      setIsUploadingLogo(true);

      // Crear FormData para enviar a la API
      const formData = new FormData();
      formData.append('file', file);

      // Subir a S3 a través de la API
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        message.error(result.message || 'Error al subir el logo');
        return false;
      }

      // Guardar la URL del logo (ahora en logoBase64 pero contiene la URL)
      setLogoBase64(result.url);
      form.setFieldValue('logoBase64', result.url);
      
      message.success('Logo cargado correctamente');
      return false; // Evitar subida automática
    } catch (error) {
      console.error('Error al subir logo:', error);
      message.error('Error al cargar el logo');
      return false;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Función para eliminar el logo
  const handleRemoveLogo = () => {
    setLogoBase64(null);
    form.setFieldValue('logoBase64', null);
    message.success('Logo eliminado');
  };

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
        {/* Sección del Logo */}
        <div className="border border-accent-light-active shadow p-4 rounded-lg">
          <p className="flex items-center gap-2 mb-3 font-semibold text-lg">
            <ShopOutlined /> Logo de la Empresa
          </p>
          
          <div className="flex flex-col items-center">
            {logoBase64 ? (
              <div 
                className="relative group cursor-pointer"
                onMouseEnter={() => setIsHoveringLogo(true)}
                onMouseLeave={() => setIsHoveringLogo(false)}
              >
                <img 
                  src={logoBase64} 
                  alt="Logo de la empresa" 
                  className="max-w-48 max-h-48 object-contain rounded-lg border border-gray-200"
                />
                {isHoveringLogo && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="flex gap-2">
                      <Upload
                        beforeUpload={handleLogoUpload}
                        showUploadList={false}
                        accept="image/*"
                        disabled={isUploadingLogo}
                      >
                        <Button 
                          type="primary" 
                          icon={<UploadOutlined />}
                          size="small"
                          loading={isUploadingLogo}
                        >
                          Cambiar
                        </Button>
                      </Upload>
                      <Button 
                        danger 
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={handleRemoveLogo}
                        disabled={isUploadingLogo}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload
                  beforeUpload={handleLogoUpload}
                  showUploadList={false}
                  accept="image/*"
                  disabled={isUploadingLogo}
                >
                  <div className="flex flex-col items-center gap-2">
                    {isUploadingLogo ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="text-gray-600">Subiendo logo...</p>
                      </>
                    ) : (
                      <>
                        <UploadOutlined className="text-4xl text-gray-400" />
                        <p className="text-gray-600">Haz clic para subir el logo</p>
                        <p className="text-sm text-gray-400">PNG, JPG, GIF (máx. 2MB)</p>
                      </>
                    )}
                  </div>
                </Upload>
              </div>
            )}
          </div>
        </div>

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

        {/* Campo oculto para el logo */}
        <Form.Item name="logoBase64" hidden>
          <Input />
        </Form.Item>

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
