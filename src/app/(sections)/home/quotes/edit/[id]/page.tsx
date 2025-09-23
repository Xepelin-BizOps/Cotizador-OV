import { EditQuoteDto } from "@/schemas/quote/quote.dto";
import {
  getCompanyClientCatalog,
  getCompanyProductCatalog,
} from "../../../_actions";
import { getQuoteById } from "../../../_feature/quote/actions";
import QuoteForm from "../../_components/QuoteForm";
import ErrorState from "@/app/components/ErrorState";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const response = await getQuoteById(Number(id));

  if (!response.success) {
    return <ErrorState message={response.message || "Error al cargar la cotización"} />;
  }

  const resProducts = await getCompanyProductCatalog();
  const resClients = await getCompanyClientCatalog();

  return (
    <>
      {response.success && (
        <div className="px-5 py-10 flex">
          <QuoteForm
            optionsProducts={resProducts}
            optionsClients={resClients}
            isEdit
            dataEdit={response.data as unknown as EditQuoteDto}
          />
        </div>
      )}
    </>
  );
}
