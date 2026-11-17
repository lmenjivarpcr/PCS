import { describe, expect, it } from "vitest";
import { SimulatedUsuariosService } from "@/services/usuarios/simulated";
import { SimulatedAuthService } from "@/services/auth/simulated";
describe("Contrato simulado de usuarios", () => {
  it("pagina de 20 y filtros combinados", async () => {
    const servicio = new SimulatedUsuariosService(0);
    const primera = await servicio.listar({});
    const segunda = await servicio.listar({ pagina: 2 });
    expect(primera.data).toHaveLength(20);
    expect(segunda.data).toHaveLength(5);
    expect(primera.meta).toEqual({
      pagina: 1,
      por_pagina: 20,
      total: 25,
      ultima_pagina: 2,
    });
    expect(
      (await servicio.listar({ buscar: "bruno", perfil_id: 3, activo: true }))
        .data,
    ).toHaveLength(1);
  });
  it("rechaza duplicados, búsquedas cortas, perfil inválido y cambios del último administrador", async () => {
    const servicio = new SimulatedUsuariosService(0);
    await expect(servicio.directorio("an")).rejects.toMatchObject({
      status: 422,
    });
    await expect(
      servicio.registrar({ id_externo: "microsoft-1", perfil_id: 2 }),
    ).rejects.toMatchObject({ status: 422 });
    await expect(
      servicio.editar(1, { perfil_id: 2, version: 1 }),
    ).rejects.toMatchObject({ status: 422 });
    await expect(
      servicio.editar(1, { activo: false, version: 1 }),
    ).rejects.toMatchObject({ status: 422 });
    await expect(
      servicio.editar(2, { perfil_id: 99, version: 1 }),
    ).rejects.toMatchObject({ status: 422 });
  });
  it("permite relevar al administrador y rechaza versiones antiguas sin mutar", async () => {
    const servicio = new SimulatedUsuariosService(0);
    await servicio.editar(2, { perfil_id: 1, version: 1 });
    const actualizado = await servicio.editar(1, { activo: false, version: 1 });
    expect(actualizado.version).toBe(2);
    expect(actualizado.activo).toBe(false);
    await expect(
      servicio.editar(1, { activo: true, version: 1 }),
    ).rejects.toMatchObject({ status: 409 });
    expect((await servicio.listar({ buscar: "Ana Torres" })).data[0]).toEqual(
      actualizado,
    );
  });
  it("sesión consulta expone solo lectura", async () => {
    window.history.replaceState(null, "", "/ingresar?simular=consulta");
    try {
      expect(
        (await new SimulatedAuthService().iniciarSesionMicrosoft()).permisos,
      ).toEqual(["usuarios.internos.leer"]);
    } finally {
      window.history.replaceState(null, "", "/");
    }
  });
});
