import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "@/App";
import { AuthProvider } from "@/contexts/auth-context";
import { SimulatedAuthService } from "@/services/auth/simulated";

function iniciar(ruta = "/ingresar") {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider servicio={new SimulatedAuthService()}>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
  return user;
}
describe("Acceso del cliente", () => {
  it("valida correo y contraseña sin enviar el formulario", async () => {
    const user = iniciar();
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(
      await screen.findByText("Ingresa un correo válido."),
    ).toBeInTheDocument();
    expect(screen.getByText("Ingresa tu contraseña.")).toBeInTheDocument();
    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "correo-invalido",
    );
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByText("Ingresa un correo válido.")).toBeInTheDocument();
  });
  it("redirige el paso del código sin identificación previa", async () => {
    iniciar("/ingresar/codigo");
    expect(
      await screen.findByRole("heading", { name: "Ingresa a tu cuenta" }),
    ).toBeInTheDocument();
  });
  it("protege el inicio sin una sesión", async () => {
    iniciar("/");
    expect(
      await screen.findByRole("heading", { name: "Ingresa a tu cuenta" }),
    ).toBeInTheDocument();
  });
  it("completa ingreso, pega el PIN, entra y cierra la sesión", async () => {
    const user = iniciar();
    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "cliente@ejemplo.test",
    );
    await user.type(
      screen.getByLabelText("Contraseña", { exact: true }),
      "Prueba123!",
    );
    await user.click(
      screen.getByRole("button", { name: "Mostrar contraseña" }),
    );
    expect(
      screen.getByLabelText("Contraseña", { exact: true }),
    ).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    const codigo = await screen.findByLabelText(
      "Código de verificación",
      {},
      { timeout: 2500 },
    );
    expect(screen.getByText("c***@ejemplo.test")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Reenviar código/ }),
    ).toBeDisabled();
    await user.click(codigo);
    await user.paste("123456");
    expect(
      await screen.findByRole("heading", { name: "Inicio" }, { timeout: 2500 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Cliente de prueba/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(
      await screen.findByRole(
        "heading",
        { name: "Ingresa a tu cuenta" },
        { timeout: 2500 },
      ),
    ).toBeInTheDocument();
  });
  it("muestra una respuesta neutra en recuperación", async () => {
    const user = iniciar("/recuperar-contrasena");
    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "desconocido@ejemplo.test",
    );
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));
    expect(
      await screen.findByText(
        /Si el correo está registrado/,
        {},
        { timeout: 2500 },
      ),
    ).toBeInTheDocument();
  });
  it("valida coincidencia y restablece con el token del simulador", async () => {
    const user = iniciar(
      "/restablecer-contrasena?token=token-valido&correo=cliente%40ejemplo.test",
    );
    await user.type(
      screen.getByLabelText("Nueva contraseña", { exact: true }),
      "Nueva123!",
    );
    await user.type(
      screen.getByLabelText("Confirmar contraseña", { exact: true }),
      "Distinta123!",
    );
    await user.click(
      screen.getByRole("button", { name: "Guardar contraseña" }),
    );
    expect(
      await screen.findByText("Las contraseñas no coinciden."),
    ).toBeInTheDocument();
    await user.clear(
      screen.getByLabelText("Confirmar contraseña", { exact: true }),
    );
    await user.type(
      screen.getByLabelText("Confirmar contraseña", { exact: true }),
      "Nueva123!",
    );
    await user.click(
      screen.getByRole("button", { name: "Guardar contraseña" }),
    );
    expect(
      await screen.findByRole(
        "heading",
        { name: "Contraseña actualizada" },
        { timeout: 2500 },
      ),
    ).toBeInTheDocument();
  });
  it("informa si falta el token del enlace", () => {
    iniciar("/restablecer-contrasena");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "El enlace venció o no es válido.",
    );
  });
});
