"use client";
import { Button, Drawer } from "antd";
import CompanyForm from "./CompanyForm";
import { useState } from "react";
import { SettingOutlined } from "@ant-design/icons";
import { useAuthContext } from "@/app/hooks/useAuthContext";

export default function CompanyDrawer() {
  const [open, setOpen] = useState(false);

  const { value } = useAuthContext();

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button onClick={showDrawer} icon={<SettingOutlined />}></Button>

      <Drawer
        title={
          <div className="ml-2">
            <p className="text-lg font-medium">Datos de la Empresa</p>
            <p className="text-sm text-gray-400 font-normal">
              Configura los datos de tu empresa
            </p>
          </div>
        }
        closable={{ "aria-label": "Close Button" }}
        onClose={onClose}
        open={open}
        width={500}
      >
        <CompanyForm onCloseDrawer={onClose} companyId={value.companyId} />
      </Drawer>
    </>
  );
}
