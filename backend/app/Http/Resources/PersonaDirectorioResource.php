<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PersonaDirectorioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $persona = $this->resource['persona'];

        return [
            'id_externo' => $persona->idExterno, 'nombre' => $persona->nombre,
            'correo' => $persona->correo, 'cargo' => $persona->cargo, 'pais' => $persona->pais,
            'registrado' => $this->resource['registrado'],
        ];
    }
}
