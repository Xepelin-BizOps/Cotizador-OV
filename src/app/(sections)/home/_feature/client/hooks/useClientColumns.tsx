import type { ColumnsType } from "antd/es/table";
import { Button, Popconfirm, Space, Tag, Tooltip } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MailOutlined,
} from "@ant-design/icons";
import type { ToastOptions } from "@/app/hooks/useToast";
import ClientForm from "../components/ClientForm";
import ClientDetails from "../components/ClientDetails";
import { clientStatusMapper, clientTypeMapper } from "../client-mappers";
import type { ClientWithRelations } from "../client-types";
import { ClientStatus } from "@prisma/client";
import { deleteClient } from "../actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TabName } from "@/app/constants/optionsSelects";

interface Props {
  handleOpenModal: (title: string, content: React.ReactNode) => void;
  handleCloseModal: () => void;
  showToast: (options: ToastOptions) => void;
}

export default function useClientColumns({
  handleOpenModal,
  handleCloseModal,
  showToast,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDeleteClient = async (id: number) => {
    setIsLoading(true);
    const response = await deleteClient(id);

    showToast({
      type: response.success ? "success" : "error",
      message: response.message,
    });

    router.replace(`/home?tab=${TabName.client}`);
    setIsLoading(false);
  };

  const columns: ColumnsType<ClientWithRelations> = [
    {
      title: "Tipo",
      dataIndex: "type",
      key: "type",
      render: (_, record: ClientWithRelations) => (
        <p>{clientTypeMapper[record.type]}</p>
      ),
    },
    {
      title: "Empresa / Persona",
      dataIndex: "empresa",
      key: "empresa",
      render: (_, record) => (
        <p>{record.companyName || record.fullName || "-"}</p>
      ),
    },
    {
      title: "Industria / Profesión",
      dataIndex: "industria",
      key: "industria",
      render: (_, record) => (
        <p>{record.industry || record.profession || "-"}</p>
      ),
    },
    { title: "RFC", dataIndex: "rfc", key: "rfc" },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (estado: ClientStatus) => {
        let color = "default";
        if (estado === "ACTIVE") color = "green";
        else if (estado === "PROSPECT") color = "blue";
        else if (estado === "Inactivo") color = "volcano";

        return <Tag color={color}>{clientStatusMapper[estado]}</Tag>;
      },
    },
    {
      title: "Contacto Principal",
      dataIndex: "contact",
      key: "contact",
      render: (_, record) => (
        <>
          {record.contacts.length > 0 && (
            <div className="text-sm">
              <p className="font-semibold">{record.contacts[0].fullName}</p>
              <p>{record.contacts[0].role}</p>
              <p className="flex items-center gap-1">
                <MailOutlined /> {record.contacts[0].email}
              </p>
            </div>
          )}
        </>
      ),
    },
    {
      title: "Acciones",
      key: "action",
      render: (_, record: ClientWithRelations) => (
        <Space size="middle">
          <Tooltip title="Ver cliente">
            <Button
              color="primary"
              variant="outlined"
              icon={<EyeOutlined />}
              onClick={() =>
                handleOpenModal(
                  "Detalles del Cliente",
                  <ClientDetails data={record} />
                )
              }
            />
          </Tooltip>
          <Tooltip title="Editar cliente">
            <Button
              color="primary"
              variant="outlined"
              icon={<EditOutlined />}
              onClick={() =>
                handleOpenModal(
                  "Editar Cliente",
                  <ClientForm
                    onCloseModal={handleCloseModal}
                    data={record}
                    isEdit
                  />
                )
              }
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Popconfirm
              title="Eliminar"
              description="¿Estás seguro de que deseas eliminar este cliente?"
              onConfirm={() => handleDeleteClient(record.id)}
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

  return {
    columns,
  };
}
