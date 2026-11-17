import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  errorUsuarios,
  type Perfil,
  type PersonaDirectorio,
  type UsuariosService,
} from "@/services/usuarios/types";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Message } from "../message";
import { PerfilSelect } from "./perfil-select";
export function RegistrarDialog({
  servicio,
  perfiles,
  onClose,
  onSuccess,
}: {
  servicio: UsuariosService;
  perfiles: Perfil[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [buscar, setBuscar] = useState("");
  const [personas, setPersonas] = useState<PersonaDirectorio[]>([]);
  const [persona, setPersona] = useState<PersonaDirectorio | null>(null);
  const [perfil, setPerfil] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const results = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let vigente = true;
    if (persona || buscar.trim().length < 3) return;
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      servicio
        .directorio(buscar)
        .then((r) => {
          if (vigente) setPersonas(r.data);
        })
        .catch((e) => {
          if (vigente) setError(errorUsuarios(e));
        })
        .finally(() => {
          if (vigente) setLoading(false);
        });
    }, 400);
    return () => {
      vigente = false;
      clearTimeout(timer);
    };
  }, [buscar, persona, retry, servicio]);
  async function registrar() {
    if (!persona || !perfil || saving) return;
    setSaving(true);
    setError("");
    try {
      await servicio.registrar({
        id_externo: persona.id_externo,
        perfil_id: Number(perfil),
      });
      toast.success("Usuario registrado");
      onSuccess();
    } catch (e) {
      setError(errorUsuarios(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
      title="Registrar usuario"
      description="Busca una persona en el directorio de Microsoft y asigna su perfil."
    >
      <div className="space-y-5">
        <Message>{error}</Message>
        {!persona ? (
          <>
            <label className="block space-y-2 text-sm font-medium">
              Buscar en Microsoft
              <input
                autoComplete="off"
                value={buscar}
                onChange={(e) => {
                  setBuscar(e.target.value);
                  setPersonas([]);
                  setError("");
                  setLoading(e.target.value.trim().length >= 3);
                }}
                aria-describedby="ayuda-directorio"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    results.current
                      ?.querySelector<HTMLButtonElement>(
                        "button:not(:disabled)",
                      )
                      ?.focus();
                  }
                }}
              />
            </label>
            <p id="ayuda-directorio" className="text-xs text-muted-foreground">
              Escribe al menos 3 caracteres. Usa flecha abajo para recorrer los
              resultados.
            </p>
            <div role="status" aria-live="polite" className="text-sm">
              {buscar.trim().length >= 3 &&
                (loading
                  ? "Buscando…"
                  : !error
                    ? personas.length
                      ? `${personas.length} ${personas.length === 1 ? "resultado" : "resultados"}`
                      : "Sin resultados"
                    : "")}
            </div>
            {error && (
              <Button variant="outline" onClick={() => setRetry((n) => n + 1)}>
                Reintentar búsqueda
              </Button>
            )}
            <div
              ref={results}
              className="max-h-64 space-y-2 overflow-y-auto"
              onKeyDown={(e) => {
                if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key))
                  return;
                const buttons = Array.from(
                  results.current?.querySelectorAll<HTMLButtonElement>(
                    "button:not(:disabled)",
                  ) ?? [],
                );
                const index = buttons.indexOf(
                  document.activeElement as HTMLButtonElement,
                );
                const next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? buttons.length - 1
                      : (index +
                          (e.key === "ArrowDown" ? 1 : -1) +
                          buttons.length) %
                        buttons.length;
                e.preventDefault();
                buttons[next]?.focus();
              }}
            >
              {personas.map((p) => (
                <button
                  type="button"
                  key={p.id_externo}
                  disabled={p.registrado || loading}
                  onClick={() => {
                    setPersona(p);
                    setError("");
                  }}
                  className="w-full rounded-md border p-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
                >
                  <span className="block font-medium">
                    {p.nombre}
                    {p.registrado && " · Ya registrado"}
                  </span>
                  <span className="block break-all">{p.correo}</span>
                  <span className="block text-muted-foreground">
                    {p.cargo} · {p.pais}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="rounded-md border bg-muted p-4 text-sm">
              <p className="font-medium">{persona.nombre}</p>
              <p className="break-all">{persona.correo}</p>
              <p>
                {persona.cargo} · {persona.pais}
              </p>
            </div>
            <Button
              variant="link"
              disabled={saving}
              onClick={() => setPersona(null)}
            >
              Elegir otra persona
            </Button>
            <PerfilSelect
              autoFocus
              perfiles={perfiles}
              value={perfil}
              onChange={setPerfil}
            />
            <Button
              className="w-full"
              disabled={!perfil || saving}
              onClick={registrar}
            >
              {saving ? "Registrando…" : "Registrar"}
            </Button>
          </>
        )}
      </div>
    </Dialog>
  );
}
