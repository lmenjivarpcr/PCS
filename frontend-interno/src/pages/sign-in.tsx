import { useState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/auth-state";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Message } from "@/components/message";
import { mensajeError } from "@/services/auth/types";

export function SignIn() {
  const { iniciarSesionMicrosoft } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  async function ingresar() {
    setCargando(true);
    setError("");
    try {
      await iniciarSesionMicrosoft();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }
  return (
    <AuthLayout
      title="Ingresa a tu espacio"
      description="Usa tu cuenta de Microsoft de la organización para acceder al portal interno de PCS."
    >
      <div className="space-y-6" aria-busy={cargando}>
        <Message>{error}</Message>
        <Button className="w-full" disabled={cargando} onClick={ingresar}>
          {cargando ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="motion-safe:animate-spin"
              />
              Conectando…
            </>
          ) : (
            <>
              <LogIn aria-hidden="true" />
              Entrar con Microsoft
            </>
          )}
        </Button>
        <p className="border-t pt-5 text-center text-xs leading-5 text-muted-foreground">
          El acceso está disponible para las cuentas habilitadas en PCS. Si
          necesitas ayuda, contacta al administrador.
        </p>
      </div>
    </AuthLayout>
  );
}
