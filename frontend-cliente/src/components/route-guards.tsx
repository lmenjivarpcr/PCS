import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth-state";
export function ProtectedRoute() {
  return useAuth().usuario ? <Outlet /> : <Navigate to="/ingresar" replace />;
}
export function GuestRoute() {
  return useAuth().usuario ? <Navigate to="/" replace /> : <Outlet />;
}
