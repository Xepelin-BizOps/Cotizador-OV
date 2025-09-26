export const dynamic = 'force-dynamic';
export const revalidate = 0;

import FxepelinWallet from "./_components/FxepelinWallet";
import FxepelinTop from "./_components/FxepelinTop";
import { CombinedProvider } from "./_contexts/CombinedProvider";
import "./_styles/fxepelin.css";

export default async function FxepelinPage() {
  return (
    <CombinedProvider>
      <FxepelinWallet />
    </CombinedProvider>
  );
}
