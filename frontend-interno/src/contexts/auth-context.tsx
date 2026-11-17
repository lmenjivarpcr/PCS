import { AuthContext } from "./auth-state";
import { useState, type ReactNode } from "react";
import { authService } from "@/services/auth";
import type { AuthService, Usuario } from "@/services/auth/types";
export function AuthProvider({
  children,
  servicio = authService,
}: {
  children: ReactNode;
  servicio?: AuthService;
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  async function iniciarSesionMicrosoft() {
    setUsuario(await servicio.iniciarSesionMicrosoft());
  }
  async function cerrarSesion() {
    await servicio.cerrarSesion();
    setUsuario(null);
  }
  return (
    <AuthContext.Provider
      value={{ usuario, iniciarSesionMicrosoft, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  );
}
