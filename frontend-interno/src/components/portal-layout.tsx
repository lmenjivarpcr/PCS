import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, LogOut, UserRound, ChevronDown } from "lucide-react";
import { Toaster } from "sonner";
import { useAuth } from "@/contexts/auth-state";
import { mensajeError } from "@/services/auth/types";
import { Navigation } from "./navigation";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Tooltip } from "./ui/tooltip";
import { DropdownMenu } from "./ui/dropdown-menu";
import { Message } from "./message";
export function PortalLayout() {
  const { usuario, cerrarSesion } = useAuth();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const title =
    pathname === "/usuarios-internos" ? "Usuarios internos" : "Inicio";
  async function salir() {
    setBusy(true);
    setError("");
    try {
      await cerrarSesion();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setBusy(false);
    }
  }
  if (!usuario) return null;
  return (
    <div className="min-h-svh md:grid md:grid-cols-[240px_1fr]">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-card focus:p-4"
      >
        Saltar al contenido
      </a>
      <aside className="hidden border-r bg-card p-5 md:block">
        <p className="mb-8 px-3 text-lg font-semibold tracking-widest">PCS</p>
        <Navigation permisos={usuario.permisos} />
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <Tooltip text="Abrir menú">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Abrir menú"
                aria-expanded={menu}
                onClick={() => setMenu(true)}
              >
                <Menu />
              </Button>
            </Tooltip>
            <span className="text-sm text-muted-foreground">
              Portal interno
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu
              trigger={
                <Button variant="ghost">
                  <UserRound />
                  <span className="max-w-24 truncate sm:max-w-40">
                    {usuario.nombre}
                  </span>
                  <ChevronDown />
                </Button>
              }
            >
              <p className="font-medium">{usuario.perfil}</p>
              <p className="mt-1 break-all text-muted-foreground">
                {usuario.correo}
              </p>
            </DropdownMenu>
            <Button variant="outline" disabled={busy} onClick={salir}>
              <LogOut />
              <span className="sr-only sm:not-sr-only">
                {busy ? "Cerrando sesión…" : "Cerrar sesión"}
              </span>
            </Button>
          </div>
        </header>
        <main id="contenido" className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
          <Message>{error}</Message>
          <div>
            <nav
              aria-label="Migas de pan"
              className="mb-3 flex gap-2 text-sm text-muted-foreground"
            >
              <Link to="/" aria-current={pathname === "/" ? "page" : undefined}>
                Inicio
              </Link>
              {pathname !== "/" && (
                <>
                  <span aria-hidden="true">/</span>
                  <span aria-current="page">{title}</span>
                </>
              )}
            </nav>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          </div>
          <Outlet />
        </main>
      </div>
      <Dialog
        open={menu}
        onOpenChange={setMenu}
        title="PCS"
        description="Menú del portal interno"
      >
        <Navigation
          permisos={usuario.permisos}
          onNavigate={() => setMenu(false)}
        />
      </Dialog>
      <Toaster />
    </div>
  );
}
