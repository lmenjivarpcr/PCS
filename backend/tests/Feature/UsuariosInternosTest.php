<?php

namespace Tests\Feature;

use App\Models\Perfil;
use App\Models\User;
use App\Services\Bitacora;
use Database\Seeders\PermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class UsuariosInternosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['pcs.directorio.driver' => 'simulado', 'pcs.directorio.dominios' => ['pcslatam.com'], 'pcs.microsoft.tenant_id' => null]);
    }

    private function autorizar(string $codigo): User
    {
        $this->seed(PermisosSeeder::class);
        $actor = User::factory()->create();
        DB::table('perfil_permiso')->insert([
            'perfil_id' => $actor->perfil_id,
            'permiso_id' => DB::table('permisos')->where('codigo', $codigo)->value('id'),
            'activo' => true,
        ]);
        Sanctum::actingAs($actor);

        return $actor;
    }

    public static function rutas(): array
    {
        return [
            ['GET', '/api/v1/perfiles'], ['GET', '/api/v1/usuarios-internos'],
            ['GET', '/api/v1/directorio/usuarios?buscar=Alina'],
            ['POST', '/api/v1/usuarios-internos'], ['PATCH', '/api/v1/usuarios-internos/1'],
        ];
    }

    #[DataProvider('rutas')]
    public function test_ruta_devuelve_401_sin_token(string $metodo, string $ruta): void
    {
        $this->json($metodo, $ruta)->assertUnauthorized()->assertJsonPath('message', 'Debe autenticarse para continuar.');
    }

    #[DataProvider('rutas')]
    public function test_ruta_devuelve_403_sin_permiso(string $metodo, string $ruta): void
    {
        $usuario = User::factory()->create();
        Sanctum::actingAs($usuario);
        $this->json($metodo, $ruta)->assertForbidden()->assertJsonPath('message', 'No tiene permiso para realizar esta acción.');
    }

    public function test_perfiles_solo_devuelve_activos_con_campos_publicos(): void
    {
        $actor = $this->autorizar('usuarios.internos.leer');
        Perfil::factory()->create(['activo' => false]);
        $this->getJson('/api/v1/perfiles')->assertOk()->assertExactJson([
            'data' => [['id' => $actor->perfil_id, 'codigo' => $actor->perfil->codigo, 'nombre' => $actor->perfil->nombre]],
        ]);
    }

    public function test_listado_pagina_ordena_y_excluye_clientes(): void
    {
        $this->autorizar('usuarios.internos.leer');
        User::factory()->count(21)->sequence(fn ($s) => ['nombre' => sprintf('Persona %02d', $s->index)])->create();
        User::factory()->cliente()->create(['nombre' => 'Persona cliente']);
        $this->getJson('/api/v1/usuarios-internos?buscar=Persona&pagina=2')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.nombre', 'Persona 20')
            ->assertJsonPath('meta', ['pagina' => 2, 'por_pagina' => 20, 'total' => 21, 'ultima_pagina' => 2])
            ->assertJsonStructure(['data' => [['id', 'nombre', 'correo', 'perfil' => ['id', 'codigo', 'nombre'], 'activo', 'version', 'creado_en', 'actualizado_en']]]);
    }

    public function test_listado_filtra_correo_perfil_y_activo_cero_sin_perder_tipo(): void
    {
        $this->autorizar('usuarios.internos.leer');
        $objetivo = User::factory()->create(['activo' => false, 'correo' => 'filtro@pcslatam.com']);
        User::factory()->cliente()->for($objetivo->perfil, 'perfil')->create(['activo' => false, 'correo' => 'filtro.cliente@pcslatam.com']);
        User::factory()->create(['activo' => true, 'correo' => 'filtro.activo@pcslatam.com']);
        $this->getJson('/api/v1/usuarios-internos?buscar=filtro&activo=0&perfil_id='.$objetivo->perfil_id)
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $objetivo->id);
        $this->getJson('/api/v1/usuarios-internos?buscar=%27%20OR%201%3D1--')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_busqueda_directorio_marca_registrados_por_correo_o_identidad(): void
    {
        $this->autorizar('usuarios.internos.crear');
        User::factory()->create(['correo' => 'alina.brisamar@pcslatam.com']);
        $otro = User::factory()->create();
        DB::table('identidades_usuario')->insert([
            'usuario_id' => $otro->id, 'proveedor' => 'microsoft', 'emisor' => 'simulado',
            'sujeto' => 'simulado-2', 'creado_en' => now(), 'actualizado_en' => now(),
        ]);
        $this->getJson('/api/v1/directorio/usuarios?buscar=pcslatam')->assertOk()->assertJsonCount(8, 'data')
            ->assertJsonPath('data.0.registrado', true)->assertJsonPath('data.1.registrado', true)->assertJsonPath('data.2.registrado', false);
        $this->getJson('/api/v1/directorio/usuarios?buscar=ab')->assertUnprocessable()
            ->assertJsonPath('errors.buscar.0', 'Escriba al menos 3 caracteres para buscar.');
    }

    public function test_alta_consulta_directorio_crea_identidad_y_bitacora_sin_contrasena(): void
    {
        $actor = $this->autorizar('usuarios.internos.crear');
        $perfil = Perfil::factory()->create();
        $respuesta = $this->withHeader('User-Agent', 'PCS pruebas')->postJson('/api/v1/usuarios-internos', [
            'id_externo' => 'simulado-1', 'perfil_id' => $perfil->id, 'nombre' => 'No confiar', 'correo' => 'falso@otro.test',
        ])->assertCreated()->assertJsonPath('data.nombre', 'Alina Brisamar')->assertJsonPath('data.version', 1);
        $id = $respuesta->json('data.id');
        $this->assertDatabaseHas('usuarios', ['id' => $id, 'tipo' => 'interno', 'activo' => true, 'contrasena' => null]);
        $this->assertDatabaseHas('identidades_usuario', ['usuario_id' => $id, 'proveedor' => 'microsoft', 'emisor' => 'simulado', 'sujeto' => 'simulado-1']);
        $this->assertDatabaseHas('bitacora', ['accion' => 'usuario.creado', 'actor_id' => $actor->id, 'entidad_id' => (string) $id, 'agente' => 'PCS pruebas']);
        $nuevo = json_decode(DB::table('bitacora')->value('nuevo'), true);
        $this->assertArrayNotHasKey('contrasena', $nuevo);
        $this->postJson('/api/v1/usuarios-internos', ['id_externo' => 'simulado-1', 'perfil_id' => $perfil->id])
            ->assertUnprocessable()->assertJsonPath('errors.id_externo.0', 'La persona ya está registrada.');
        $this->assertDatabaseCount('bitacora', 1);
    }

    public function test_alta_rechaza_duplicado_por_identidad_aunque_cambie_correo(): void
    {
        $actor = $this->autorizar('usuarios.internos.crear');
        DB::table('identidades_usuario')->insert([
            'usuario_id' => $actor->id, 'proveedor' => 'microsoft', 'emisor' => 'simulado',
            'sujeto' => 'simulado-1', 'creado_en' => now(), 'actualizado_en' => now(),
        ]);
        $this->postJson('/api/v1/usuarios-internos', ['id_externo' => 'simulado-1', 'perfil_id' => $actor->perfil_id])->assertUnprocessable();
        $this->assertDatabaseCount('usuarios', 1);
        $this->assertDatabaseCount('bitacora', 0);
    }

    public function test_alta_rechaza_dominio_no_permitido_y_cuenta_no_encontrada(): void
    {
        $actor = $this->autorizar('usuarios.internos.crear');
        config(['pcs.directorio.dominios' => ['otro.test']]);
        $this->postJson('/api/v1/usuarios-internos', ['id_externo' => 'simulado-1', 'perfil_id' => $actor->perfil_id])
            ->assertUnprocessable()->assertJsonValidationErrors('id_externo');
        $this->postJson('/api/v1/usuarios-internos', ['id_externo' => 'inexistente', 'perfil_id' => $actor->perfil_id])
            ->assertUnprocessable()->assertJsonValidationErrors('id_externo');
        $this->assertDatabaseCount('usuarios', 1);
        $this->assertDatabaseCount('identidades_usuario', 0);
    }

    public function test_alta_rechaza_perfil_inactivo_y_datos_obligatorios(): void
    {
        $this->autorizar('usuarios.internos.crear');
        $perfil = Perfil::factory()->create(['activo' => false]);
        $this->postJson('/api/v1/usuarios-internos', ['id_externo' => 'simulado-1', 'perfil_id' => $perfil->id])
            ->assertUnprocessable()->assertJsonPath('errors.perfil_id.0', 'Seleccione un perfil activo.');
        $this->postJson('/api/v1/usuarios-internos', [])->assertUnprocessable()->assertJsonValidationErrors(['id_externo', 'perfil_id']);
        $this->assertDatabaseCount('identidades_usuario', 0);
    }

    public function test_edita_perfil_y_estado_con_version_y_eventos(): void
    {
        $actor = $this->autorizar('usuarios.internos.editar');
        $usuario = User::factory()->create();
        $perfil = Perfil::factory()->create();
        $this->patchJson('/api/v1/usuarios-internos/'.$usuario->id, ['perfil_id' => $perfil->id, 'activo' => false, 'version' => 1])
            ->assertOk()->assertJsonPath('data.version', 2)->assertJsonPath('data.activo', false)->assertJsonPath('data.perfil.id', $perfil->id);
        $this->assertDatabaseHas('usuarios', ['id' => $usuario->id, 'perfil_id' => $perfil->id, 'activo' => false, 'version' => 2]);
        foreach (['usuario.perfil_cambiado', 'usuario.desactivado'] as $accion) {
            $this->assertDatabaseHas('bitacora', ['accion' => $accion, 'actor_id' => $actor->id, 'entidad_id' => (string) $usuario->id]);
        }
        $this->patchJson('/api/v1/usuarios-internos/'.$usuario->id, ['activo' => true, 'version' => 2])->assertOk()->assertJsonPath('data.version', 3);
        $this->assertDatabaseHas('bitacora', ['accion' => 'usuario.activado']);
    }

    public function test_version_obsoleta_devuelve_409_sin_cambios_ni_bitacora(): void
    {
        $this->autorizar('usuarios.internos.editar');
        $usuario = User::factory()->create();
        $this->patchJson('/api/v1/usuarios-internos/'.$usuario->id, ['activo' => false, 'version' => 2])->assertConflict();
        $this->assertDatabaseHas('usuarios', ['id' => $usuario->id, 'activo' => true, 'version' => 1]);
        $this->assertDatabaseCount('bitacora', 0);
    }

    public function test_ultimo_administrador_no_puede_desactivarse_ni_cambiar_su_perfil(): void
    {
        $actor = $this->autorizar('usuarios.internos.editar');
        $actor->perfil->update(['codigo' => 'administrador']);
        $otroPerfil = Perfil::factory()->create();
        User::factory()->cliente()->for($actor->perfil, 'perfil')->create();
        User::factory()->for($actor->perfil, 'perfil')->create(['activo' => false]);
        foreach ([['activo' => false], ['perfil_id' => $otroPerfil->id]] as $datos) {
            $this->patchJson('/api/v1/usuarios-internos/'.$actor->id, [...$datos, 'version' => 1])
                ->assertUnprocessable()->assertJsonPath('errors.usuario.0', 'Debe conservar al menos un administrador interno activo.');
        }
        $this->assertDatabaseHas('usuarios', ['id' => $actor->id, 'activo' => true, 'version' => 1]);
        $this->assertDatabaseCount('bitacora', 0);
    }

    public function test_puede_desactivar_administrador_si_existe_otro_interno_activo(): void
    {
        $actor = $this->autorizar('usuarios.internos.editar');
        $actor->perfil->update(['codigo' => 'administrador']);
        $otro = User::factory()->for($actor->perfil, 'perfil')->create();
        $this->patchJson('/api/v1/usuarios-internos/'.$otro->id, ['activo' => false, 'version' => 1])->assertOk();
    }

    public function test_edicion_rechaza_cliente_con_404_y_perfil_inactivo_con_422(): void
    {
        $this->autorizar('usuarios.internos.editar');
        $cliente = User::factory()->cliente()->create();
        $this->patchJson('/api/v1/usuarios-internos/'.$cliente->id, ['version' => 1])->assertNotFound();
        $interno = User::factory()->create();
        $perfil = Perfil::factory()->create(['activo' => false]);
        $this->patchJson('/api/v1/usuarios-internos/'.$interno->id, ['version' => 1, 'perfil_id' => $perfil->id])
            ->assertUnprocessable()->assertJsonValidationErrors('perfil_id');
        $this->patchJson('/api/v1/usuarios-internos/'.$interno->id, [])->assertUnprocessable()->assertJsonValidationErrors('version');
        $this->assertDatabaseCount('bitacora', 0);
    }

    public function test_fallo_de_bitacora_revierte_usuario_e_identidad(): void
    {
        $actor = $this->autorizar('usuarios.internos.crear');
        $this->mock(Bitacora::class)->shouldReceive('registrar')->once()->andThrow(new \RuntimeException('Fallo de auditoría'));
        $this->postJson('/api/v1/usuarios-internos', ['id_externo' => 'simulado-1', 'perfil_id' => $actor->perfil_id])->assertStatus(500);
        $this->assertDatabaseCount('usuarios', 1);
        $this->assertDatabaseCount('identidades_usuario', 0);
        $this->assertDatabaseCount('bitacora', 0);
    }
}
