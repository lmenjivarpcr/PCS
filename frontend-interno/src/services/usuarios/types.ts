export interface Perfil {
  id: number;
  codigo: string;
  nombre: string;
}
export interface UsuarioInterno {
  id: number;
  nombre: string;
  correo: string;
  perfil: Perfil;
  activo: boolean;
  version: number;
  creado_en: string;
  actualizado_en: string;
}
export interface PersonaDirectorio {
  id_externo: string;
  nombre: string;
  correo: string;
  cargo: string;
  pais: string;
  registrado: boolean;
}
export interface Datos<T> {
  data: T[];
}
export interface ListadoUsuarios extends Datos<UsuarioInterno> {
  meta: {
    pagina: number;
    por_pagina: number;
    total: number;
    ultima_pagina: number;
  };
}
export interface FiltrosUsuarios {
  buscar?: string;
  perfil_id?: number;
  activo?: boolean;
  pagina?: number;
}
export interface RegistrarUsuario {
  id_externo: string;
  perfil_id: number;
}
export interface EditarUsuario {
  perfil_id?: number;
  activo?: boolean;
  version: number;
}
export interface UsuariosService {
  perfiles(): Promise<Datos<Perfil>>;
  listar(filtros: FiltrosUsuarios): Promise<ListadoUsuarios>;
  directorio(buscar: string): Promise<Datos<PersonaDirectorio>>;
  registrar(datos: RegistrarUsuario): Promise<UsuarioInterno>;
  editar(id: number, datos: EditarUsuario): Promise<UsuarioInterno>;
}
export class UsuariosError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "UsuariosError";
    this.status = status;
  }
}
export function errorUsuarios(error: unknown) {
  return error instanceof UsuariosError
    ? error.message
    : "No pudimos completar la operación. Inténtalo de nuevo.";
}
