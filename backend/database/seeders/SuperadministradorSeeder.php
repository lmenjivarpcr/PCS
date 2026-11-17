<?php

namespace Database\Seeders;

use App\Models\Perfil;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Crea o actualiza el perfil de administrador con todos los permisos activos del
 * catálogo y el usuario superadministrador definido en config/pcs.php.
 *
 * Se puede ejecutar varias veces: no duplica registros y, al volver a correrlo,
 * concede al administrador los permisos que se hayan agregado al catálogo.
 */
class SuperadministradorSeeder extends Seeder
{
    public const CODIGO_PERFIL = 'administrador';

    public function run(): void
    {
        $nombre = trim((string) config('pcs.superadministrador.nombre'));
        $correo = mb_strtolower(trim((string) config('pcs.superadministrador.correo')));

        if ($nombre === '' || $correo === '') {
            $this->command?->warn('Defina PCS_SUPERADMIN_NOMBRE y PCS_SUPERADMIN_CORREO en el .env para crear el superadministrador.');

            return;
        }

        DB::transaction(function () use ($nombre, $correo): void {
            $perfil = Perfil::query()->updateOrCreate(
                ['codigo' => self::CODIGO_PERFIL],
                ['nombre' => 'Administrador', 'activo' => true],
            );

            $this->concederTodosLosPermisos($perfil);

            User::query()->updateOrCreate(
                ['correo' => $correo],
                ['nombre' => $nombre, 'tipo' => 'interno', 'perfil_id' => $perfil->id, 'activo' => true],
            );
        });
    }

    private function concederTodosLosPermisos(Perfil $perfil): void
    {
        $asignaciones = DB::table('permisos')
            ->where('activo', true)
            ->pluck('id')
            ->map(fn (int $permisoId): array => [
                'perfil_id' => $perfil->id,
                'permiso_id' => $permisoId,
                'activo' => true,
                'actualizado_en' => now(),
            ])
            ->all();

        DB::table('perfil_permiso')->upsert($asignaciones, ['perfil_id', 'permiso_id'], ['activo', 'actualizado_en']);
    }
}
