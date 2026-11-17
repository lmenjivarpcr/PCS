<?php

namespace Tests\Feature;

use App\Models\Perfil;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\PermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PermisosSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalogo_idempotente_actualiza_por_codigo_y_no_concede_permisos(): void
    {
        Perfil::factory()->create();
        $this->seed(PermisosSeeder::class);
        $id = DB::table('permisos')->where('codigo', 'usuarios.internos.leer')->value('id');
        DB::table('permisos')->where('id', $id)->update(['nombre' => 'Nombre anterior', 'activo' => false]);
        $this->seed(PermisosSeeder::class);
        $this->assertDatabaseCount('modulos', 2);
        $this->assertDatabaseCount('grupos_permiso', 2);
        $this->assertDatabaseCount('permisos', 4);
        $this->assertDatabaseCount('perfil_permiso', 0);
        $this->assertDatabaseCount('usuario_permiso', 0);
        $this->assertDatabaseHas('permisos', ['id' => $id, 'nombre' => 'Consultar usuarios internos', 'activo' => false]);
    }

    public function test_database_seeder_carga_catalogo_antes_de_conceder_al_administrador(): void
    {
        config(['pcs.superadministrador.nombre' => 'Administrador de prueba', 'pcs.superadministrador.correo' => 'admin@pcslatam.com']);
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);
        $this->assertDatabaseCount('permisos', 4);
        $this->assertDatabaseCount('perfil_permiso', 4);
        $this->assertDatabaseCount('usuarios', 1);
        $admin = User::query()->firstOrFail();
        $this->assertSame('administrador', $admin->perfil->codigo);
    }
}
