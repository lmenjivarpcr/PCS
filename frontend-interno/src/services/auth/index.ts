import type { AuthService } from "./types";
import { SimulatedAuthService } from "./simulated";
// Punto único de sustitución por el adaptador MSAL + Laravel.
export const authService: AuthService = new SimulatedAuthService();
