import { useContext } from "react";
import { AuthContext } from "../contexts/authContext";

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("UserContext debe usarse dentro de el provider");
  }

  return context;
};
