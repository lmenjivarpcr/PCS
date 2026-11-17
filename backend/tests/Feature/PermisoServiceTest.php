<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Autorizacion\PermisoService;
use Database\Seeders\PermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PermisoServiceTest extends TestCase
{
    use RefreshDatabase;

    private function preparar(string $contexto = 'general', string $audiencia = 'interno'): array
    {
        $this->seed(PermisosSeeder::class);
        $usuario = User::factory()->create();
        $id = DB::table('permisos')->where('codigo', 'usuarios.internos.leer')->value('id');
        DB::table('permisos')->where('id', $id)->update(['contexto' => $contexto, 'audiencia' => $audiencia]);

        return [$usuario, $id, app(PermisoService::class)];
    }

    private function excepcion(User $usuario, int $permiso, string $efecto): void
    {
        DB::table('usuario_permiso')->upsert([[
            'usuario_id' => $usuario->id, 'permiso_id' => $permiso, 'efecto' => $efecto,
            'creado_en' => now(), 'actualizado_en' => now(),
        ]], ['usuario_id', 'permiso_id'], ['efecto']);
    }

    public function test_hereda_solo_asignaciones_activas_del_perfil_y_deniega_codigos_desconocidos(): void
    {
        [$usuario, $id, $servicio] = $this->preparar();
        $this->assertFalse($servicio->permite($usuario, 'usuarios.internos.leer'));
        $this->assertFalse($servicio->permite($usuario, 'inexistente'));
        DB::table('perfil_permiso')->insert(['perfil_id' => $usuario->perfil_id, 'permiso_id' => $id, 'activo' => true]);
        $this->assertTrue($servicio->permite($usuario, 'usuarios.internos.leer'));
        DB::table('perfil_permiso')->where('permiso_id', $id)->update(['activo' => false]);
        $this->assertFalse($servicio->permite($usuario, 'usuarios.internos.leer'));
    }

    public function test_conceder_general_habilita_y_revocar_prevalece_sobre_el_perfil(): void
    {
        [$usuario, $id, $servicio] = $this->preparar();
        $this->excepcion($usuario, $id, 'conceder');
        $this->assertTrue($servicio->permite($usuario, 'usuarios.internos.leer'));
        DB::table('perfil_permiso')->insert(['perfil_id' => $usuario->perfil_id, 'permiso_id' => $id, 'activo' => true]);
        $this->excepcion($usuario, $id, 'revocar');
        $this->assertFalse($servicio->permite($usuario, 'usuarios.internos.leer'));
    }

    public function test_orden_ignora_concesion_y_perfil_requiere_funcion_y_respeta_revocacion(): void
    {
        [$usuario, $id, $servicio] = $this->preparar('orden');
        $this->excepcion($usuario, $id, 'conceder');
        DB::table('perfil_permiso')->insert(['perfil_id' => $usuario->perfil_id, 'permiso_id' => $id, 'activo' => true]);
        $this->assertFalse($servicio->permite($usuario, 'usuarios.internos.leer'));
        $funcion = DB::table('funciones_equipo')->insertGetId([
            'codigo' => 'analista', 'nombre' => 'Analista', 'activo' => true, 'creado_en' => now(), 'actualizado_en' => now(),
        ]);
        DB::table('funcion_permiso')->insert(['funcion_id' => $funcion, 'permiso_id' => $id]);
        $this->assertFalse($servicio->permite($usuario, 'usuarios.internos.leer', []));
        $this->assertTrue($servicio->permite($usuario, 'usuarios.internos.leer', [$funcion]));
        $this->excepcion($usuario, $id, 'revocar');
        $this->assertFalse($servicio->permite($usuario, 'usuarios.internos.leer', [$funcion]));
        DB::table('usuario_permiso')->delete();
        DB::table('funciones_equipo')->where('id', $funcion)->update(['activo' => false]);
        $this->assertFalse($servicio->permite($usuario, 'usuarios.internos.leer', [$funcion]));
    }

    public static function inactivos(): array
    {
        return [['usuarios'], ['perfiles'], ['permisos'], ['grupos_permiso'], ['modulos']];
    }

    #[DataProvider('inactivos')]
    public function test_inactivos_denegados_incluso_con_concesion(string $tabla): void
    {
        [$usuario, $id, $servicio] = $this->preparar();
        $this->excepcion($usuario, $id, 'conceder');
        DB::table($tabla)->update(['activo' => false]);
        $this->assertFalse($servicio->permite($usuario->fresh(), 'usuarios.internos.leer'));
    }

    public static function audiencias(): array
    {
        return [
            ['interno', 'interno', true], ['interno', 'cliente', false], ['interno', 'ambos', true],
            ['cliente', 'interno', false], ['cliente', 'cliente', true], ['cliente', 'ambos', true],
        ];
    }

    #[DataProvider('audiencias')]
    public function test_audiencia_se_resuelve_segun_tipo(string $tipo, string $audiencia, bool $esperado): void
    {
        [$usuario, $id, $servicio] = $this->preparar('general', $audiencia);
        $usuario->update(['tipo' => $tipo]);
        $this->excepcion($usuario, $id, 'conceder');
        $this->assertSame($esperado, $servicio->permite($usuario, 'usuarios.internos.leer'));
    }
}
