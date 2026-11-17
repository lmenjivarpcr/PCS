import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/auth-layout";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Message } from "@/components/message";
import { useAuth } from "@/contexts/auth-state";
import { mensajeError } from "@/services/auth/types";

const schema = z.object({
  correo: z.string().trim().email("Ingresa un correo válido."),
});
export function Recover() {
  const { servicio } = useAuth();
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  async function enviar({ correo }: z.infer<typeof schema>) {
    setError("");
    try {
      await servicio.solicitarRestablecimiento(correo);
      setEnviado(true);
    } catch (e) {
      setError(mensajeError(e));
    }
  }
  return (
    <AuthLayout
      title={enviado ? "Revisa tu correo" : "Recupera tu acceso"}
      description={
        enviado
          ? "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también el correo no deseado."
          : "Ingresa tu correo y te enviaremos las instrucciones para restablecer tu contraseña."
      }
    >
      {enviado ? (
        <p role="status" className="mb-6 text-sm text-muted-foreground">
          Puedes cerrar esta ventana y revisar tu correo.
        </p>
      ) : (
        <form
          noValidate
          onSubmit={handleSubmit(enviar)}
          className="mb-6 space-y-5"
          aria-busy={isSubmitting}
        >
          <FormField
            id="correo"
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            disabled={isSubmitting}
            error={errors.correo?.message}
            {...register("correo")}
          />
          <Message>{error}</Message>
          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Enviando…" : "Enviar enlace"}
          </Button>
        </form>
      )}
      <Link to="/ingresar" className="block py-2 text-center text-sm underline">
        Volver a ingresar
      </Link>
    </AuthLayout>
  );
}
