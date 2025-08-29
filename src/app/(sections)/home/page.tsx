export const dynamic = 'force-dynamic';
export const revalidate = 0;
import SectionTop from "./_feature/SectionTop";
import SectionTabs from "./_feature/SectionTabs";
import { getCompanyClientCatalog, getCompanyProductCatalog } from "./_actions";
import { TabName } from "@/app/constants/optionsSelects";
import { getProductsList } from "./_feature/product/actions";
import { getQuotesList } from "./_feature/quote/actions";
import { getClientsList } from "./_feature/client/actions";
import type { ResProductList } from "./_feature/product/product-types";
import type { ResQuoteList } from "./_feature/quote/quote-types";
import type { ResClientList } from "./_feature/client/client-types";
import { QuotationStatus } from "@prisma/client";

export default async function homePage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
    tab: string;
    status?: string;
  }>;
}) {
  // Extramos los datos de los searchParams
  const params = await searchParams;
  const search = params.search || "";
  const page = Number(params.page || 1);
  const pageSize = 10;
  const tab = params.tab || TabName.quote;

  const initialState = {
    data: [],
    success: null as boolean | null,
    total: 0,
    message: "",
  };
  // Definimos el formato inicial
  let products: ResProductList = initialState;

  let clients: ResClientList = initialState;

  let quotes: ResQuoteList = initialState;

  // Según el tabs hacemos la búsqueda
  if (tab === TabName.product) {
    products = await getProductsList(search, page, pageSize);
  }

  if (tab === TabName.client) {
    clients = await getClientsList(search, page, pageSize);
  }

  if (tab === TabName.quote) {
    quotes = await getQuotesList(
      search,
      page,
      pageSize,
      params.status as QuotationStatus
    );
  }

  // GET Catalogs
  const optionsProducts = await getCompanyProductCatalog(1);

  const optionsClients = await getCompanyClientCatalog(1);

  return (
    <div>
      <SectionTop />

      <SectionTabs
        products={products}
        clients={clients}
        quotes={{ ...quotes, optionsProducts, optionsClients }}
        searchParams={params}
      />
    </div>
  );
}
