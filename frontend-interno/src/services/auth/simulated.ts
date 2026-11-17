import { AuthError, type AuthService } from "./types";
/** Sin Microsoft ni backend. Después se usará MSAL para obtener la identidad
 * Microsoft y Laravel para validar el usuario de PCS. Solo este simulador lee
 * ?simular=no-registrado y ?simular=conexion. La sesión se pierde al recargar.
 */
export class SimulatedAuthService implements AuthService {
  private async esperar() {
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
  async iniciarSesionMicrosoft() {
    await this.esperar();
    const escenario = new URLSearchParams(window.location.search).get(
      "simular",
    );
    if (escenario === "no-registrado")
      throw new AuthError(
        "Tu cuenta no está registrada o está inactiva en PCS. Contacta al administrador.",
      );
    if (escenario === "conexion")
      throw new AuthError(
        "No pudimos conectarnos con Microsoft. Inténtalo de nuevo.",
      );
    return {
      id: "interno-demo",
      nombre: "Usuario de prueba",
      correo: "interno@ejemplo.test",
    };
  }
  async cerrarSesion() {
    await this.esperar();
  }
}
