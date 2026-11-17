import { AuthContext } from "./auth-state";
import { useState, type ReactNode } from "react";
import { authService } from "@/services/auth";
import type {
  AuthService,
  DesafioCodigo,
  Usuario,
} from "@/services/auth/types";

export function AuthProvider({
  children,
  servicio = authService,
}: {
  children: ReactNode;
  servicio?: AuthService;
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [desafio, setDesafio] = useState<
    (DesafioCodigo & { vence: number; reenvio: number }) | null
  >(null);
  function guardarDesafio(datos: DesafioCodigo) {
    setDesafio({
      ...datos,
      vence: Date.now() + datos.expira_en * 1000,
      reenvio: Date.now() + datos.reenviar_en * 1000,
    });
  }
  async function iniciarSesion(correo: string, contrasena: string) {
    setDesafio(null);
    guardarDesafio(await servicio.iniciarSesion(correo, contrasena));
  }
  async function verificarCodigo(codigo: string) {
    setUsuario(await servicio.verificarCodigo(codigo));
    setDesafio(null);
  }
  async function reenviarCodigo() {
    guardarDesafio(await servicio.reenviarCodigo());
  }
  async function cerrarSesion() {
    await servicio.cerrarSesion();
    setUsuario(null);
    setDesafio(null);
  }
  return (
    <AuthContext.Provider
      value={{
        usuario,
        desafio,
        servicio,
        iniciarSesion,
        verificarCodigo,
        reenviarCodigo,
        cerrarSesion,
        descartarDesafio: () => setDesafio(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
