import { createContext, useContext } from "react";
import type {
  AuthService,
  DesafioCodigo,
  Usuario,
} from "@/services/auth/types";
interface Desafio extends DesafioCodigo {
  vence: number;
  reenvio: number;
}
interface AuthContextValue {
  usuario: Usuario | null;
  desafio: Desafio | null;
  servicio: AuthService;
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  verificarCodigo: (codigo: string) => Promise<void>;
  reenviarCodigo: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
  descartarDesafio: () => void;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Falta AuthProvider");
  return value;
}
