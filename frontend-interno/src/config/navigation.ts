import { House, Users, type LucideIcon } from "lucide-react";
interface NavigationItem {
  label: string;
  path: string;
  permission: string | null;
  section?: string;
  icon: LucideIcon;
}
export const navigation: NavigationItem[] = [
  { label: "Inicio", path: "/", permission: null, icon: House },
  {
    label: "Usuarios internos",
    path: "/usuarios-internos",
    permission: "usuarios.internos.leer",
    section: "Administración",
    icon: Users,
  },
  // Aquí irán Perfiles y permisos, Catálogos y Bitácora, cada uno con su permiso.
];
