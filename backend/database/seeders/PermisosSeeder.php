<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermisosSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            foreach (require database_path('catalogos/permisos.php') as $orden => $modulo) {
                DB::table('modulos')->upsert([
                    ['codigo' => $modulo['codigo'], 'nombre' => $modulo['nombre'], 'orden' => $orden, 'activo' => true],
                ], ['codigo'], ['nombre', 'orden']);
                $moduloId = DB::table('modulos')->where('codigo', $modulo['codigo'])->value('id');
                foreach ($modulo['grupos'] as $ordenGrupo => $grupo) {
                    DB::table('grupos_permiso')->upsert([
                        ['modulo_id' => $moduloId, 'codigo' => $grupo['codigo'], 'nombre' => $grupo['nombre'], 'orden' => $ordenGrupo, 'activo' => true],
                    ], ['modulo_id', 'codigo'], ['nombre', 'orden']);
                    $grupoId = DB::table('grupos_permiso')->where('modulo_id', $moduloId)->where('codigo', $grupo['codigo'])->value('id');
                    foreach ($grupo['permisos'] as $permiso) {
                        DB::table('permisos')->upsert([
                            [...$permiso, 'grupo_id' => $grupoId, 'activo' => true],
                        ], ['codigo'], ['grupo_id', 'nombre', 'audiencia', 'contexto']);
                    }
                }
            }
        });
    }
}
