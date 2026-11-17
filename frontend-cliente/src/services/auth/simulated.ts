import { AuthError, type AuthService, type DesafioCodigo } from "./types";

/** Solo para maquetación: no envía correo ni llama a una API.
 * Pruebas: cliente@ejemplo.test / Prueba123!; inactivo@ejemplo.test.
 * PIN válido: 123456. Token válido: token-valido (un uso por instancia).
 * Cinco errores bloquean el correo durante 60 s. Cada PIN admite cinco intentos.
 * Todo vive en memoria y se pierde al recargar; no representa seguridad real.
 */
export class SimulatedAuthService implements AuthService {
  private desafio: {
    correo: string;
    vence: number;
    reenvio: number;
    intentos: number;
  } | null = null;
  private fallos = new Map<string, { cantidad: number; hasta: number }>();
  private contrasena = "Prueba123!";
  private tokenUsado = false;

  private async esperar() {
    await new Promise((resolve) => setTimeout(resolve, 650));
  }
  private crearDesafio(correo: string): DesafioCodigo {
    this.desafio = {
      correo,
      vence: Date.now() + 300_000,
      reenvio: Date.now() + 60_000,
      intentos: 5,
    };
    return { correo, expira_en: 300, reenviar_en: 60 };
  }
  async iniciarSesion(correo: string, contrasena: string) {
    await this.esperar();
    this.desafio = null;
    correo = correo.trim().toLowerCase();
    const bloqueo = this.fallos.get(correo);
    if (bloqueo && bloqueo.hasta > Date.now())
      throw new AuthError(
        "intentos",
        "Demasiados intentos. Espera un minuto antes de intentar de nuevo.",
      );
    if (correo === "inactivo@ejemplo.test")
      throw new AuthError(
        "inactivo",
        "Tu cuenta está inactiva. Contacta al administrador.",
      );
    if (correo !== "cliente@ejemplo.test" || contrasena !== this.contrasena) {
      const cantidad =
        (bloqueo && bloqueo.hasta === 0 ? bloqueo.cantidad : 0) + 1;
      this.fallos.set(correo, {
        cantidad,
        hasta: cantidad >= 5 ? Date.now() + 60_000 : 0,
      });
      if (cantidad >= 5)
        throw new AuthError(
          "intentos",
          "Demasiados intentos. Espera un minuto antes de intentar de nuevo.",
        );
      throw new AuthError(
        "credenciales",
        "El correo o la contraseña son incorrectos.",
      );
    }
    this.fallos.delete(correo);
    return this.crearDesafio(correo);
  }
  async verificarCodigo(codigo: string) {
    await this.esperar();
    const desafio = this.desafio;
    if (!desafio || Date.now() >= desafio.vence)
      throw new AuthError(
        "codigo-vencido",
        "El código venció. Solicita uno nuevo.",
      );
    if (desafio.intentos <= 0)
      throw new AuthError(
        "intentos",
        "Agotaste los intentos. Solicita un código nuevo.",
      );
    if (codigo !== "123456") {
      desafio.intentos--;
      if (desafio.intentos === 0)
        throw new AuthError(
          "intentos",
          "Agotaste los intentos. Solicita un código nuevo.",
        );
      throw new AuthError(
        "codigo-incorrecto",
        `El código es incorrecto. Te quedan ${desafio.intentos} intentos.`,
        desafio.intentos,
      );
    }
    this.desafio = null;
    return {
      id: "cliente-demo",
      nombre: "Cliente de prueba",
      correo: desafio.correo,
    };
  }
  async reenviarCodigo() {
    await this.esperar();
    if (!this.desafio)
      throw new AuthError(
        "codigo-vencido",
        "Vuelve a ingresar con tu correo y contraseña.",
      );
    if (Date.now() < this.desafio.reenvio)
      throw new AuthError("espera", "Espera antes de solicitar otro código.");
    return this.crearDesafio(this.desafio.correo);
  }
  async solicitarRestablecimiento(_correo: string) {
    await this.esperar();
  }
  async restablecerContrasena(
    token: string,
    correo: string,
    contrasena: string,
  ) {
    await this.esperar();
    if (
      token !== "token-valido" ||
      correo.trim().toLowerCase() !== "cliente@ejemplo.test" ||
      this.tokenUsado
    )
      throw new AuthError(
        "enlace-invalido",
        "El enlace venció o no es válido. Solicita uno nuevo.",
      );
    this.contrasena = contrasena;
    this.tokenUsado = true;
  }
  async cerrarSesion() {
    await this.esperar();
    this.desafio = null;
  }
}
