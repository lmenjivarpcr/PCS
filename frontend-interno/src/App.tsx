import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { GuestRoute, ProtectedRoute } from "@/components/route-guards";
import { SignIn } from "@/pages/sign-in";
import { Home } from "@/pages/home";

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
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
