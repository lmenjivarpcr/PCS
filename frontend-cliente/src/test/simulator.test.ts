import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SimulatedAuthService } from "@/services/auth/simulated";

// Se conserva el retardo del servicio y se avanza el reloj para no esperar minutos.
async function ejecutar<T>(promesa: Promise<T>): Promise<T> {
  const resultado = promesa.then(
    (valor) => ({ valor }),
    (error) => ({ error: error as unknown }),
  );
  await vi.advanceTimersByTimeAsync(700);
  const salida = await resultado;
  if ("error" in salida) throw salida.error;
  return salida.valor;
}
describe("Simulador de autenticación", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  it("limita credenciales incorrectas y libera el bloqueo después de un minuto", async () => {
    const servicio = new SimulatedAuthService();
    for (let i = 0; i < 4; i++)
      await expect(
        ejecutar(servicio.iniciarSesion("cliente@ejemplo.test", "incorrecta")),
      ).rejects.toMatchObject({ codigo: "credenciales" });
    await expect(
      ejecutar(servicio.iniciarSesion("cliente@ejemplo.test", "incorrecta")),
    ).rejects.toMatchObject({ codigo: "intentos" });
    await expect(
      ejecutar(servicio.iniciarSesion("cliente@ejemplo.test", "Prueba123!")),
    ).rejects.toMatchObject({ codigo: "intentos" });
    await vi.advanceTimersByTimeAsync(60_000);
    await expect(
      ejecutar(servicio.iniciarSesion("cliente@ejemplo.test", "Prueba123!")),
    ).resolves.toMatchObject({ expira_en: 300 });
  });
  it("rechaza la cuenta inactiva", async () => {
    await expect(
      ejecutar(
        new SimulatedAuthService().iniciarSesion(
          "inactivo@ejemplo.test",
          "cualquiera",
        ),
      ),
    ).rejects.toMatchObject({ codigo: "inactivo" });
  });
  it("rechaza reenvío temprano, cuenta intentos y renueva el código vencido", async () => {
    const servicio = new SimulatedAuthService();
    await ejecutar(
      servicio.iniciarSesion("cliente@ejemplo.test", "Prueba123!"),
    );
    await expect(ejecutar(servicio.reenviarCodigo())).rejects.toMatchObject({
      codigo: "espera",
    });
    await expect(
      ejecutar(servicio.verificarCodigo("000000")),
    ).rejects.toMatchObject({ intentosRestantes: 4 });
    await vi.advanceTimersByTimeAsync(300_000);
    await expect(
      ejecutar(servicio.verificarCodigo("123456")),
    ).rejects.toMatchObject({ codigo: "codigo-vencido" });
    await expect(ejecutar(servicio.reenviarCodigo())).resolves.toMatchObject({
      expira_en: 300,
      reenviar_en: 60,
    });
    await expect(
      ejecutar(servicio.verificarCodigo("123456")),
    ).resolves.toMatchObject({ nombre: "Cliente de prueba" });
  });
  it("no permite usar el PIN válido tras agotar los intentos", async () => {
    const servicio = new SimulatedAuthService();
    await ejecutar(
      servicio.iniciarSesion("cliente@ejemplo.test", "Prueba123!"),
    );
    for (let i = 0; i < 5; i++)
      await expect(
        ejecutar(servicio.verificarCodigo("000000")),
      ).rejects.toBeInstanceOf(Error);
    await expect(
      ejecutar(servicio.verificarCodigo("123456")),
    ).rejects.toMatchObject({ codigo: "intentos" });
  });
  it("invalida el token usado y acepta la nueva contraseña", async () => {
    const servicio = new SimulatedAuthService();
    await expect(
      ejecutar(
        servicio.restablecerContrasena(
          "vencido",
          "cliente@ejemplo.test",
          "Nueva123!",
        ),
      ),
    ).rejects.toMatchObject({ codigo: "enlace-invalido" });
    await ejecutar(
      servicio.restablecerContrasena(
        "token-valido",
        "cliente@ejemplo.test",
        "Nueva123!",
      ),
    );
    await expect(
      ejecutar(
        servicio.restablecerContrasena(
          "token-valido",
          "cliente@ejemplo.test",
          "Otra123!",
        ),
      ),
    ).rejects.toMatchObject({ codigo: "enlace-invalido" });
    await expect(
      ejecutar(servicio.iniciarSesion("cliente@ejemplo.test", "Nueva123!")),
    ).resolves.toMatchObject({ expira_en: 300 });
  });
});
