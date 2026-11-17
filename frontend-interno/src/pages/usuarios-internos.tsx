import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/auth-state";
import { usuariosService } from "@/services/usuarios";
import {
  errorUsuarios,
  type ListadoUsuarios,
  type Perfil,
  type UsuarioInterno,
  type UsuariosService,
} from "@/services/usuarios/types";
import { DataTable, type Column } from "@/components/data-table";
import { FilterBar } from "@/components/filter-bar";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Message } from "@/components/message";
import { RegistrarDialog } from "@/components/usuarios/registrar-dialog";
import { EditarDialog } from "@/components/usuarios/editar-dialog";
const vacio: ListadoUsuarios = {
  data: [],
  meta: { pagina: 1, por_pagina: 20, total: 0, ultima_pagina: 1 },
};
export function UsuariosInternos({
  servicio = usuariosService,
}: {
  servicio?: UsuariosService;
}) {
  const { usuario } = useAuth();
  const [params, setParams] = useSearchParams();
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);
  const buscar = params.get("buscar") ?? "";
  const perfil = params.get("perfil_id") ?? "";
  const estado = ["0", "todos"].includes(params.get("activo") ?? "")
    ? params.get("activo")!
    : "1";
  const numero = Number(params.get("pagina") ?? 1);
  const pagina = Number.isSafeInteger(numero) && numero > 0 ? numero : 1;
  const [texto, setTexto] = useState(buscar);
  const [busquedaAnterior, setBusquedaAnterior] = useState(buscar);
  if (buscar !== busquedaAnterior) {
    setBusquedaAnterior(buscar);
    setTexto(buscar);
  }
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [perfilError, setPerfilError] = useState("");
  const [datos, setDatos] = useState(vacio);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [registrar, setRegistrar] = useState(false);
  const [editar, setEditar] = useState<UsuarioInterno | null>(null);
  const puedeCrear = usuario?.permisos.includes("usuarios.internos.crear");
  const puedeEditar = usuario?.permisos.includes("usuarios.internos.editar");
  useEffect(() => {
    if (texto === buscar) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(paramsRef.current);
      if (texto.trim()) next.set("buscar", texto.trim());
      else next.delete("buscar");
      next.set("pagina", "1");
      setParams(next);
    }, 300);
    return () => clearTimeout(timer);
  }, [texto, buscar, setParams]);
  useEffect(() => {
    let vigente = true;
    servicio
      .perfiles()
      .then((r) => {
        if (vigente) {
          setPerfiles(r.data);
          setPerfilError("");
        }
      })
      .catch((e) => {
        if (vigente) setPerfilError(errorUsuarios(e));
      });
    return () => {
      vigente = false;
    };
  }, [servicio, revision]);
  useEffect(() => {
    let vigente = true;
    // Iniciar la solicitud en una microtarea permite cancelar el efecto antes
    // de ejecutar trabajo y conserva la respuesta anterior hasta mostrar carga.
    Promise.resolve().then(() => {
      if (!vigente) return;
      setLoading(true);
      setError("");
      return servicio
        .listar({
          buscar,
          perfil_id: perfil ? Number(perfil) : undefined,
          activo: estado === "todos" ? undefined : estado === "1",
          pagina,
        })
        .then((r) => {
          if (!vigente) return;
          if (pagina > r.meta.ultima_pagina) {
            const next = new URLSearchParams(paramsRef.current);
            next.set("pagina", String(r.meta.ultima_pagina));
            setParams(next, { replace: true });
          } else setDatos(r);
        })
        .catch((e) => {
          if (vigente) setError(errorUsuarios(e));
        })
        .finally(() => {
          if (vigente) setLoading(false);
        });
    });
    return () => {
      vigente = false;
    };
  }, [buscar, perfil, estado, pagina, revision, servicio, setParams]);
  function filtro(key: string, value: string) {
    const next = new URLSearchParams(paramsRef.current);
    if (value) next.set(key, value);
    else next.delete(key);
    if (texto.trim()) next.set("buscar", texto.trim());
    else next.delete("buscar");
    next.set("pagina", "1");
    setParams(next);
  }
  function success() {
    setRegistrar(false);
    setEditar(null);
    setRevision((n) => n + 1);
  }
  const columns: Column<UsuarioInterno>[] = [
    {
      title: "Nombre",
      cell: (u) => (
        <div>
          <p className="font-medium">{u.nombre}</p>
          <p className="break-all text-xs text-muted-foreground">{u.correo}</p>
        </div>
      ),
    },
    { title: "Perfil", cell: (u) => u.perfil.nombre },
    {
      title: "Estado",
      cell: (u) => <Badge>{u.activo ? "Activo" : "Inactivo"}</Badge>,
    },
    {
      title: "Última actualización",
      cell: (u) => (
        <time dateTime={u.actualizado_en}>
          {new Date(u.actualizado_en).toLocaleString()}
        </time>
      ),
    },
    {
      title: "Acciones",
      cell: (u) =>
        puedeEditar ? (
          <Button
            variant="ghost"
            aria-label={`Editar a ${u.nombre}`}
            onClick={() => setEditar(u)}
          >
            <Pencil />
            Editar
          </Button>
        ) : (
          <span className="text-muted-foreground">Solo consulta</span>
        ),
    },
  ];
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Gestiona el acceso del personal al portal interno.
        </p>
        {puedeCrear && (
          <Button
            disabled={!perfiles.length}
            onClick={() => setRegistrar(true)}
          >
            <Plus />
            Registrar usuario
          </Button>
        )}
      </div>
      {perfilError && (
        <div className="space-y-2">
          <Message>{perfilError}</Message>
          <Button variant="outline" onClick={() => setRevision((n) => n + 1)}>
            Reintentar perfiles
          </Button>
        </div>
      )}
      <FilterBar>
        <label className="min-w-48 flex-1 space-y-2 text-sm font-medium">
          Buscar usuario
          <input
            placeholder="Nombre o correo"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </label>
        <label className="min-w-40 space-y-2 text-sm font-medium">
          Perfil
          <Select
            value={perfil}
            onChange={(e) => filtro("perfil_id", e.target.value)}
          >
            <option value="">Todos los perfiles</option>
            {perfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </label>
        <label className="min-w-36 space-y-2 text-sm font-medium">
          Estado
          <Select
            value={estado}
            onChange={(e) => filtro("activo", e.target.value)}
          >
            <option value="1">Activos</option>
            <option value="0">Inactivos</option>
            <option value="todos">Todos</option>
          </Select>
        </label>
        <Button
          variant="outline"
          onClick={() => {
            setTexto("");
            setParams({});
          }}
        >
          Limpiar
        </Button>
      </FilterBar>
      <section
        aria-label="Listado de usuarios"
        aria-busy={loading}
        className="overflow-hidden rounded-lg border bg-card"
      >
        <DataTable
          columns={columns}
          data={datos.data}
          loading={loading}
          error={error}
          retry={() => setRevision((n) => n + 1)}
        />
        {!loading && !error && (
          <Pagination
            page={pagina}
            last={datos.meta.ultima_pagina}
            total={datos.meta.total}
            onChange={(page) => {
              const next = new URLSearchParams(params);
              next.set("pagina", String(page));
              setParams(next);
            }}
          />
        )}
      </section>
      {registrar && (
        <RegistrarDialog
          servicio={servicio}
          perfiles={perfiles}
          onClose={() => setRegistrar(false)}
          onSuccess={success}
        />
      )}
      {editar && (
        <EditarDialog
          usuario={editar}
          perfiles={perfiles}
          servicio={servicio}
          onClose={() => setEditar(null)}
          onSuccess={success}
        />
      )}
    </>
  );
}
