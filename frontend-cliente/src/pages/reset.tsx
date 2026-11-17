import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/auth-layout";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Message } from "@/components/message";
import { useAuth } from "@/contexts/auth-state";
import { AuthError, mensajeError } from "@/services/auth/types";

const schema = z
  .object({
    contrasena: z.string().min(8, "Usa al menos 8 caracteres."),
    confirmacion: z.string().min(1, "Confirma tu contraseña."),
  })
  .refine((datos) => datos.contrasena === datos.confirmacion, {
    path: ["confirmacion"],
    message: "Las contraseñas no coinciden.",
  });
export function Reset() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const correo = params.get("correo") ?? "";
  const { servicio } = useAuth();
  const [exito, setExito] = useState(false);
  const [invalido, setInvalido] = useState(
    !token || !z.string().email().safeParse(correo).success,
  );
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  async function enviar({ contrasena }: z.infer<typeof schema>) {
    setError("");
    try {
      await servicio.restablecerContrasena(token, correo, contrasena);
      setExito(true);
    } catch (e) {
      setError(mensajeError(e));
      if (e instanceof AuthError && e.codigo === "enlace-invalido")
        setInvalido(true);
    }
  }
  return (
    <AuthLayout
      title={exito ? "Contraseña actualizada" : "Crea tu nueva contraseña"}
      description={
        exito
          ? "Ya puedes ingresar con tu nueva contraseña."
          : "Elige una contraseña de al menos 8 caracteres."
      }
    >
      {exito ? (
        <div role="status">
          <Button asChild className="w-full">
            <Link to="/ingresar">Ir a ingresar</Link>
          </Button>
        </div>
      ) : invalido ? (
        <div className="space-y-5">
          <Message>
            {error || "El enlace venció o no es válido. Solicita uno nuevo."}
          </Message>
          <Button asChild variant="outline" className="w-full">
            <Link to="/recuperar-contrasena">Solicitar otro enlace</Link>
          </Button>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={handleSubmit(enviar)}
          className="space-y-5"
          aria-busy={isSubmitting}
        >
          <FormField
            id="contrasena"
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            disabled={isSubmitting}
            error={errors.contrasena?.message}
            {...register("contrasena")}
          />
          <FormField
            id="confirmacion"
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            disabled={isSubmitting}
            error={errors.confirmacion?.message}
            {...register("confirmacion")}
          />
          <Message>{error}</Message>
          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Guardando…" : "Guardar contraseña"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
