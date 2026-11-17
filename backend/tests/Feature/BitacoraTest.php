<?php

namespace Tests\Feature;

use App\Models\RegistroBitacora;
use App\Models\User;
use App\Services\Bitacora;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use LogicException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class BitacoraTest extends TestCase
{
    use RefreshDatabase;

    public function test_registra_actor_fecha_request_y_elimina_secretos_anidados(): void
    {
        $actor = User::factory()->create();
        $this->app['request']->server->set('REMOTE_ADDR', '2001:db8::1');
        $this->app['request']->headers->set('User-Agent', str_repeat('a', 300));
        $registro = app(Bitacora::class)->registrar('usuario.creado', $actor, $actor->id, [
            'contrasena' => 'no-guardar', 'password' => 'no-guardar', 'nombre' => 'Anterior',
        ], ['nombre' => 'Nuevo', 'identidad' => ['access_token' => 'no-guardar', 'refresh_token' => 'no-guardar', 'id' => 2]], $actor)->refresh();
        $this->assertSame(['nombre' => 'Anterior'], $registro->anterior);
        $this->assertSame(['nombre' => 'Nuevo', 'identidad' => ['id' => 2]], $registro->nuevo);
        $this->assertSame('usuarios', $registro->entidad);
        $this->assertSame('2001:db8::1', $registro->ip);
        $this->assertSame(255, mb_strlen($registro->agente));
        $this->assertNotNull($registro->ocurrido_en);
    }

    public static function mutaciones(): array
    {
        return [['save'], ['update'], ['delete'], ['deleteQuietly'], ['forceDelete'], ['updateQuietly']];
    }

    #[DataProvider('mutaciones')]
    public function test_modelo_rechaza_modificar_y_borrar_incluso_sin_eventos(string $metodo): void
    {
        $registro = app(Bitacora::class)->registrar('prueba', 'usuarios', 1, null, null);
        $this->expectException(LogicException::class);
        if ($metodo === 'save') {
            $registro->accion = 'alterado';
            $registro->save();
        } elseif (in_array($metodo, ['update', 'updateQuietly'], true)) {
            $registro->$metodo(['accion' => 'alterado']);
        } else {
            $registro->$metodo();
        }
    }

    public function test_registro_participa_en_la_transaccion_y_admite_actor_nulo_sin_request(): void
    {
        $this->app->offsetUnset('request');
        DB::beginTransaction();
        $registro = app(Bitacora::class)->registrar('prueba', 'usuarios', 'externo', null, null);
        $this->assertNull($registro->actor_id);
        $this->assertNull($registro->ip);
        $this->assertNull($registro->agente);
        DB::rollBack();
        $this->assertDatabaseCount('bitacora', 0);
    }

    public static function mutacionesMasivas(): array
    {
        return [['update'], ['delete'], ['forceDelete'], ['increment'], ['decrement'], ['upsert']];
    }

    #[DataProvider('mutacionesMasivas')]
    public function test_consultas_del_modelo_tambien_rechazan_mutaciones(string $metodo): void
    {
        app(Bitacora::class)->registrar('prueba', 'usuarios', 1, null, null);
        $query = RegistroBitacora::query();
        $this->expectException(LogicException::class);
        match ($metodo) {
            'update' => $query->update(['accion' => 'alterado']),
            'increment', 'decrement' => $query->$metodo('actor_id'),
            'upsert' => $query->upsert([['id' => 1, 'accion' => 'alterado']], ['id']),
            default => $query->$metodo(),
        };
    }
}
