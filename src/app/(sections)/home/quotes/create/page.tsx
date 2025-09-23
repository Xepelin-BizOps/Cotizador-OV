import QuoteForm from "../_components/QuoteForm";
import {
  getCompanyClientCatalog,
  getCompanyProductCatalog,
} from "../../_actions";
import ErrorState from "@/app/components/ErrorState";

export default async function Page() {
  try {
    // GET Catalogs
    const [resProducts, resClients] = await Promise.all([
      getCompanyProductCatalog(),
      getCompanyClientCatalog(),
    ]);

    return (
      <>
        <div className="px-5 py-10 flex">
          <QuoteForm
            optionsProducts={resProducts}
            optionsClients={resClients}
            isEdit={false}
          />
        </div>
      </>
    );
  } catch {
    return <ErrorState message="Error al cargar los catálogos" />;
  }
}
