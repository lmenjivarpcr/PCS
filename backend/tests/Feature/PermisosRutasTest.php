<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class PermisosRutasTest extends TestCase
{
    /** @var list<string> */
    private const EXCEPCIONES = [];

    public function test_toda_ruta_api_bajo_sanctum_declara_permiso_explicito(): void
    {
        $protegidas = 0;
        foreach (Route::getRoutes() as $ruta) {
            $middleware = $ruta->gatherMiddleware();
            if (! str_starts_with($ruta->uri(), 'api/') || ! in_array('auth:sanctum', $middleware, true)) {
                continue;
            }
            $protegidas++;
            if (in_array($ruta->uri(), self::EXCEPCIONES, true)) {
                continue;
            }
            $permisos = array_filter($middleware, fn (string $m): bool => str_starts_with($m, 'permiso:') && mb_strlen($m) > 8);
            $this->assertNotEmpty($permisos, implode('|', $ruta->methods()).' '.$ruta->uri().' debe declarar permiso.');
        }
        $this->assertGreaterThan(0, $protegidas);
    }
}
