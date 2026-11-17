import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { FormField } from "@/components/form-field";
import { Message } from "@/components/message";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-state";
import { mensajeError } from "@/services/auth/types";

const schema = z.object({
  correo: z.string().trim().email("Ingresa un correo válido."),
  contrasena: z.string().min(1, "Ingresa tu contraseña."),
});
export function SignIn() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  async function enviar(datos: z.infer<typeof schema>) {
    setError("");
    try {
      await iniciarSesion(datos.correo, datos.contrasena);
      navigate("/ingresar/codigo");
    } catch (e) {
      setError(mensajeError(e));
    }
  }
  return (
    <AuthLayout
      title="Ingresa a tu cuenta"
      description="Accede a tu espacio de trabajo con tu correo y contraseña."
      step="Paso 1 de 2 · Identificación"
    >
      <form
        noValidate
        onSubmit={handleSubmit(enviar)}
        className="space-y-5"
        aria-busy={isSubmitting}
      >
        <FormField
          id="correo"
          label="Correo electrónico"
          type="email"
          autoComplete="username"
          placeholder="tu@empresa.com"
          disabled={isSubmitting}
          error={errors.correo?.message}
          {...register("correo")}
        />
        <FormField
          id="contrasena"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          disabled={isSubmitting}
          error={errors.contrasena?.message}
          {...register("contrasena")}
        />
        <div className="text-right">
          <Link
            className="text-sm font-medium underline"
            to="/recuperar-contrasena"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Message>{error}</Message>
        <Button className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle
                className="motion-safe:animate-spin"
                aria-hidden="true"
              />
              Validando…
            </>
          ) : (
            <>
              Continuar
              <ArrowRight aria-hidden="true" />
            </>
          )}
        </Button>
        <p className="text-center text-xs leading-5 text-muted-foreground">
          En el siguiente paso confirmaremos tu identidad con un código enviado
          a tu correo.
        </p>
      </form>
    </AuthLayout>
  );
}
