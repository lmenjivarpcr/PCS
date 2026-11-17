import { createContext, useContext } from "react";
import type { Usuario } from "@/services/auth/types";
interface AuthContextValue {
  usuario: Usuario | null;
  iniciarSesionMicrosoft: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Falta AuthProvider");
  return value;
}
