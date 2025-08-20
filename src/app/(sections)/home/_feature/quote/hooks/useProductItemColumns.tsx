import { InputNumber, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { EditQuoteItemDto } from "@/schemas/quote/quote.dto";

export const useProductItemColumns = (
  updateItem: (
    productId: number,
    key: "quantity" | "unitPrice",
    value: number
  ) => void,
  removeItem: (productId: number) => void
) => {
  const columns: ColumnsType<EditQuoteItemDto> = [
    {
      title: "Producto",
      dataIndex: "productName",
      key: "name",
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity: number, record) => (
        <InputNumber
          min={1}
          value={quantity}
          onChange={(value) =>
            updateItem(record.productId, "quantity", value || 1)
          }
        />
      ),
    },
    {
      title: "Precio Unit.",
      dataIndex: "unitPrice",
      key: "unitPrice",
      render: (unitPrice: number, record) => (
        <InputNumber
          min={0}
          step={0.01}
          value={unitPrice}
          style={{ width: 100 }}
          formatter={(val) => `$ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          onChange={(value) =>
            updateItem(record.productId, "unitPrice", value || 0)
          }
        />
      ),
    },
    {
      title: "Total",
      key: "total",
      render: (_, record) => (
        <span>
          <strong>${(record.quantity * record.unitPrice).toFixed(2)}</strong>
        </span>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.productId)}
        />
      ),
    },
  ];

  return columns;
};
