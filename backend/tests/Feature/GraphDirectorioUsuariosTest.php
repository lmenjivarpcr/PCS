<?php

namespace Tests\Feature;

use App\Services\Directorio\DirectorioUsuarios;
use App\Services\Directorio\GraphDirectorioUsuarios;
use Illuminate\Http\Client\Request;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GraphDirectorioUsuariosTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'pcs.microsoft.tenant_id' => 'tenant-prueba', 'pcs.microsoft.client_id' => 'client-prueba',
            'pcs.microsoft.client_secret' => 'secreto-prueba', 'pcs.directorio.dominios' => ['pcslatam.com'],
        ]);
        Http::preventStrayRequests();
    }

    private function cuenta(array $cambios = []): array
    {
        return array_replace([
            'id' => 'persona-1', 'displayName' => 'Alina Brisamar', 'mail' => 'alina@pcslatam.com',
            'jobTitle' => 'Analista', 'country' => 'El Salvador', 'accountEnabled' => true,
        ], $cambios);
    }

    public function test_autentica_busca_y_filtra_cuentas_deshabilitadas_y_dominios(): void
    {
        Http::fake([
            'login.microsoftonline.com/tenant-prueba/oauth2/v2.0/token' => Http::response(['access_token' => 'token-prueba', 'expires_in' => 3600]),
            'graph.microsoft.com/v1.0/users?*' => Http::response(['value' => [
                $this->cuenta(), $this->cuenta(['id' => 'deshabilitado', 'accountEnabled' => false]),
                $this->cuenta(['id' => 'externo', 'mail' => 'persona@otro.test']),
                $this->cuenta(['id' => 'sin-correo', 'mail' => null]),
                $this->cuenta(['id' => 'subdominio', 'mail' => 'persona@mal.pcslatam.com']),
            ]]),
        ]);
        $personas = app(GraphDirectorioUsuarios::class)->buscar('Alina');
        $this->assertCount(1, $personas);
        $this->assertSame('persona-1', $personas[0]->idExterno);
        $this->assertSame('Analista', $personas[0]->cargo);
        Http::assertSent(fn (Request $r): bool => $r->method() === 'POST'
            && $r['grant_type'] === 'client_credentials' && $r['scope'] === 'https://graph.microsoft.com/.default'
            && $r['client_id'] === 'client-prueba' && $r['client_secret'] === 'secreto-prueba');
        Http::assertSent(fn (Request $r): bool => $r->method() === 'GET'
            && $r->hasHeader('Authorization', 'Bearer token-prueba')
            && $r->hasHeader('ConsistencyLevel', 'eventual')
            && $r['$search'] === '"displayName:Alina" OR "mail:Alina"'
            && $r['$select'] === 'id,displayName,mail,jobTitle,country,accountEnabled' && $r['$top'] === 20);
        Http::assertSentCount(2);
    }

    public function test_reutiliza_token_entre_instancias_y_lo_renueva_antes_de_vencer(): void
    {
        $this->freezeTime();
        Http::fake([
            'login.microsoftonline.com/*' => Http::sequence()
                ->push(['access_token' => 'token-1', 'expires_in' => 120])
                ->push(['access_token' => 'token-2', 'expires_in' => 120]),
            'graph.microsoft.com/v1.0/users?*' => Http::response(['value' => []]),
        ]);
        app(GraphDirectorioUsuarios::class)->buscar('Alina');
        app(GraphDirectorioUsuarios::class)->buscar('Dario');
        Http::assertSentCount(3);
        $this->travel(121)->seconds();
        app(GraphDirectorioUsuarios::class)->buscar('Elia');
        Http::assertSentCount(5);
        Http::assertSent(fn (Request $r): bool => $r->method() === 'GET' && $r->hasHeader('Authorization', 'Bearer token-2'));
    }

    public function test_obtener_recupera_por_id_y_no_admite_cuenta_deshabilitada_o_inexistente(): void
    {
        Http::fake([
            'login.microsoftonline.com/*' => Http::response(['access_token' => 'token', 'expires_in' => 3600]),
            'graph.microsoft.com/v1.0/users/persona-1?*' => Http::response($this->cuenta()),
            'graph.microsoft.com/v1.0/users/inactivo?*' => Http::response($this->cuenta(['accountEnabled' => false])),
            'graph.microsoft.com/v1.0/users/externo?*' => Http::response($this->cuenta(['mail' => 'alina@otro.test'])),
            'graph.microsoft.com/v1.0/users/ausente?*' => Http::response([], 404),
        ]);
        $servicio = app(GraphDirectorioUsuarios::class);
        $this->assertSame('Alina Brisamar', $servicio->obtener('persona-1')?->nombre);
        $this->assertNull($servicio->obtener('inactivo'));
        $this->assertNull($servicio->obtener('externo'));
        $this->assertNull($servicio->obtener('ausente'));
        Http::assertSentCount(5);
    }

    public function test_error_de_graph_no_se_presenta_como_directorio_vacio(): void
    {
        Http::fake([
            'login.microsoftonline.com/*' => Http::response(['access_token' => 'token', 'expires_in' => 3600]),
            'graph.microsoft.com/v1.0/users?*' => Http::response(['error' => 'No disponible'], 503),
        ]);
        $this->expectException(RequestException::class);
        app(GraphDirectorioUsuarios::class)->buscar('Alina');
    }

    public function test_binding_selecciona_graph_segun_configuracion(): void
    {
        config(['pcs.directorio.driver' => 'graph']);
        $this->assertInstanceOf(GraphDirectorioUsuarios::class, app(DirectorioUsuarios::class));
    }
}
