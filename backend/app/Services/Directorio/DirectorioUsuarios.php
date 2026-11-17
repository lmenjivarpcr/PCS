<?php

namespace App\Services\Directorio;

interface DirectorioUsuarios
{
    /** @return list<PersonaDirectorio> */
    public function buscar(string $texto): array;

    public function obtener(string $idExterno): ?PersonaDirectorio;
}
