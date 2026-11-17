import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { GuestRoute, ProtectedRoute } from "@/components/route-guards";
import { SignIn } from "@/pages/sign-in";
import { Home } from "@/pages/home";
import { Code } from "@/pages/code";
import { Recover } from "@/pages/recover";
import { Reset } from "@/pages/reset";
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = (pathname === "/" ? "Inicio" : "Acceso") + " · PCS";
    document.querySelector("h1")?.setAttribute("tabindex", "-1");
    document.querySelector("h1")?.focus();
  }, [pathname]);
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/ingresar" element={<SignIn />} />
        <Route path="/ingresar/codigo" element={<Code />} />
        <Route path="/recuperar-contrasena" element={<Recover />} />
        <Route path="/restablecer-contrasena" element={<Reset />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
