<?php

namespace App\Services\Directorio;

readonly class PersonaDirectorio
{
    public function __construct(
        public string $idExterno,
        public string $nombre,
        public string $correo,
        public ?string $cargo = null,
        public ?string $pais = null,
    ) {}
}
