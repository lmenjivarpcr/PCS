import { describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/auth-state";
import type { Usuario } from "@/services/auth/types";
import { SimulatedUsuariosService } from "@/services/usuarios/simulated";
import type {
  Datos,
  PersonaDirectorio,
  UsuariosService,
} from "@/services/usuarios/types";
import { UsuariosInternos } from "@/pages/usuarios-internos";
import { Navigation } from "@/components/navigation";
import { EditarDialog } from "@/components/usuarios/editar-dialog";
import App from "@/App";
const administrador: Usuario = {
  id: "prueba",
  nombre: "Persona de prueba",
  correo: "prueba@pcslatam.com",
  perfil: "Administrador",
  permisos: [
    "usuarios.internos.leer",
    "usuarios.internos.crear",
    "usuarios.internos.editar",
  ],
};
function Location() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output aria-label="URL">{location.search}</output>
      <button onClick={() => navigate(-1)}>Volver</button>
    </>
  );
}
function iniciar({
  servicio = new SimulatedUsuariosService(0),
  permisos = administrador.permisos,
  url = "/usuarios-internos",
  app = false,
}: {
  servicio?: UsuariosService;
  permisos?: string[];
  url?: string;
  app?: boolean;
} = {}) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <AuthContext.Provider
        value={{
          usuario: { ...administrador, permisos },
          iniciarSesionMicrosoft: async () => {},
          cerrarSesion: async () => {},
        }}
      >
        {app ? <App /> : <UsuariosInternos servicio={servicio} />}
        <Location />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
  return userEvent.setup();
}
async function listado() {
  await screen.findByText(/usuarios · Página/);
}
describe("Portal y permisos", () => {
  it("oculta navegación sin permiso y muestra Inicio", () => {
    render(
      <MemoryRouter>
        <Navigation permisos={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Inicio" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Usuarios internos" }),
    ).not.toBeInTheDocument();
  });
  it("muestra navegación con permiso", () => {
    render(
      <MemoryRouter>
        <Navigation permisos={["usuarios.internos.leer"]} />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("link", { name: "Usuarios internos" }),
    ).toBeInTheDocument();
  });
  it("impide entrar directamente sin permiso", async () => {
    iniciar({ permisos: [], app: true });
    expect(
      await screen.findByRole("heading", { name: "Inicio" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Usuarios internos" }),
    ).not.toBeInTheDocument();
  });
  it("consulta no ve crear ni editar", async () => {
    iniciar({ permisos: ["usuarios.internos.leer"] });
    await listado();
    expect(
      screen.queryByRole("button", { name: "Registrar usuario" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Editar a/ }),
    ).not.toBeInTheDocument();
  });
  it("menú móvil cierra con Escape", async () => {
    const user = iniciar({ url: "/", app: true });
    await user.click(screen.getByRole("button", { name: "Abrir menú" }));
    expect(screen.getByRole("dialog", { name: "PCS" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Abrir menú" })).toHaveFocus(),
    );
  });
});
describe("Filtros y listado", () => {
  it("espera la búsqueda, actualiza URL, vuelve a página 1 y restaura con historial", async () => {
    const user = iniciar({ url: "/usuarios-internos?pagina=2" });
    await listado();
    await user.type(
      screen.getByRole("textbox", { name: "Buscar usuario" }),
      "Ana",
    );
    expect(screen.getByLabelText("URL")).toHaveTextContent("pagina=2");
    await waitFor(() =>
      expect(screen.getByLabelText("URL")).toHaveTextContent("buscar=Ana"),
    );
    expect(screen.getByLabelText("URL")).toHaveTextContent("pagina=1");
    await user.click(screen.getByRole("button", { name: "Volver" }));
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "Buscar usuario" }),
      ).toHaveValue(""),
    );
    expect(screen.getByLabelText("URL")).toHaveTextContent("pagina=2");
  });
  it("perfil, estado y limpiar se sincronizan con la URL", async () => {
    const user = iniciar({ url: "/usuarios-internos?pagina=2" });
    await listado();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Perfil" }),
      "2",
    );
    expect(screen.getByLabelText("URL")).toHaveTextContent("perfil_id=2");
    expect(screen.getByLabelText("URL")).toHaveTextContent("pagina=1");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Estado" }),
      "0",
    );
    expect(screen.getByLabelText("URL")).toHaveTextContent("activo=0");
    await user.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(screen.getByLabelText("URL")).toHaveTextContent("");
    expect(screen.getByRole("combobox", { name: "Estado" })).toHaveValue("1");
  });
  it("muestra error del listado y reintenta", async () => {
    const servicio = new SimulatedUsuariosService(0);
    vi.spyOn(servicio, "listar").mockRejectedValueOnce(new Error("offline"));
    const user = iniciar({ servicio });
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    await listado();
  });
  it("muestra vacío sin coincidencias", async () => {
    iniciar({ url: "/usuarios-internos?buscar=persona-inexistente" });
    expect(
      await screen.findByText("No hay usuarios que coincidan con los filtros."),
    ).toBeInTheDocument();
  });
});
describe("Registro en directorio", () => {
  it("descarta respuestas antiguas al cambiar de búsqueda", async () => {
    const servicio = new SimulatedUsuariosService(0);
    const anterior = await servicio.directorio("Ana");
    let resolver: (datos: Datos<PersonaDirectorio>) => void = () => {
      throw new Error("Solicitud no iniciada");
    };
    const pendiente = new Promise<Datos<PersonaDirectorio>>((resolve) => {
      resolver = resolve;
    });
    const consulta = vi
      .spyOn(servicio, "directorio")
      .mockImplementationOnce(() => pendiente);
    const user = iniciar({ servicio });
    await listado();
    await user.click(screen.getByRole("button", { name: "Registrar usuario" }));
    const input = screen.getByRole("textbox", { name: "Buscar en Microsoft" });
    await user.type(input, "Ana");
    await waitFor(() => expect(consulta).toHaveBeenCalledWith("Ana"));
    await user.clear(input);
    await user.type(input, "Adriana");
    expect(
      await screen.findByRole("button", { name: /Adriana Campos/ }),
    ).toBeEnabled();
    await act(async () => {
      resolver(anterior);
      await pendiente;
    });
    expect(
      screen.queryByRole("button", { name: /Ana Torres/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Adriana Campos/ }),
    ).toBeEnabled();
  });
  it("deshabilita registrados, permite teclado y registra una persona nueva", async () => {
    const servicio = new SimulatedUsuariosService(0);
    const registrar = vi.spyOn(servicio, "registrar");
    const directorio = vi.spyOn(servicio, "directorio");
    const user = iniciar({ servicio });
    await listado();
    await user.click(screen.getByRole("button", { name: "Registrar usuario" }));
    const dialog = within(screen.getByRole("dialog"));
    const input = dialog.getByRole("textbox", { name: "Buscar en Microsoft" });
    await user.type(input, "an");
    expect(directorio).not.toHaveBeenCalled();
    await user.type(input, "a");
    expect(
      await dialog.findByRole("button", { name: /Ana Torres.*Ya registrado/ }),
    ).toBeDisabled();
    await user.clear(input);
    await user.type(input, "Adriana");
    const persona = await dialog.findByRole("button", {
      name: /Adriana Campos/,
    });
    await user.keyboard("{ArrowDown}");
    expect(persona).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.selectOptions(
      dialog.getByRole("combobox", { name: "Perfil" }),
      "3",
    );
    await user.click(dialog.getByRole("button", { name: "Registrar" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(registrar).toHaveBeenCalledWith({
      id_externo: "microsoft-26",
      perfil_id: 3,
    });
    expect((await servicio.directorio("Adriana")).data[0].registrado).toBe(
      true,
    );
  });
  it("muestra error del directorio y permite reintentar", async () => {
    const servicio = new SimulatedUsuariosService(0);
    vi.spyOn(servicio, "directorio").mockRejectedValueOnce(
      new Error("offline"),
    );
    const user = iniciar({ servicio });
    await listado();
    await user.click(screen.getByRole("button", { name: "Registrar usuario" }));
    await user.type(
      screen.getByRole("textbox", { name: "Buscar en Microsoft" }),
      "Adriana",
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos");
    await user.click(
      screen.getByRole("button", { name: "Reintentar búsqueda" }),
    );
    expect(
      await screen.findByRole("button", { name: /Adriana Campos/ }),
    ).toBeEnabled();
  });
});
describe("Edición", () => {
  it("409 permite recargar y guardar con la versión vigente", async () => {
    const servicio = new SimulatedUsuariosService(0);
    const stale = (await servicio.listar({ buscar: "Bruno" })).data[0];
    await servicio.editar(stale.id, { perfil_id: 3, version: stale.version });
    const onSuccess = vi.fn();
    render(
      <EditarDialog
        servicio={servicio}
        usuario={stale}
        perfiles={(await servicio.perfiles()).data}
        onClose={() => {}}
        onSuccess={onSuccess}
      />,
    );
    const user = userEvent.setup();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Perfil" }),
      "1",
    );
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Otro usuario modificó",
    );
    await user.click(screen.getByRole("button", { name: "Recargar datos" }));
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Perfil" })).toHaveValue("3"),
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Perfil" }),
      "2",
    );
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect((await servicio.listar({ buscar: "Bruno" })).data[0].version).toBe(
      3,
    );
  });
  it("422 se muestra dentro del diálogo al desactivar el último administrador", async () => {
    const servicio = new SimulatedUsuariosService(0);
    const user = iniciar({ servicio });
    await listado();
    await user.click(
      screen.getAllByRole("button", { name: "Editar a Ana Torres" })[0],
    );
    await user.click(
      screen.getByRole("button", { name: "Desactivar usuario" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    const dialog = within(
      screen.getByRole("dialog", { name: "Editar usuario" }),
    );
    expect(await dialog.findByRole("alert")).toHaveTextContent(
      "Debe permanecer al menos un administrador activo",
    );
    expect(
      (await servicio.listar({ buscar: "Ana Torres" })).data[0].activo,
    ).toBe(true);
  });
});
