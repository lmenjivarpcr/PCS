<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\SuperadministradorSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SuperadministradorSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'pcs.superadministrador.nombre' => 'Administrador PCS',
            'pcs.superadministrador.correo' => 'Admin@Ejemplo.test',
        ]);
    }

    public function test_crea_el_superadministrador_interno_con_perfil_administrador(): void
    {
        $this->seed(SuperadministradorSeeder::class);

        $usuario = User::query()->where('correo', 'admin@ejemplo.test')->firstOrFail();

        $this->assertSame('interno', $usuario->tipo);
        $this->assertTrue($usuario->activo);
        $this->assertNull($usuario->getAuthPassword());
        $this->assertSame(SuperadministradorSeeder::CODIGO_PERFIL, $usuario->perfil->codigo);
    }

    public function test_concede_todos_los_permisos_activos_al_perfil(): void
    {
        $activo = $this->crearPermiso('modulo.grupo.leer', true);
        $inactivo = $this->crearPermiso('modulo.grupo.borrar', false);

        $this->seed(SuperadministradorSeeder::class);

        $perfilId = User::query()->where('correo', 'admin@ejemplo.test')->value('perfil_id');
        $this->assertDatabaseHas('perfil_permiso', ['perfil_id' => $perfilId, 'permiso_id' => $activo, 'activo' => true]);
        $this->assertDatabaseMissing('perfil_permiso', ['perfil_id' => $perfilId, 'permiso_id' => $inactivo]);
    }

    public function test_se_puede_ejecutar_varias_veces_e_incorpora_permisos_nuevos(): void
    {
        $this->seed(SuperadministradorSeeder::class);
        $nuevo = $this->crearPermiso('modulo.grupo.crear', true);

        $this->seed(SuperadministradorSeeder::class);

        $this->assertDatabaseCount('usuarios', 1);
        $this->assertDatabaseCount('perfiles', 1);
        $this->assertDatabaseHas('perfil_permiso', ['permiso_id' => $nuevo, 'activo' => true]);
    }

    public function test_no_crea_nada_sin_correo_configurado(): void
    {
        config(['pcs.superadministrador.correo' => null]);

        $this->seed(SuperadministradorSeeder::class);

        $this->assertDatabaseCount('usuarios', 0);
        $this->assertDatabaseCount('perfiles', 0);
    }

    private function crearPermiso(string $codigo, bool $activo): int
    {
        $moduloId = DB::table('modulos')->where('codigo', 'modulo')->value('id')
            ?? DB::table('modulos')->insertGetId(['codigo' => 'modulo', 'nombre' => 'Módulo']);
        $grupoId = DB::table('grupos_permiso')->where('codigo', 'grupo')->value('id')
            ?? DB::table('grupos_permiso')->insertGetId(['modulo_id' => $moduloId, 'codigo' => 'grupo', 'nombre' => 'Grupo']);

        return DB::table('permisos')->insertGetId([
            'grupo_id' => $grupoId,
            'codigo' => $codigo,
            'nombre' => $codigo,
            'audiencia' => 'interno',
            'contexto' => 'general',
            'activo' => $activo,
        ]);
    }
}
