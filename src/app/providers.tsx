import { ConfigProvider } from "antd";
import { themeConfigAnt } from "./themeConfigAnt";
import AuthContextProvider from "./contexts/authContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthContextProvider>
        <ConfigProvider theme={themeConfigAnt}>{children}</ConfigProvider>
      </AuthContextProvider>
    </>
  );
}
