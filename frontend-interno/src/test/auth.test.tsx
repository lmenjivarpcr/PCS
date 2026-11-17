import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "@/App";
import { AuthProvider } from "@/contexts/auth-context";
import { SimulatedAuthService } from "@/services/auth/simulated";

function iniciar() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider servicio={new SimulatedAuthService()}>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
  return userEvent.setup();
}
afterEach(() => window.history.replaceState(null, "", "/"));
describe("Acceso interno", () => {
  it("protege Inicio, ingresa con Microsoft y cierra sesión", async () => {
    const user = iniciar();
    expect(
      screen.getByRole("heading", { name: "Ingresa a tu espacio" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Entrar con Microsoft" }),
    );
    expect(screen.getByRole("button", { name: "Conectando…" })).toBeDisabled();
    expect(
      await screen.findByRole("heading", { name: "Inicio" }, { timeout: 2500 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Usuario de prueba/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(
      await screen.findByRole(
        "button",
        { name: "Entrar con Microsoft" },
        { timeout: 2500 },
      ),
    ).toBeInTheDocument();
  });
  it("muestra cuenta no registrada desde el simulador", async () => {
    window.history.replaceState(null, "", "/ingresar?simular=no-registrado");
    const user = iniciar();
    await user.click(
      screen.getByRole("button", { name: "Entrar con Microsoft" }),
    );
    expect(
      await screen.findByRole("alert", {}, { timeout: 2500 }),
    ).toHaveTextContent(
      "Tu cuenta no está registrada o está inactiva en PCS. Contacta al administrador.",
    );
  });
  it("permite reintentar un error de conexión", async () => {
    window.history.replaceState(null, "", "/ingresar?simular=conexion");
    const user = iniciar();
    await user.click(
      screen.getByRole("button", { name: "Entrar con Microsoft" }),
    );
    expect(
      await screen.findByRole("alert", {}, { timeout: 2500 }),
    ).toHaveTextContent("No pudimos conectarnos con Microsoft.");
    expect(
      screen.getByRole("button", { name: "Entrar con Microsoft" }),
    ).toBeEnabled();
  });
});
