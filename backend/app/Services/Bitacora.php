<?php

namespace App\Services;

use App\Models\RegistroBitacora;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class Bitacora
{
    public function registrar(string $accion, Model|string $entidad, string|int $entidadId, ?array $anterior, ?array $nuevo, ?User $actor = null): RegistroBitacora
    {
        $request = app()->bound('request') ? app('request') : null;

        return RegistroBitacora::query()->create([
            'actor_id' => $actor?->id,
            'accion' => $accion,
            'entidad' => $entidad instanceof Model ? $entidad->getTable() : $entidad,
            'entidad_id' => (string) $entidadId,
            'anterior' => $this->sinSecretos($anterior),
            'nuevo' => $this->sinSecretos($nuevo),
            'ip' => $request instanceof Request ? $request->ip() : null,
            'agente' => $request instanceof Request ? mb_substr((string) $request->userAgent(), 0, 255) : null,
        ]);
    }

    private function sinSecretos(?array $datos): ?array
    {
        if ($datos === null) {
            return null;
        }

        $limpios = [];
        foreach ($datos as $clave => $valor) {
            if (is_string($clave) && preg_match('/password|contrase[nñ]a|token|secret|authorization/i', $clave)) {
                continue;
            }
            $limpios[$clave] = is_array($valor) ? $this->sinSecretos($valor) : $valor;
        }

        return $limpios;
    }
}
