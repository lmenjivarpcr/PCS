<?php

namespace App\Services\Directorio;

class DominiosInternos
{
    public function permite(string $correo): bool
    {
        if (! filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        return in_array(mb_strtolower(substr(strrchr($correo, '@'), 1)), config('pcs.directorio.dominios', []), true);
    }
}
