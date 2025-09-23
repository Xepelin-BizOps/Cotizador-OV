"use client";

import { Button, Form, Select, Modal, message } from "antd";
import { useState } from "react";
import { QuotationStatus } from "@prisma/client";
import { updateQuoteStatus } from "../actions";

interface Props {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  quoteId: number;
  currentStatus: QuotationStatus;
  preselectedStatus?: QuotationStatus;
}

const statusOptions = [
  { label: "Confirmada", value: QuotationStatus.CONFIRMED },
  { label: "Rechazada", value: QuotationStatus.REJECTED },
];

export default function StatusChangeModal({
  open,
  onCancel,
  onSuccess,
  quoteId,
  currentStatus,
  preselectedStatus,
}: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { status: QuotationStatus }) => {
    setLoading(true);
    try {
      const response = await updateQuoteStatus(quoteId, values.status);
      
      if (response.success) {
        message.success(response.message);
        onSuccess();
        form.resetFields();
      } else {
        message.error(response.message);
      }
    } catch {
      message.error("Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Si hay un estado pre-seleccionado, usar ese; si no, usar el estado actual
  const initialStatus = preselectedStatus || currentStatus;

  return (
    <Modal
      title={preselectedStatus ? 
        (preselectedStatus === QuotationStatus.CONFIRMED ? "Confirmar Cotización" : "Rechazar Cotización") : 
        "Cambiar Estado de Cotización"
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={400}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ status: initialStatus }}
      >
        <Form.Item
          name="status"
          label="Nuevo Estado"
          rules={[{ required: true, message: "Selecciona un estado" }]}
        >
          <Select
            placeholder="Selecciona un estado"
            options={statusOptions}
            size="large"
            disabled={!!preselectedStatus}
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <div className="flex justify-end gap-2">
            <Button onClick={handleCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {preselectedStatus ? 
                (preselectedStatus === QuotationStatus.CONFIRMED ? "Confirmar" : "Rechazar") : 
                "Actualizar Estado"
              }
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
