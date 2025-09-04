"use client";
import { Tabs, type TabsProps } from "antd";
import ProductList from "./product/components/ProductList";
import QuotesList from "./quote/components/QuotesList";
import type { PlainProductWithRelations } from "./product/product-types";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import ClientList from "./client/components/ClientList";
import type { ClientsList } from "./client/client-types";
import type { PlainQuotesWithRelations } from "./quote/quote-types";
import { TabName } from "@/app/constants/optionsSelects";
import ErrorState from "@/app/components/ErrorState";
import SkeletonTabList from "../../../components/SkeletonTabList";

interface ListResponse<T> {
  data: T[];
  total: number;
  success: boolean | null;
  message: string;
}

interface QuotesResponse extends ListResponse<PlainQuotesWithRelations> {
  optionsProducts: { label: string; value: number }[];
  optionsClients: { label: string; value: number }[];
}

interface Props {
  products: ListResponse<PlainProductWithRelations>;
  clients: ListResponse<ClientsList[number]>;
  quotes: QuotesResponse;
  searchParams: { search?: string; page?: string; tab: string };
}

export default function SectionTabs({
  products,
  clients,
  quotes,
  searchParams,
}: Props) {
  const router = useRouter();

  const activeTab = searchParams?.tab || TabName.quote;

  const handleTabChange = useCallback(
    (key: string) => {
      const params = new URLSearchParams();

      params.set("tab", key);
      // Limpiar parámetros anteriores
      params.delete("page");
      params.delete("search");

      router.replace(`?${params.toString()}`);
    },
    [router]
  );

  const items: TabsProps["items"] = [
    {
      key: TabName.quote,
      label: "Cotizaciones",
      children:
        quotes.success === null ? (
          <SkeletonTabList />
        ) : quotes.success && quotes.data ? (
          <QuotesList
            data={quotes.data}
            totalItem={quotes.total}
            optionsProducts={quotes.optionsProducts}
            optionsClients={quotes.optionsClients}
          />
        ) : (
          <ErrorState message={quotes.message} redirectPath="/auth" />
        ),
    },
    {
      key: TabName.client,
      label: "Clientes",
      children:
        clients.success === null ? (
          <SkeletonTabList />
        ) : clients.success && clients.data ? (
          <ClientList data={clients.data} totalItems={clients.total} />
        ) : (
          <ErrorState message={clients.message} redirectPath="/auth" />
        ),
    },
    {
      key: TabName.product,
      label: "Catálogos",
      children:
        products.success === null ? (
          <SkeletonTabList />
        ) : products.success && products.data ? (
          <ProductList data={products.data} totalItems={products.total} />
        ) : (
          <ErrorState message={products.message} redirectPath="/auth" />
        ),
    },
  ];

  return (
    <div className="w-full bg-accent-light-m border-t border-gray-300 px-3 pt-12 pb-6 sm:px-12">
      <div className="bg-white rounded-2xl p-4 mb-8 shadow w-full max-w-7xl mx-auto">
        <Tabs
          className="custom-fullwidth-tabs"
          defaultActiveKey={activeTab}
          items={items}
          onChange={handleTabChange}
        />
      </div>
    </div>
  );
}
