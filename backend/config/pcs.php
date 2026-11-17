<?php

return [

    'directorio' => [
        'driver' => env('PCS_DIRECTORIO_DRIVER', 'simulado'),
        'dominios' => array_values(array_filter(array_map(
            fn (string $dominio): string => mb_strtolower(trim($dominio)),
            explode(',', env('PCS_DOMINIOS_INTERNOS', 'pcslatam.com') ?: 'pcslatam.com'),
        ))),
    ],

    'microsoft' => [
        'tenant_id' => env('PCS_MICROSOFT_TENANT_ID'),
        'client_id' => env('PCS_MICROSOFT_CLIENT_ID'),
        'client_secret' => env('PCS_MICROSOFT_CLIENT_SECRET'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Superadministrador
    |--------------------------------------------------------------------------
    |
    | Usuario interno que el seeder crea con el perfil de administrador y todos
    | los permisos del catálogo. Sus datos se definen en el .env de cada ambiente.
    |
    */

    'superadministrador' => [
        'nombre' => env('PCS_SUPERADMIN_NOMBRE'),
        'correo' => env('PCS_SUPERADMIN_CORREO'),
    ],

];
