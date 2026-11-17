export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
}
export interface DesafioCodigo {
  correo: string;
  expira_en: number;
  reenviar_en: number;
}
export interface AuthService {
  iniciarSesion(correo: string, contrasena: string): Promise<DesafioCodigo>;
  verificarCodigo(codigo: string): Promise<Usuario>;
  reenviarCodigo(): Promise<DesafioCodigo>;
  solicitarRestablecimiento(correo: string): Promise<void>;
  restablecerContrasena(
    token: string,
    correo: string,
    contrasena: string,
  ): Promise<void>;
  cerrarSesion(): Promise<void>;
}
export type CodigoError =
  | "credenciales"
  | "inactivo"
  | "intentos"
  | "codigo-incorrecto"
  | "codigo-vencido"
  | "enlace-invalido"
  | "espera";
export class AuthError extends Error {
  readonly codigo: CodigoError;
  readonly intentosRestantes?: number;
  constructor(
    codigo: CodigoError,
    mensaje: string,
    intentosRestantes?: number,
  ) {
    super(mensaje);
    this.name = "AuthError";
    this.codigo = codigo;
    this.intentosRestantes = intentosRestantes;
  }
}
export function mensajeError(error: unknown): string {
  return error instanceof AuthError
    ? error.message
    : "No pudimos conectarnos. Inténtalo de nuevo.";
}
