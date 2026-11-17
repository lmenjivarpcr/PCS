import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-state";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Message } from "@/components/message";
import { mensajeError } from "@/services/auth/types";
export function Home() {
  const { usuario, cerrarSesion } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  async function salir() {
    setCargando(true);
    setError("");
    try {
      await cerrarSesion();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }
  return (
    <AuthLayout
      title="Inicio"
      description={"Te damos la bienvenida, " + usuario?.nombre + "."}
    >
      <div className="space-y-6">
        <p className="text-sm leading-6 text-muted-foreground">
          Este será tu espacio de trabajo en PCS.
        </p>
        <Message>{error}</Message>
        <Button
          variant="outline"
          className="w-full"
          onClick={salir}
          disabled={cargando}
          aria-busy={cargando}
        >
          <LogOut aria-hidden="true" />
          {cargando ? "Cerrando sesión…" : "Cerrar sesión"}
        </Button>
      </div>
    </AuthLayout>
  );
}
