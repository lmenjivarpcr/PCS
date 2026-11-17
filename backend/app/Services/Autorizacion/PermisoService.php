<?php

namespace App\Services\Autorizacion;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class PermisoService
{
    /** @param list<int>|null $funcionesEnOrden Identificadores de funciones de la orden, obtenidos por el servidor. */
    public function permite(User $u, string $codigo, ?array $funcionesEnOrden = null): bool
    {
        if (! $u->activo || ! $u->perfil()->where('activo', true)->exists()) {
            return false;
        }
        $permiso = DB::table('permisos as p')
            ->join('grupos_permiso as g', 'g.id', '=', 'p.grupo_id')
            ->join('modulos as m', 'm.id', '=', 'g.modulo_id')
            ->where('p.codigo', $codigo)->where('p.activo', true)
            ->where('g.activo', true)->where('m.activo', true)
            ->select('p.*')->first();

        if (! $permiso || ! in_array($permiso->audiencia, [$u->tipo, 'ambos'], true)) {
            return false;
        }
        $efecto = DB::table('usuario_permiso')->where('usuario_id', $u->id)->where('permiso_id', $permiso->id)->value('efecto');
        if ($efecto === 'revocar') {
            return false;
        }
        if ($permiso->contexto === 'general') {
            return $efecto === 'conceder' || DB::table('perfil_permiso')
                ->where('perfil_id', $u->perfil_id)->where('permiso_id', $permiso->id)->where('activo', true)->exists();
        }

        return DB::table('funcion_permiso as fp')
            ->join('funciones_equipo as f', 'f.id', '=', 'fp.funcion_id')
            ->where('f.activo', true)->whereIn('fp.funcion_id', $funcionesEnOrden ?? [])
            ->where('fp.permiso_id', $permiso->id)->exists();
    }
}
