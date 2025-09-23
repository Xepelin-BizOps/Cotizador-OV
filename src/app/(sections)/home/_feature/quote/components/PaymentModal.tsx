"use client";

import { Button, Form, Input, InputNumber, Modal, message, DatePicker, Select } from "antd";
import { useState, useEffect, useCallback } from "react";
import { registerPayment, getQuotePayments } from "../actions";
import dayjs from "dayjs";
import { formatNumberWithCommas } from "@/utils/functions";

interface Props {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  quoteId: number;
  totalAmount: number;
}

const paymentMethods = [
  { label: "Efectivo", value: "Efectivo" },
  { label: "Transferencia Bancaria", value: "Transferencia Bancaria" },
  { label: "Tarjeta de Crédito", value: "Tarjeta de Crédito" },
  { label: "Tarjeta de Débito", value: "Tarjeta de Débito" },
  { label: "Cheque", value: "Cheque" },
  { label: "Otro", value: "Otro" },
];

export default function PaymentModal({
  open,
  onCancel,
  onSuccess,
  quoteId,
  totalAmount,
}: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [totalPaid, setTotalPaid] = useState(0);

  const remainingAmount = totalAmount - totalPaid;

  const loadPayments = useCallback(async () => {
    try {
      const response = await getQuotePayments(quoteId);
      if (response.success) {
        setTotalPaid(response.totalPaid);
      }
    } catch (error) {
      console.error("Error cargando pagos:", error);
    }
  }, [quoteId]);

  // Cargar el total pagado cuando se abre el modal
  useEffect(() => {
    if (open) {
      loadPayments();
    }
  }, [open, quoteId, loadPayments]);

  const handleSubmit = async (values: {
    amount: number;
    paymentMethod: string;
    paymentDate: dayjs.Dayjs;
    notes?: string;
  }) => {
    setLoading(true);
    try {
      const response = await registerPayment(
        quoteId,
        values.amount,
        values.paymentMethod,
        values.paymentDate.toDate(),
        values.notes
      );
      
      if (response.success) {
        message.success(response.message);
        await loadPayments(); // Recargar los pagos para actualizar el total
        onSuccess();
        form.resetFields();
      } else {
        message.error(response.message);
      }
    } catch {
      message.error("Error al registrar el pago");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleQuickPayment = (type: "partial" | "total") => {
    const amount = type === "total" ? remainingAmount : remainingAmount / 2;
    form.setFieldsValue({ amount: Math.round(amount * 100) / 100 });
  };

  return (
    <Modal
      title="Registrar Pago"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <div className="flex justify-between text-sm">
          <span>Monto Total:</span>
          <span className="font-semibold">${formatNumberWithCommas(totalAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Total Pagado:</span>
          <span className="font-semibold">${formatNumberWithCommas(totalPaid)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-blue-600">
          <span>Monto Restante:</span>
          <span>${formatNumberWithCommas(remainingAmount)}</span>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ paymentDate: dayjs() }}
      >
        <Form.Item
          name="amount"
          label="Monto del Pago"
          rules={[
            { required: true, message: "Ingresa el monto del pago" },
            { 
              type: "number", 
              min: 0.01, 
              message: "El monto debe ser mayor a 0" 
            },
            {
              validator: (_, value) => {
                if (value > remainingAmount) {
                  return Promise.reject(
                    new Error(`El pago no puede exceder $${formatNumberWithCommas(remainingAmount)}`)
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            placeholder="0.00"
            min={0.01}
            max={remainingAmount}
            step={0.01}
            precision={2}
            style={{ width: "100%" }}
            size="large"
            prefix="$"
          />
        </Form.Item>

        <div className="flex gap-2 mb-4">
          <Button 
            size="small" 
            onClick={() => handleQuickPayment("partial")}
            disabled={remainingAmount <= 0}
          >
            Pago Parcial (50%)
          </Button>
          <Button 
            size="small" 
            onClick={() => handleQuickPayment("total")}
            disabled={remainingAmount <= 0}
          >
            Pago Total
          </Button>
        </div>

        <Form.Item
          name="paymentMethod"
          label="Método de Pago"
          rules={[{ required: true, message: "Selecciona un método de pago" }]}
        >
          <Select
            placeholder="Selecciona un método de pago"
            options={paymentMethods}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="paymentDate"
          label="Fecha del Pago"
          rules={[{ required: true, message: "Selecciona la fecha del pago" }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            size="large"
            format="DD/MM/YYYY"
          />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Notas (Opcional)"
        >
          <Input.TextArea
            placeholder="Notas adicionales sobre el pago..."
            rows={3}
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <div className="flex justify-end gap-2">
            <Button onClick={handleCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Registrar Pago
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
