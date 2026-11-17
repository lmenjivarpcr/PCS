import type { UsuariosService } from "./types";
import { SimulatedUsuariosService } from "./simulated";
// Único punto de sustitución por el adaptador /api/v1; las pantallas solo usan la interfaz.
export const usuariosService: UsuariosService = new SimulatedUsuariosService();
