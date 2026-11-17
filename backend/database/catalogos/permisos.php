<?php

return [
    [
        'codigo' => 'usuarios', 'nombre' => 'Usuarios',
        'grupos' => [
            [
                'codigo' => 'internos', 'nombre' => 'Usuarios internos',
                'permisos' => [
                    ['codigo' => 'usuarios.internos.leer', 'nombre' => 'Consultar usuarios internos', 'audiencia' => 'interno', 'contexto' => 'general'],
                    ['codigo' => 'usuarios.internos.crear', 'nombre' => 'Crear usuarios internos', 'audiencia' => 'interno', 'contexto' => 'general'],
                    ['codigo' => 'usuarios.internos.editar', 'nombre' => 'Editar usuarios internos', 'audiencia' => 'interno', 'contexto' => 'general'],
                ],
            ],
        ],
    ],
    [
        'codigo' => 'administracion', 'nombre' => 'Administración',
        'grupos' => [
            [
                'codigo' => 'bitacora', 'nombre' => 'Bitácora',
                'permisos' => [
                    ['codigo' => 'administracion.bitacora.leer', 'nombre' => 'Consultar bitácora', 'audiencia' => 'interno', 'contexto' => 'general'],
                ],
            ],
        ],
    ],
];
