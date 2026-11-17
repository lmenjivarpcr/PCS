<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioInternoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'nombre' => $this->nombre, 'correo' => $this->correo,
            'perfil' => new PerfilResource($this->whenLoaded('perfil')),
            'activo' => $this->activo, 'version' => $this->version,
            'creado_en' => $this->creado_en?->toISOString(),
            'actualizado_en' => $this->actualizado_en?->toISOString(),
        ];
    }
}
