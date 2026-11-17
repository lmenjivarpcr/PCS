<?php

return [

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
