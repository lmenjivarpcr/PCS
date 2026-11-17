<?php

namespace App\Http\Middleware;

use App\Services\Autorizacion\PermisoService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerificarPermiso
{
    public function __construct(private PermisoService $permisos) {}

    public function handle(Request $request, Closure $next, string $codigo): Response
    {
        if (! $request->user() || ! $this->permisos->permite($request->user(), $codigo)) {
            return response()->json(['message' => 'No tiene permiso para realizar esta acción.'], 403);
        }

        return $next($request);
    }
}
