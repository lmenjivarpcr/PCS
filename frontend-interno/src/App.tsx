import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { GuestRoute, ProtectedRoute } from "@/components/route-guards";
import { SignIn } from "@/pages/sign-in";
import { Home } from "@/pages/home";
import { PortalLayout } from "@/components/portal-layout";
import { UsuariosInternos } from "@/pages/usuarios-internos";
import { useAuth } from "@/contexts/auth-state";

function UsuariosRoute() {
  return useAuth().usuario?.permisos.includes("usuarios.internos.leer") ? (
    <UsuariosInternos />
  ) : (
    <Navigate to="/" replace />
  );
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title =
      (pathname === "/"
        ? "Inicio"
        : pathname === "/usuarios-internos"
          ? "Usuarios internos"
          : "Acceso") + " · PCS";
    document.querySelector("h1")?.setAttribute("tabindex", "-1");
    document.querySelector("h1")?.focus();
  }, [pathname]);
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/ingresar" element={<SignIn />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<PortalLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/usuarios-internos" element={<UsuariosRoute />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
