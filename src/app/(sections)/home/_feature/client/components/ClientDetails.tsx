import {
  FileTextOutlined,
  MailOutlined,
  PhoneOutlined,
  PushpinOutlined,
  UsergroupAddOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import type { ClientWithRelations } from "../client-types";
import { addressTypesMapper, clientStatusMapper } from "../client-mappers";

interface Props {
  data: ClientWithRelations;
}

export default function ClientDetails({ data }: Props) {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg shadow-sm p-4 mt-3 border border-accent-light-hover">
        <h2 className="text-[1rem] font-semibold text-gray-900">
          {data.companyName || data.fullName}
        </h2>
        <div className="flex items-center gap-3 mt-2 ">
          <p className="bg-green-200 px-2 rounded-lg text-sm text-gray-600">
            {clientStatusMapper[data.status]}
          </p>
          <p className="text-sm text-gray-600">
            {data.industry || data.profession}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4 rounded-lg shadow-sm border border-accent-light-hover bg-white ">
        <div className="flex items-center gap-2">
          <FileTextOutlined />
          <p className="text-lg font-semibold">Datos de Facturación</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Régimen Fiscal</p>
          <p className="text-sm text-gray-900">{data.taxRegime}</p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="w-1/2">
            <p className="text-sm font-medium text-gray-700">RFC</p>
            <p className="text-sm text-gray-900">{data.rfc}</p>
          </div>
          <div className="w-1/2">
            <p className="text-sm font-medium text-gray-700">
              Email Facturación
            </p>
            <p className="text-sm text-gray-900">{data.billingEmail}</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="w-1/2">
            <p className="text-sm font-medium text-gray-700">Uso de CFDI</p>
            <p className="text-sm text-gray-900">{data.cfdiUse}</p>
          </div>
          <div className="w-1/2">
            <p className="text-sm font-medium text-gray-700">Teléfono</p>
            <p className="text-sm text-gray-900">{data.phone}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-accent-light-hover">
        <div className="flex items-center gap-2">
          <PushpinOutlined />
          <p className="text-lg font-semibold">Direcciones</p>
        </div>

        {data.addresses.map((address) => (
          <div
            key={address.id}
            className="space-y-3 bg-gray-50 p-4 rounded-lg my-2"
          >
            <p className="border border-gray-400 bg-accent-light rounded-lg px-2 w-min">
              {addressTypesMapper[address.type]}
            </p>
            <p className="text-sm text-gray-900">{address.street}</p>
            <p className="text-sm text-gray-900">
              {address.city} - {address.zip} - {address.state}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-accent-light-hover">
        <div className="flex items-center gap-2">
          <UsergroupAddOutlined />
          <p className="text-lg font-semibold">Contactos</p>
        </div>

        {data.contacts.map((contact) => (
          <div
            key={contact.id}
            className="space-y-3 bg-gray-50 p-4 rounded-lg my-2"
          >
            <p className="font-medium text-gray-900">{contact.fullName}</p>
            <p className="text-sm text-gray-900">{contact.role}</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <MailOutlined />
                <p className="text-sm text-gray-900">{contact.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <PhoneOutlined />
                <p className="text-sm text-gray-900">{contact.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <WhatsAppOutlined />
                <p className="text-sm text-gray-900">{contact.whatsapp}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className=" bg-white rounded-lg shadow-sm p-4 border border-accent-light-active">
        <p className="font-semibold">Notas</p>

        <div className="space-y-3 rounded-lg my-2">
          <p>{data.notes || "Sin nota"}</p>
        </div>
      </div>
    </div>
  );
}
