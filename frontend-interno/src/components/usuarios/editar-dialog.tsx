import { useState } from "react";
import { toast } from "sonner";
import {
  errorUsuarios,
  UsuariosError,
  type Perfil,
  type UsuarioInterno,
  type UsuariosService,
} from "@/services/usuarios/types";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Message } from "../message";
import { ConfirmationDialog } from "../confirmation-dialog";
import { PerfilSelect } from "./perfil-select";
export function EditarDialog({
  usuario,
  perfiles,
  servicio,
  onClose,
  onSuccess,
}: {
  usuario: UsuarioInterno;
  perfiles: Perfil[];
  servicio: UsuariosService;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [actual, setActual] = useState(usuario);
  const [perfil, setPerfil] = useState(String(usuario.perfil.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [confirm, setConfirm] = useState(false);
  async function guardar(activo = actual.activo) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await servicio.editar(actual.id, {
        perfil_id: Number(perfil),
        activo,
        version: actual.version,
      });
      toast.success("Usuario actualizado");
      onSuccess();
    } catch (e) {
      setError(errorUsuarios(e));
      setConflict(e instanceof UsuariosError && e.status === 409);
    } finally {
      setBusy(false);
    }
  }
  async function recargar() {
    setBusy(true);
    setError("");
    try {
      // El contrato no incluye GET por ID. Buscar por correo devuelve el registro vigente.
      const r = await servicio.listar({ buscar: actual.correo, pagina: 1 });
      const nuevo = r.data.find((u) => u.id === actual.id);
      if (!nuevo)
        throw new UsuariosError(404, "El usuario ya no está disponible.");
      setActual(nuevo);
      setPerfil(String(nuevo.perfil.id));
      setConflict(false);
    } catch (e) {
      setError(errorUsuarios(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
      title="Editar usuario"
      description="Actualiza el perfil y el estado del usuario interno."
    >
      <div className="space-y-5">
        <div className="rounded-md border bg-muted p-4 text-sm">
          <p className="font-medium">{actual.nombre}</p>
          <p className="break-all">{actual.correo}</p>
          <p className="mt-2">{actual.activo ? "Activo" : "Inactivo"}</p>
        </div>
        <Message>{error}</Message>
        {conflict && (
          <Button variant="outline" disabled={busy} onClick={recargar}>
            Recargar datos
          </Button>
        )}
        <fieldset disabled={busy || conflict} className="space-y-5">
          <PerfilSelect
            perfiles={perfiles}
            value={perfil}
            onChange={setPerfil}
          />
          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="destructive" onClick={() => setConfirm(true)}>
              {actual.activo ? "Desactivar usuario" : "Activar usuario"}
            </Button>
            <Button
              onClick={() => guardar()}
              disabled={Number(perfil) === actual.perfil.id}
            >
              {busy ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </fieldset>
        <ConfirmationDialog
          open={confirm}
          onOpenChange={setConfirm}
          title={actual.activo ? "Desactivar usuario" : "Activar usuario"}
          description={`¿Confirmas ${actual.activo ? "desactivar" : "activar"} a ${actual.nombre}? Se guardará también el perfil seleccionado.`}
          onConfirm={() => {
            setConfirm(false);
            void guardar(!actual.activo);
          }}
        />
      </div>
    </Dialog>
  );
}
