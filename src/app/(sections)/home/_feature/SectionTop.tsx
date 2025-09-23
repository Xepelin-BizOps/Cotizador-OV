import { Tooltip } from "antd";
import CardData from "@/app/components/CardData";
import CompanyDrawer from "./company/components/CompanyDrawer";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { getStats } from "../_actions";
import ErrorState from "@/app/components/ErrorState";

export default async function SectionTop() {
  const response = await getStats();

  return (
    <>
      <section className="w-full bg-white">
        <div className="w-full max-w-7xl mx-auto p-4">
          <div className="flex justify-between">
            <h1 className="text-xl font-bold">Panel de control</h1>
            <Tooltip title="Datos de los últimos 30 días">
              <QuestionCircleOutlined />
            </Tooltip>
          </div>

          {/* Cards */}
          {response.success ? (
            <div className="my-10 flex justify-center items-center gap-5 flex-wrap">
              <CardData
                title={response.data[0].label || "Total Cotizaciones"}
                amount={`${response.data[0].value || "$0"}`}
                percentage={response.data[0].change || ""}
                currency={response.data[0].currency || "MXN"}
                // loading={response.isLoading}
              />
              <CardData
                title={response.data[1].label || "Total Vendido"}
                amount={`${response.data[1].value || "$0"}`}
                percentage={response.data[1].change || ""}
                currency={response.data[1].currency || "MXN"}
                // loading={response.isLoading}
              />
              <CardData
                title={response.data[2].label || "Por Cobrar"}
                amount={`${response.data[2].value || "$0"}`}
                percentage={response.data[2].change || ""}
                currency={response.data[2].currency || "MXN"}
                // loading={response.isLoading}
              />
              <CardData
                title={response.data[3].label || "Tasa Conversión"}
                amount={response.data[3].value.toString() || "$0"}
                percentage={response.data[3].change || ""}
                currency={response.data[3].currency || "MXN"}
                // loading={response.isLoading}
              />
              <CardData
                title={response.data[4].label || "Cliente activos"}
                amount={response.data[4].value.toString() || ""}
                percentage={response.data[4].change || ""}
                currency={response.data[4].currency || ""}
                // loading={response.isLoading}
              />
            </div>
          ) : (
            <ErrorState message={response.message} redirectPath="/auth" />
          )}

          <div className="flex justify-end">
            {/* Form de empresa */}
            <CompanyDrawer />
          </div>
        </div>
      </section>
    </>
  );
}
