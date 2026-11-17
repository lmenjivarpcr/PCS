export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  perfil: string;
  permisos: string[];
}
export interface AuthService {
  iniciarSesionMicrosoft(): Promise<Usuario>;
  cerrarSesion(): Promise<void>;
}
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
export function mensajeError(error: unknown): string {
  return error instanceof AuthError
    ? error.message
    : "No pudimos conectarnos. Inténtalo de nuevo.";
}
