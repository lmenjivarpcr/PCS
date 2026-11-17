import {
  UsuariosError,
  type UsuariosService,
  type Perfil,
  type UsuarioInterno,
  type PersonaDirectorio,
  type FiltrosUsuarios,
  type RegistrarUsuario,
  type EditarUsuario,
} from "./types";
const perfiles: Perfil[] = [
  { id: 1, codigo: "administrador", nombre: "Administrador" },
  { id: 2, codigo: "gerente", nombre: "Gerente" },
  { id: 3, codigo: "analista", nombre: "Analista" },
];
const nombres = [
  "Ana Torres",
  "Bruno Rivas",
  "Carla Méndez",
  "Diego Salas",
  "Elena Castro",
  "Felipe Luna",
  "Gabriela Soto",
  "Hugo Vega",
  "Inés Lara",
  "Javier Mora",
  "Karla Cruz",
  "Luis Peña",
  "Marta León",
  "Nicolás Paz",
  "Olivia Reyes",
  "Pablo Ríos",
  "Raquel Vidal",
  "Sergio Gil",
  "Teresa Sol",
  "Ulises Cano",
  "Valeria Ruiz",
  "Walter Ponce",
  "Ximena Silva",
  "Yolanda Marín",
  "Zoe Flores",
  "Adriana Campos",
  "Andrés Molina",
  "Beatriz Duarte",
];
const copia = <T>(valor: T): T => structuredClone(valor);
export class SimulatedUsuariosService implements UsuariosService {
  private personas = nombres.map((nombre, i): PersonaDirectorio => ({
    id_externo: `microsoft-${i + 1}`,
    nombre,
    correo:
      nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replaceAll(" ", ".") + "@pcslatam.com",
    cargo: i === 0 ? "Administración" : "Consultoría",
    pais: ["El Salvador", "Perú", "Colombia"][i % 3],
    registrado: i < 25,
  }));
  private usuarios: UsuarioInterno[] = this.personas
    .slice(0, 25)
    .map((persona, i) => ({
      id: i + 1,
      nombre: persona.nombre,
      correo: persona.correo,
      perfil: perfiles[i === 0 ? 0 : (i % 2) + 1],
      activo: i === 0 || i % 9 !== 0,
      version: 1,
      creado_en: "2026-11-01T14:00:00Z",
      actualizado_en: "2026-11-17T14:30:00Z",
    }));
  private latencia: number;
  constructor(latencia = 450) {
    this.latencia = latencia;
  }
  private async esperar() {
    await new Promise((resolve) => setTimeout(resolve, this.latencia));
  }
  async perfiles() {
    await this.esperar();
    return { data: copia(perfiles) };
  }
  async listar(filtros: FiltrosUsuarios) {
    await this.esperar();
    const buscar = filtros.buscar?.trim().toLocaleLowerCase() ?? "";
    const data = this.usuarios.filter(
      (u) =>
        (!buscar ||
          `${u.nombre} ${u.correo}`.toLocaleLowerCase().includes(buscar)) &&
        (filtros.perfil_id === undefined ||
          u.perfil.id === filtros.perfil_id) &&
        (filtros.activo === undefined || u.activo === filtros.activo),
    );
    const pagina = Math.max(1, filtros.pagina ?? 1);
    return {
      data: copia(data.slice((pagina - 1) * 20, pagina * 20)),
      meta: {
        pagina,
        por_pagina: 20,
        total: data.length,
        ultima_pagina: Math.max(1, Math.ceil(data.length / 20)),
      },
    };
  }
  async directorio(buscar: string) {
    await this.esperar();
    if (buscar.trim().length < 3)
      throw new UsuariosError(422, "Escribe al menos 3 caracteres.");
    return {
      data: copia(
        this.personas.filter((p) =>
          `${p.nombre} ${p.correo}`
            .toLocaleLowerCase()
            .includes(buscar.trim().toLocaleLowerCase()),
        ),
      ),
    };
  }
  async registrar(datos: RegistrarUsuario) {
    await this.esperar();
    const persona = this.personas.find(
      (p) => p.id_externo === datos.id_externo,
    );
    const perfil = perfiles.find((p) => p.id === datos.perfil_id);
    if (!persona || persona.registrado || !perfil)
      throw new UsuariosError(
        422,
        "La persona ya está registrada o los datos no son válidos.",
      );
    const fecha = new Date().toISOString();
    const usuario = {
      id: Math.max(...this.usuarios.map((u) => u.id)) + 1,
      nombre: persona.nombre,
      correo: persona.correo,
      perfil,
      activo: true,
      version: 1,
      creado_en: fecha,
      actualizado_en: fecha,
    };
    this.usuarios.push(usuario);
    persona.registrado = true;
    return copia(usuario);
  }
  async editar(id: number, datos: EditarUsuario) {
    await this.esperar();
    const usuario = this.usuarios.find((u) => u.id === id);
    if (!usuario) throw new UsuariosError(404, "No se encontró el usuario.");
    if (usuario.version !== datos.version)
      throw new UsuariosError(
        409,
        "Otro usuario modificó este registro. Recarga los datos antes de continuar.",
      );
    const perfil = perfiles.find(
      (p) => p.id === (datos.perfil_id ?? usuario.perfil.id),
    );
    if (!perfil) throw new UsuariosError(422, "Selecciona un perfil válido.");
    const activo = datos.activo ?? usuario.activo;
    if (
      usuario.activo &&
      usuario.perfil.codigo === "administrador" &&
      (!activo || perfil.codigo !== "administrador") &&
      this.usuarios.filter(
        (u) => u.activo && u.perfil.codigo === "administrador",
      ).length === 1
    )
      throw new UsuariosError(
        422,
        "Debe permanecer al menos un administrador activo.",
      );
    Object.assign(usuario, {
      perfil,
      activo,
      version: usuario.version + 1,
      actualizado_en: new Date().toISOString(),
    });
    return copia(usuario);
  }
}
