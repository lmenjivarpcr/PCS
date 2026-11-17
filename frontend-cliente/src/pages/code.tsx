import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { LoaderCircle, Mail } from "lucide-react";
import { useAuth } from "@/contexts/auth-state";
import { AuthError, mensajeError } from "@/services/auth/types";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Message } from "@/components/message";

function ocultarCorreo(correo: string) {
  const [nombre, dominio] = correo.split("@");
  return `${nombre.slice(0, 1)}***@${dominio}`;
}
export function Code() {
  const { desafio, verificarCodigo, reenviarCodigo, descartarDesafio } =
    useAuth();
  const navigate = useNavigate();
  const [ahora, setAhora] = useState(() => Date.now());
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [agotado, setAgotado] = useState(false);
  const [vencidoServidor, setVencidoServidor] = useState(false);
  const bloqueo = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!desafio) return <Navigate to="/ingresar" replace />;
  const restante = Math.max(0, Math.ceil((desafio.vence - ahora) / 1000));
  const espera = Math.max(0, Math.ceil((desafio.reenvio - ahora) / 1000));
  const vencido = restante === 0 || vencidoServidor;
  async function verificar(valor: string) {
    if (bloqueo.current || valor.length !== 6 || vencido || agotado) return;
    bloqueo.current = true;
    setOcupado(true);
    setError("");
    setAviso("");
    try {
      await verificarCodigo(valor);
      navigate("/", { replace: true });
    } catch (e) {
      setError(mensajeError(e));
      setCodigo("");
      if (e instanceof AuthError && e.codigo === "intentos") setAgotado(true);
      if (e instanceof AuthError && e.codigo === "codigo-vencido")
        setVencidoServidor(true);
    } finally {
      bloqueo.current = false;
      setOcupado(false);
      window.setTimeout(() => input.current?.focus(), 0);
    }
  }
  async function reenviar() {
    if (bloqueo.current) return;
    bloqueo.current = true;
    setOcupado(true);
    setError("");
    setAviso("");
    try {
      await reenviarCodigo();
      setAhora(Date.now());
      setCodigo("");
      setAgotado(false);
      setVencidoServidor(false);
      setAviso("Enviamos un código nuevo a tu correo.");
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      bloqueo.current = false;
      setOcupado(false);
      window.setTimeout(() => input.current?.focus(), 0);
    }
  }
  return (
    <AuthLayout
      title="Revisa tu correo"
      description={
        <>
          Enviamos un código de 6 dígitos a{" "}
          <span className="font-medium text-foreground">
            {ocultarCorreo(desafio.correo)}
          </span>
          . Ingrésalo para continuar.
        </>
      }
      step="Paso 2 de 2 · Verificación"
    >
      <div className="space-y-6" aria-busy={ocupado}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void verificar(codigo);
          }}
        >
          <Label htmlFor="codigo">Código de verificación</Label>
          <InputOTP
            ref={input}
            id="codigo"
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={codigo}
            onChange={setCodigo}
            onComplete={(valor) => void verificar(valor)}
            disabled={ocupado || vencido || agotado}
            aria-invalid={!!error}
            aria-describedby="codigo-ayuda codigo-estado"
            containerClassName="justify-center py-1"
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p
            id="codigo-ayuda"
            className="text-center text-xs text-muted-foreground"
          >
            Puedes pegar el código completo. Se verificará al completarlo.
          </p>
          <p
            className="text-center text-sm text-muted-foreground"
            role="timer"
            aria-label="Tiempo hasta el vencimiento"
          >
            {vencido
              ? "Código vencido"
              : `El código vence en ${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, "0")}`}
          </p>
          {ocupado && (
            <p
              role="status"
              className="flex items-center justify-center gap-2 text-sm"
            >
              <LoaderCircle
                className="size-4 motion-safe:animate-spin"
                aria-hidden="true"
              />
              Procesando…
            </p>
          )}
        </form>
        <div id="codigo-estado">
          <Message>
            {error ||
              (vencido
                ? "El código venció. Solicita uno nuevo para continuar."
                : "")}
          </Message>
        </div>
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          {aviso}
        </p>
        <div className="space-y-3 border-t pt-5">
          <p className="text-center text-sm text-muted-foreground">
            ¿No recibiste el código? Revisa también el correo no deseado.
          </p>
          <Button
            variant="outline"
            className="w-full"
            disabled={ocupado || espera > 0}
            onClick={() => void reenviar()}
          >
            <Mail aria-hidden="true" />
            {vencido || agotado
              ? "Solicitar un código nuevo"
              : "Reenviar código"}
            {espera > 0 && ` (${espera} s)`}
          </Button>
          <Link
            className="block py-2 text-center text-sm underline aria-disabled:opacity-50"
            to="/ingresar"
            aria-disabled={ocupado}
            onClick={(e) => {
              if (ocupado) e.preventDefault();
              else descartarDesafio();
            }}
          >
            Usar otra cuenta
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
