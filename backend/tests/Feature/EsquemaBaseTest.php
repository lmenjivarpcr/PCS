<?php

namespace Tests\Feature;

use App\Models\Perfil;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class EsquemaBaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_existen_las_tablas_y_columnas_acordadas(): void
    {
        $tablas = [
            'perfiles' => ['id', 'codigo', 'nombre', 'activo', 'version', 'creado_en', 'actualizado_en'],
            'usuarios' => ['id', 'perfil_id', 'nombre', 'correo', 'tipo', 'contrasena', 'activo', 'version', 'creado_en', 'actualizado_en'],
            'identidades_usuario' => ['id', 'usuario_id', 'proveedor', 'emisor', 'sujeto', 'creado_en', 'actualizado_en'],
            'modulos' => ['id', 'codigo', 'nombre', 'orden', 'activo'],
            'grupos_permiso' => ['id', 'modulo_id', 'codigo', 'nombre', 'orden', 'activo'],
            'permisos' => ['id', 'grupo_id', 'codigo', 'nombre', 'audiencia', 'contexto', 'activo'],
            'perfil_permiso' => ['perfil_id', 'permiso_id', 'activo', 'actualizado_por', 'actualizado_en'],
            'usuario_permiso' => ['usuario_id', 'permiso_id', 'efecto', 'creado_por', 'actualizado_por', 'creado_en', 'actualizado_en'],
            'funciones_equipo' => ['id', 'codigo', 'nombre', 'activo', 'creado_en', 'actualizado_en'],
            'funcion_permiso' => ['funcion_id', 'permiso_id'],
            'autorizacion_cambios' => ['id', 'actor_id', 'entidad', 'entidad_id', 'anterior', 'nuevo', 'creado_en'],
            'equipos_predefinidos' => ['id', 'nombre', 'activo', 'creado_en', 'actualizado_en'],
            'integrantes_equipo_predefinido' => ['equipo_id', 'usuario_id', 'funcion_id'],
            'paises' => ['id', 'codigo', 'nombre', 'activo', 'creado_en', 'actualizado_en'],
            'sectores' => ['id', 'codigo', 'nombre', 'activo', 'creado_en', 'actualizado_en'],
            'lineas_servicio' => ['id', 'codigo', 'nombre', 'activo', 'creado_en', 'actualizado_en'],
            'servicios' => ['id', 'linea_servicio_id', 'codigo', 'nombre', 'activo', 'creado_en', 'actualizado_en'],
        ];

        foreach ($tablas as $tabla => $columnas) {
            $this->assertTrue(Schema::hasTable($tabla), $tabla);
            $this->assertEqualsCanonicalizing($columnas, Schema::getColumnListing($tabla), $tabla);
        }

        $this->assertFalse(Schema::hasTable('users'));
        $this->assertTrue(Schema::hasTable('password_reset_tokens'));
    }

    public function test_rechaza_correo_duplicado(): void
    {
        $usuario = User::factory()->create();

        $this->expectException(QueryException::class);

        User::factory()->recycle($usuario->perfil)->create(['correo' => $usuario->correo]);
    }

    public function test_rechaza_codigo_de_permiso_duplicado(): void
    {
        $permisoId = $this->crearPermiso();
        $permiso = (array) DB::table('permisos')->find($permisoId);
        unset($permiso['id']);

        $this->expectException(QueryException::class);

        DB::table('permisos')->insert($permiso);
    }

    public function test_factory_crea_usuario_con_perfil_y_fechas_en_espanol(): void
    {
        $this->travelTo('2040-01-02 03:04:05');

        $usuario = User::factory()->create()->refresh();

        $this->assertModelExists($usuario);
        $this->assertModelExists($usuario->perfil);
        $this->assertTrue($usuario->activo);
        $this->assertSame(1, $usuario->version);
        $this->assertSame('2040-01-02 03:04:05', $usuario->creado_en->format('Y-m-d H:i:s'));
        $this->assertSame('2040-01-02 03:04:05', $usuario->actualizado_en->format('Y-m-d H:i:s'));
        $this->assertSame($usuario->correo, $usuario->routeNotificationFor('mail'));
    }

    public function test_factory_puede_utilizar_un_perfil_existente(): void
    {
        $perfil = Perfil::factory()->create();

        $usuario = User::factory()->for($perfil, 'perfil')->create();

        $this->assertTrue($usuario->perfil->is($perfil));
        $this->assertDatabaseCount('perfiles', 1);
    }

    public function test_cliente_valida_contrasena_guardada_con_hash(): void
    {
        $cliente = User::factory()->cliente()->create();

        $this->assertNotSame('password', $cliente->getAuthPassword());
        // Laravel recibe la clave "password" en las credenciales y la compara con la columna contrasena.
        $this->assertTrue(Auth::guard()->validate(['correo' => $cliente->correo, 'password' => 'password']));
        $this->assertFalse(Auth::guard()->validate(['correo' => $cliente->correo, 'password' => 'incorrecta']));
        $this->assertArrayNotHasKey('contrasena', $cliente->toArray());
    }

    public function test_usuario_interno_no_requiere_contrasena(): void
    {
        $interno = User::factory()->create();

        $this->assertNull($interno->getAuthPassword());
    }

    public function test_restablecimiento_genera_token_por_correo(): void
    {
        $cliente = User::factory()->cliente()->create();

        Password::broker()->createToken($cliente);

        $this->assertDatabaseHas('password_reset_tokens', ['email' => $cliente->correo]);
    }

    public function test_autenticacion_consulta_usuarios_por_correo(): void
    {
        $usuario = User::factory()->create();

        $recuperado = Auth::guard()->getProvider()->retrieveByCredentials(['correo' => $usuario->correo]);

        $this->assertTrue($usuario->is($recuperado));
    }

    public function test_no_permite_borrar_un_perfil_asignado(): void
    {
        $usuario = User::factory()->create();

        $this->expectException(QueryException::class);

        $usuario->perfil->delete();
    }

    public function test_borrar_usuario_elimina_sus_identidades_y_excepciones(): void
    {
        $usuario = User::factory()->create();
        DB::table('identidades_usuario')->insert([
            'usuario_id' => $usuario->id,
            'proveedor' => 'microsoft',
            'emisor' => 'https://example.com',
            'sujeto' => 'identidad-de-prueba',
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);
        DB::table('usuario_permiso')->insert([
            'usuario_id' => $usuario->id,
            'permiso_id' => $this->crearPermiso(),
            'efecto' => 'revocar',
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        $usuario->delete();

        $this->assertDatabaseCount('identidades_usuario', 0);
        $this->assertDatabaseCount('usuario_permiso', 0);
    }

    public function test_borrar_actor_conserva_la_auditoria_y_anula_su_referencia(): void
    {
        $actor = User::factory()->create();
        $cambioId = DB::table('autorizacion_cambios')->insertGetId([
            'actor_id' => $actor->id,
            'entidad' => 'usuarios',
            'entidad_id' => '1',
        ]);

        $actor->delete();

        $this->assertDatabaseHas('autorizacion_cambios', ['id' => $cambioId, 'actor_id' => null]);
        $this->assertNotNull(DB::table('autorizacion_cambios')->find($cambioId)->creado_en);
    }

    private function crearPermiso(): int
    {
        $moduloId = DB::table('modulos')->insertGetId([
            'codigo' => 'acceso',
            'nombre' => 'Acceso',
        ]);
        $grupoId = DB::table('grupos_permiso')->insertGetId([
            'modulo_id' => $moduloId,
            'codigo' => 'usuarios',
            'nombre' => 'Usuarios',
        ]);

        return DB::table('permisos')->insertGetId([
            'grupo_id' => $grupoId,
            'codigo' => 'usuarios.consultar',
            'nombre' => 'Consultar usuarios',
            'audiencia' => 'interno',
            'contexto' => 'general',
        ]);
    }
}
